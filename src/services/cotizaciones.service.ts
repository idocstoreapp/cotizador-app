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
import { asignarTrabajadoresACotizacion } from './cotizacion-trabajadores.service';

/**
 * Genera un número único de cotización según la empresa
 * Formato: PREFIJO-NNNN (ej: C-400, K-1000)
 * @param empresa - Empresa que genera la cotización
 * @returns Número de cotización único
 */
async function generarNumeroCotizacion(empresa: 'casablanca' | 'kubica'): Promise<string> {
  const { EMPRESAS } = await import('../types/empresas');
  const empresaInfo = EMPRESAS[empresa];
  
  // Obtener el último número de cotización de esta empresa
  const { data: ultimaCotizacion, error } = await supabase
    .from('cotizaciones')
    .select('numero')
    .eq('empresa', empresa)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error al obtener última cotización:', error);
  }

  let siguienteNumero = empresaInfo.numeroInicial;

  if (ultimaCotizacion?.numero) {
    // Extraer el número de la última cotización
    // Formato esperado: PREFIJO-NNNN
    const partes = ultimaCotizacion.numero.split('-');
    if (partes.length >= 2) {
      const ultimoNumero = parseInt(partes[partes.length - 1], 10);
      if (!isNaN(ultimoNumero)) {
        siguienteNumero = ultimoNumero + 1;
      }
    }
  }

  return `${empresaInfo.prefijoNumero}-${siguienteNumero}`;
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

  // Obtener los IDs únicos de usuarios y vendedores
  const usuarioIds = [...new Set(cotizaciones.map(c => c.usuario_id).filter(Boolean))];
  const vendedorIds = [...new Set(cotizaciones.map(c => c.vendedor_id).filter(Boolean))];
  const todosLosIds = [...new Set([...usuarioIds, ...vendedorIds])];
  
  // Cargar los perfiles por separado
  let perfiles: any[] = [];
  if (todosLosIds.length > 0) {
    const { data: perfilesData, error: perfilesError } = await supabase
      .from('perfiles')
      .select('id, nombre, email, role')
      .in('id', todosLosIds);
    
    if (!perfilesError && perfilesData) {
      perfiles = perfilesData;
    }
  }

  // Combinar cotizaciones con perfiles
  const cotizacionesConUsuario = cotizaciones.map(cotizacion => {
    const perfil = perfiles.find(p => p.id === cotizacion.usuario_id);
    const vendedor = cotizacion.vendedor_id 
      ? perfiles.find(p => p.id === cotizacion.vendedor_id)
      : null;
    return {
      ...cotizacion,
      usuario: perfil || null,
      vendedor: vendedor || null
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
  
  // Cargar usuario y vendedor por separado
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
  
  // Cargar vendedor si existe
  if (data.vendedor_id) {
    const { data: vendedor } = await supabase
      .from('perfiles')
      .select('id, nombre, email, role')
      .eq('id', data.vendedor_id)
      .single();
    
    if (vendedor) {
      cotizacionConUsuario = { ...cotizacionConUsuario, vendedor: vendedor as any };
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
  items?: any[], // Items completos con toda su información
  subtotalDesdeItems?: number, // Subtotal calculado desde items
  descuento?: number, // Descuento aplicado
  ivaDesdeItems?: number, // IVA calculado desde items
  totalDesdeItems?: number, // Total calculado desde items
  empresa?: 'casablanca' | 'kubica', // Empresa que genera la cotización
  vendedorId?: string // ID del vendedor que genera la cotización
): Promise<Cotizacion> {
  // Si hay items, calcular totales desde los items (más preciso)
  let subtotal = 0;
  let subtotalMateriales = 0;
  let subtotalServicios = 0;
  let iva = 0;
  let total = 0;
  let margenGanancia = cotizacion.margen_ganancia || 30;

  if (items && items.length > 0 && totalDesdeItems !== undefined) {
    // Usar totales calculados desde items (más preciso)
    subtotal = subtotalDesdeItems || items.reduce((sum, item) => sum + (item.precio_total || 0), 0);
    iva = ivaDesdeItems || 0;
    total = totalDesdeItems;
    
    // Calcular subtotales de materiales y servicios para referencia
    const calculos = calcularCotizacionCompleta(
      cotizacion.materiales,
      cotizacion.servicios,
      margenGanancia
    );
    subtotalMateriales = calculos.subtotalMateriales;
    subtotalServicios = calculos.subtotalServicios;
  } else {
    // Fallback: calcular desde materiales y servicios (método antiguo)
    const calculos = calcularCotizacionCompleta(
      cotizacion.materiales,
      cotizacion.servicios,
      margenGanancia
    );
    subtotal = calculos.subtotal;
    subtotalMateriales = calculos.subtotalMateriales;
    subtotalServicios = calculos.subtotalServicios;
    iva = calculos.iva;
    total = calculos.total;
  }

  // Generar número de cotización según empresa
  const numeroCotizacion = empresa 
    ? await generarNumeroCotizacion(empresa)
    : `COT-${Date.now()}`; // Fallback si no hay empresa

  // Crear la cotización
  const { data, error } = await supabase
    .from('cotizaciones')
    .insert({
      numero: numeroCotizacion,
      empresa: empresa || null,
      cliente_nombre: cotizacion.cliente_nombre,
      cliente_email: cotizacion.cliente_email || null,
      cliente_telefono: cotizacion.cliente_telefono || null,
      cliente_direccion: cotizacion.cliente_direccion || null,
      materiales: cotizacion.materiales,
      servicios: cotizacion.servicios,
      items: items || [], // Guardar items completos
      subtotal_materiales: subtotalMateriales,
      subtotal_servicios: subtotalServicios,
      subtotal: subtotal,
      iva: iva,
      margen_ganancia: margenGanancia,
      total: total,
      estado: 'pendiente',
      usuario_id: usuarioId,
      vendedor_id: vendedorId || null,
      pago_vendedor: 0, // Inicialmente 0, se actualiza al aceptar
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
  usuarioIdModificacion?: string,
  subtotalDesdeItems?: number,
  descuento?: number,
  ivaDesdeItems?: number,
  totalDesdeItems?: number
): Promise<Cotizacion> {
  // Obtener cotización actual para comparar
  const cotizacionActual = await obtenerCotizacionPorId(id);
  if (!cotizacionActual) {
    throw new Error('Cotización no encontrada');
  }

  const totalAnterior = cotizacionActual.total;

  // Usar totales pasados como parámetros o calcular desde items
  let subtotalCalc: number | undefined = subtotalDesdeItems;
  let ivaCalc: number | undefined = ivaDesdeItems;
  let totalCalc: number | undefined = totalDesdeItems;
  
  if (items && items.length > 0 && !totalDesdeItems) {
    // Calcular desde items si no se pasaron totales
    subtotalCalc = items.reduce((sum, item) => sum + (item.precio_total || 0), 0);
    const descuentoValor = descuento || 0;
    const descuentoMonto = subtotalCalc * (descuentoValor / 100);
    const subtotalConDescuento = subtotalCalc - descuentoMonto;
    const ivaPorcentaje = 19;
    ivaCalc = subtotalConDescuento * (ivaPorcentaje / 100);
    totalCalc = subtotalConDescuento + ivaCalc;
  }

  // Actualizar la cotización
  const cotizacionActualizada = await actualizarCotizacion(
    id, 
    cotizacion, 
    items,
    subtotalCalc,
    descuento,
    ivaCalc,
    totalCalc
  );

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
  items?: any[],
  subtotalDesdeItems?: number,
  descuento?: number,
  ivaDesdeItems?: number,
  totalDesdeItems?: number
): Promise<Cotizacion> {
  // Obtener cotización actual para tener los valores completos
  const actual = await obtenerCotizacionPorId(id);
  if (!actual) {
    throw new Error('Cotización no encontrada');
  }

  // Si hay items, calcular totales desde los items (más preciso)
  let subtotal = 0;
  let subtotalMateriales = 0;
  let subtotalServicios = 0;
  let iva = 0;
  let total = 0;
  let margenGanancia = cotizacion.margen_ganancia ?? actual.margen_ganancia ?? 30;

  if (items && items.length > 0 && totalDesdeItems !== undefined) {
    // Usar totales calculados desde items (más preciso)
    subtotal = subtotalDesdeItems || items.reduce((sum, item) => sum + (item.precio_total || 0), 0);
    iva = ivaDesdeItems || 0;
    total = totalDesdeItems;
    
    // Calcular subtotales de materiales y servicios para referencia
    const materiales = cotizacion.materiales || actual.materiales;
    const servicios = cotizacion.servicios || actual.servicios;
    const calculos = calcularCotizacionCompleta(materiales, servicios, margenGanancia);
    subtotalMateriales = calculos.subtotalMateriales;
    subtotalServicios = calculos.subtotalServicios;
  } else if (cotizacion.materiales || cotizacion.servicios) {
    // Fallback: calcular desde materiales y servicios
    const materiales = cotizacion.materiales || actual.materiales;
    const servicios = cotizacion.servicios || actual.servicios;
    const calculos = calcularCotizacionCompleta(materiales, servicios, margenGanancia);
    subtotal = calculos.subtotal;
    subtotalMateriales = calculos.subtotalMateriales;
    subtotalServicios = calculos.subtotalServicios;
    iva = calculos.iva;
    total = calculos.total;
  } else {
    // Mantener valores actuales
    subtotal = actual.subtotal;
    subtotalMateriales = actual.subtotal_materiales;
    subtotalServicios = actual.subtotal_servicios;
    iva = actual.iva;
    total = actual.total;
  }

  const datosActualizacion: any = {
    ...cotizacion,
    items: items || actual.items, // Asegurarse de guardar los items actualizados
    subtotal_materiales: subtotalMateriales,
    subtotal_servicios: subtotalServicios,
    subtotal: subtotal,
    iva: iva,
    margen_ganancia: margenGanancia,
    total: total,
    updated_at: new Date().toISOString()
  };

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
 * Obtiene todas las cotizaciones de un cliente por nombre o email
 * @param clienteNombre - Nombre del cliente
 * @param clienteEmail - Email del cliente (opcional)
 * @returns Lista de cotizaciones del cliente
 */
export async function obtenerCotizacionesPorCliente(
  clienteNombre: string,
  clienteEmail?: string
): Promise<Cotizacion[]> {
  let query = supabase
    .from('cotizaciones')
    .select('*')
    .eq('cliente_nombre', clienteNombre)
    .order('created_at', { ascending: false });

  // Si hay email, también buscar por email
  if (clienteEmail) {
    query = query.or(`cliente_nombre.eq.${clienteNombre},cliente_email.eq.${clienteEmail}`);
  }

  const { data: cotizaciones, error } = await query;

  if (error) throw error;
  if (!cotizaciones || cotizaciones.length === 0) return [];

  // Cargar usuarios y vendedores
  const usuarioIds = [...new Set(cotizaciones.map(c => c.usuario_id).filter(Boolean))];
  const vendedorIds = [...new Set(cotizaciones.map(c => c.vendedor_id).filter(Boolean))];
  const todosLosIds = [...new Set([...usuarioIds, ...vendedorIds])];
  
  let perfiles: any[] = [];
  if (todosLosIds.length > 0) {
    const { data: perfilesData } = await supabase
      .from('perfiles')
      .select('id, nombre, email, role')
      .in('id', todosLosIds);
    if (perfilesData) perfiles = perfilesData;
  }

  return cotizaciones.map(cotizacion => {
    const perfil = perfiles.find(p => p.id === cotizacion.usuario_id);
    const vendedor = cotizacion.vendedor_id 
      ? perfiles.find(p => p.id === cotizacion.vendedor_id)
      : null;
    return {
      ...cotizacion,
      usuario: perfil || null,
      vendedor: vendedor || null
    } as Cotizacion;
  });
}

/**
 * Actualiza el estado de pago de una cotización
 * @param id - ID de la cotización
 * @param estadoPago - Nuevo estado de pago
 * @param montoPagado - Monto pagado hasta el momento
 * @returns Cotización actualizada
 */
export async function actualizarEstadoPagoCotizacion(
  id: string,
  estadoPago: 'no_pagado' | 'pago_parcial' | 'pagado',
  montoPagado: number
): Promise<Cotizacion> {
  const { data, error } = await supabase
    .from('cotizaciones')
    .update({
      estado_pago: estadoPago,
      monto_pagado: montoPagado,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as Cotizacion;
}

/**
 * Cambia el estado de una cotización
 * @param id - ID de la cotización
 * @param estado - Nuevo estado
 * @param empleadosAsignados - IDs de empleados asignados (deprecated, usar trabajadores)
 * @param pagoVendedor - Monto del pago al vendedor (solo para aceptada)
 * @param trabajadores - Array de trabajadores con sus pagos (solo para aceptada)
 * @returns Cotización actualizada
 */
export async function cambiarEstadoCotizacion(
  id: string,
  estado: 'pendiente' | 'aceptada' | 'rechazada',
  empleadosAsignados?: string[], // Deprecated, mantener por compatibilidad
  pagoVendedor?: number,
  trabajadores?: Array<{
    trabajadorId: string;
    pagoTrabajador: number;
    notas?: string;
  }>
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
      // Actualizar empresa del cliente si no tiene una asignada
      if (!clienteExistente.empresa && cotizacion.empresa) {
        await supabase
          .from('clientes')
          .update({ empresa: cotizacion.empresa })
          .eq('id', clienteId);
      }
    } else {
      // Crear nuevo cliente con la empresa de la cotización
      const nuevoCliente = await crearCliente({
        nombre: cotizacion.cliente_nombre,
        email: cotizacion.cliente_email,
        telefono: cotizacion.cliente_telefono,
        direccion: cotizacion.cliente_direccion,
        empresa: cotizacion.empresa
      });
      clienteId = nuevoCliente.id;
    }

    // Crear trabajo
    await crearTrabajo({
      cliente_id: clienteId,
      cotizacion_id: id,
      empleados_asignados: empleadosAsignados || []
    });

    // Asignar trabajadores de taller si se proporcionaron
    if (trabajadores && trabajadores.length > 0) {
      await asignarTrabajadoresACotizacion(id, trabajadores);
    }
  }

  // Preparar datos de actualización
  const datosActualizacion: any = {
    estado,
    updated_at: new Date().toISOString()
  };

  // Si se acepta y hay pago de vendedor, actualizarlo
  if (estado === 'aceptada' && pagoVendedor !== undefined) {
    datosActualizacion.pago_vendedor = pagoVendedor;
  }

  // Actualizar estado de la cotización
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


