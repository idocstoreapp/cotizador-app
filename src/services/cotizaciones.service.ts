/**
 * Servicio para gestión de cotizaciones
 * CRUD completo de cotizaciones
 */
import { supabase } from '../utils/supabase';
import type { Cotizacion, CotizacionMaterial, CotizacionServicio } from '../types/database';
import type { CotizacionInput } from '../schemas/validations';
import { calcularCotizacionCompleta } from '../utils/calcularCotizacion';
import { crearCliente, buscarCliente } from './clientes.service';
import { crearTrabajo } from './trabajos.service';

/**
 * Genera un número único de cotización
 * Formato: COT-YYYYMMDD-XXX
 */
function generarNumeroCotizacion(): string {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `COT-${año}${mes}${dia}-${random}`;
}

/**
 * Obtiene todas las cotizaciones
 * @param usuarioId - Si se proporciona, filtra por usuario
 * @returns Lista de cotizaciones
 */
export async function obtenerCotizaciones(usuarioId?: string): Promise<Cotizacion[]> {
  // Primero obtener las cotizaciones sin el join
  let query = supabase
    .from('cotizaciones')
    .select('*')
    .order('created_at', { ascending: false });

  // Si se proporciona usuarioId, filtrar por usuario
  if (usuarioId) {
    query = query.eq('usuario_id', usuarioId);
  }

  const { data: cotizaciones, error } = await query;

  if (error) throw error;
  if (!cotizaciones || cotizaciones.length === 0) return [];

  // Obtener los IDs únicos de usuarios
  const usuarioIds = [...new Set(cotizaciones.map(c => c.usuario_id).filter(Boolean))];
  
  // Cargar los perfiles por separado
  let perfiles: any[] = [];
  if (usuarioIds.length > 0) {
    const { data: perfilesData, error: perfilesError } = await supabase
      .from('perfiles')
      .select('id, nombre, email, role')
      .in('id', usuarioIds);
    
    if (!perfilesError && perfilesData) {
      perfiles = perfilesData;
    }
  }

  // Combinar cotizaciones con perfiles
  const cotizacionesConUsuario = cotizaciones.map(cotizacion => {
    const perfil = perfiles.find(p => p.id === cotizacion.usuario_id);
    return {
      ...cotizacion,
      usuario: perfil || null
    } as Cotizacion;
  });

  return cotizacionesConUsuario;
}

/**
 * Obtiene una cotización por ID
 * @param id - ID de la cotización
 * @returns Cotización o null
 */
export async function obtenerCotizacionPorId(id: string): Promise<Cotizacion | null> {
  const { data, error } = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;
  
  // Cargar usuario por separado
  let cotizacionConUsuario = data as Cotizacion;
  if (data.usuario_id) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, nombre, email, role')
      .eq('id', data.usuario_id)
      .single();
    
    if (perfil) {
      cotizacionConUsuario = { ...cotizacionConUsuario, usuario: perfil as any };
    }
  }
  
  return cotizacionConUsuario;
}

/**
 * Crea una nueva cotización
 * @param cotizacion - Datos de la cotización
 * @param usuarioId - ID del usuario que crea la cotización
 * @param items - Items completos de la cotización (opcional, para guardar detalles completos)
 * @returns Cotización creada
 */
export async function crearCotizacion(
  cotizacion: CotizacionInput,
  usuarioId: string,
  items?: any[] // Items completos con toda su información
): Promise<Cotizacion> {
  // Calcular totales
  const calculos = calcularCotizacionCompleta(
    cotizacion.materiales,
    cotizacion.servicios,
    cotizacion.margen_ganancia
  );

  // Crear la cotización
  const { data, error } = await supabase
    .from('cotizaciones')
    .insert({
      numero: generarNumeroCotizacion(),
      cliente_nombre: cotizacion.cliente_nombre,
      cliente_email: cotizacion.cliente_email || null,
      cliente_telefono: cotizacion.cliente_telefono || null,
      cliente_direccion: cotizacion.cliente_direccion || null,
      materiales: cotizacion.materiales,
      servicios: cotizacion.servicios,
      items: items || [], // Guardar items completos
      subtotal_materiales: calculos.subtotalMateriales,
      subtotal_servicios: calculos.subtotalServicios,
      subtotal: calculos.subtotal,
      iva: calculos.iva,
      margen_ganancia: calculos.margenGanancia,
      total: calculos.total,
      estado: 'pendiente',
      usuario_id: usuarioId,
      notas: cotizacion.notas || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Cotizacion;
}

/**
 * Actualiza una cotización existente con registro de historial
 * @param id - ID de la cotización
 * @param cotizacion - Datos actualizados
 * @param items - Items actualizados (opcional)
 * @param descripcionModificacion - Descripción de por qué se hizo la modificación
 * @param usuarioIdModificacion - ID del usuario que hace la modificación
 * @returns Cotización actualizada
 */
export async function actualizarCotizacionConHistorial(
  id: string,
  cotizacion: Partial<CotizacionInput>,
  items?: any[],
  descripcionModificacion?: string,
  usuarioIdModificacion?: string
): Promise<Cotizacion> {
  // Obtener cotización actual para comparar
  const cotizacionActual = await obtenerCotizacionPorId(id);
  if (!cotizacionActual) {
    throw new Error('Cotización no encontrada');
  }

  const totalAnterior = cotizacionActual.total;

  // Actualizar la cotización
  const cotizacionActualizada = await actualizarCotizacion(id, cotizacion, items);

  // Si hay descripción de modificación y usuario, crear registro en historial
  if (descripcionModificacion && usuarioIdModificacion) {
    const cambios = {
      materiales: {
        anterior: cotizacionActual.materiales,
        nuevo: cotizacionActualizada.materiales
      },
      servicios: {
        anterior: cotizacionActual.servicios,
        nuevo: cotizacionActualizada.servicios
      },
      items: {
        anterior: cotizacionActual.items || [],
        nuevo: cotizacionActualizada.items || []
      },
      total: {
        anterior: totalAnterior,
        nuevo: cotizacionActualizada.total
      }
    };

    // Importar dinámicamente para evitar dependencias circulares
    const { crearRegistroModificacion } = await import('./historial-modificaciones.service');
    await crearRegistroModificacion(
      id,
      usuarioIdModificacion,
      descripcionModificacion,
      cambios,
      totalAnterior,
      cotizacionActualizada.total
    );
  }

  return cotizacionActualizada;
}

/**
 * Actualiza una cotización existente
 * @param id - ID de la cotización
 * @param cotizacion - Datos actualizados
 * @param items - Items actualizados (opcional)
 * @returns Cotización actualizada
 */
export async function actualizarCotizacion(
  id: string,
  cotizacion: Partial<CotizacionInput>,
  items?: any[]
): Promise<Cotizacion> {
  // Si se actualizan materiales o servicios, recalcular
  let calculos = null;
  if (cotizacion.materiales || cotizacion.servicios) {
    // Obtener cotización actual para tener los valores completos
    const actual = await obtenerCotizacionPorId(id);
    if (actual) {
      const materiales = cotizacion.materiales || actual.materiales;
      const servicios = cotizacion.servicios || actual.servicios;
      const margen = cotizacion.margen_ganancia ?? actual.margen_ganancia;
      
      calculos = calcularCotizacionCompleta(materiales, servicios, margen);
    }
  }

  const datosActualizacion: any = {
    ...cotizacion,
    updated_at: new Date().toISOString()
  };

  // Si hay cálculos, actualizar los totales
  if (calculos) {
    datosActualizacion.subtotal_materiales = calculos.subtotalMateriales;
    datosActualizacion.subtotal_servicios = calculos.subtotalServicios;
    datosActualizacion.subtotal = calculos.subtotal;
    datosActualizacion.iva = calculos.iva;
    datosActualizacion.total = calculos.total;
  }

  const { data, error } = await supabase
    .from('cotizaciones')
    .update(datosActualizacion)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  
  // Cargar el usuario por separado si es necesario
  let cotizacionConUsuario = data as Cotizacion;
  if (data.usuario_id) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, nombre, email, role')
      .eq('id', data.usuario_id)
      .single();
    
    if (perfil) {
      cotizacionConUsuario = { ...cotizacionConUsuario, usuario: perfil as any };
    }
  }
  
  return cotizacionConUsuario;
}

/**
 * Elimina una cotización
 * @param id - ID de la cotización
 */
export async function eliminarCotizacion(id: string): Promise<void> {
  const { error } = await supabase
    .from('cotizaciones')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Cambia el estado de una cotización
 * @param id - ID de la cotización
 * @param estado - Nuevo estado
 * @returns Cotización actualizada
 */
export async function cambiarEstadoCotizacion(
  id: string,
  estado: 'pendiente' | 'aceptada' | 'rechazada',
  empleadosAsignados?: string[]
): Promise<Cotizacion> {
  // Obtener la cotización actual
  const cotizacion = await obtenerCotizacionPorId(id);
  if (!cotizacion) {
    throw new Error('Cotización no encontrada');
  }

  // Si se acepta, crear cliente y trabajo
  if (estado === 'aceptada') {
    // Buscar si el cliente ya existe
    let clienteId: string;
    const clienteExistente = await buscarCliente(
      cotizacion.cliente_email,
      cotizacion.cliente_telefono
    );

    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else {
      // Crear nuevo cliente
      const nuevoCliente = await crearCliente({
        nombre: cotizacion.cliente_nombre,
        email: cotizacion.cliente_email,
        telefono: cotizacion.cliente_telefono,
        direccion: cotizacion.cliente_direccion
      });
      clienteId = nuevoCliente.id;
    }

    // Crear trabajo
    await crearTrabajo({
      cliente_id: clienteId,
      cotizacion_id: id,
      empleados_asignados: empleadosAsignados || []
    });
  }

  // Actualizar estado de la cotización
  const { data, error } = await supabase
    .from('cotizaciones')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  
  // Cargar el usuario por separado si es necesario
  let cotizacionConUsuario = data as Cotizacion;
  if (data.usuario_id) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, nombre, email, role')
      .eq('id', data.usuario_id)
      .single();
    
    if (perfil) {
      cotizacionConUsuario = { ...cotizacionConUsuario, usuario: perfil as any };
    }
  }
  
  return cotizacionConUsuario;
}


