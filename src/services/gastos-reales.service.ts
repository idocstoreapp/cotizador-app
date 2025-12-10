/**
 * Servicio para gestionar gastos reales de materiales
 * Permite registrar compras reales y comparar con presupuesto
 */
import { supabase } from '../utils/supabase';
import type { GastoRealMaterial } from '../types/database';

/**
 * Crea un registro de gasto real de material
 */
export async function crearGastoReal(gasto: {
  cotizacion_id: string;
  item_id: string;
  material_id?: string;
  material_nombre: string;
  cantidad_presupuestada: number;
  cantidad_real: number;
  precio_unitario_presupuestado: number;
  precio_unitario_real: number;
  unidad: string;
  fecha_compra: string;
  proveedor?: string;
  numero_factura?: string;
  notas?: string;
  alcance_gasto?: 'unidad' | 'parcial' | 'total';
  cantidad_items_aplicados?: number;
}): Promise<GastoRealMaterial> {
  try {
    // Validar datos antes de enviar
    if (!gasto.cotizacion_id || !gasto.item_id || !gasto.material_nombre) {
      throw new Error('Faltan datos requeridos: cotizacion_id, item_id o material_nombre');
    }

    if (gasto.cantidad_real <= 0 || gasto.precio_unitario_real <= 0) {
      throw new Error('La cantidad y precio unitario real deben ser mayores a 0');
    }

    console.log('📤 Creando gasto real:', {
      cotizacion_id: gasto.cotizacion_id,
      item_id: gasto.item_id,
      material_nombre: gasto.material_nombre,
      cantidad_real: gasto.cantidad_real,
      precio_unitario_real: gasto.precio_unitario_real
    });

    // Verificar sesión antes de hacer la petición
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
    }

    // Asegurar que la fecha esté en formato ISO
    let fechaCompra = gasto.fecha_compra;
    if (fechaCompra && !fechaCompra.includes('T')) {
      // Si es solo fecha (YYYY-MM-DD), convertir a ISO
      fechaCompra = new Date(fechaCompra + 'T00:00:00').toISOString();
    } else if (!fechaCompra) {
      fechaCompra = new Date().toISOString();
    }

    const datosInsert = {
      cotizacion_id: gasto.cotizacion_id,
      item_id: gasto.item_id,
      material_id: gasto.material_id || null,
      material_nombre: gasto.material_nombre.trim(),
      cantidad_presupuestada: Number(gasto.cantidad_presupuestada),
      cantidad_real: Number(gasto.cantidad_real),
      precio_unitario_presupuestado: Number(gasto.precio_unitario_presupuestado),
      precio_unitario_real: Number(gasto.precio_unitario_real),
      unidad: gasto.unidad,
      fecha_compra: fechaCompra,
      proveedor: gasto.proveedor?.trim() || null,
      numero_factura: gasto.numero_factura?.trim() || null,
      notas: gasto.notas?.trim() || null,
      alcance_gasto: gasto.alcance_gasto || 'unidad',
      cantidad_items_aplicados: gasto.cantidad_items_aplicados ? Number(gasto.cantidad_items_aplicados) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📤 Datos a insertar:', datosInsert);

    const { data, error } = await supabase
      .from('gastos_reales_materiales')
      .insert(datosInsert)
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase:', error);
      
      // Mejorar mensajes de error
      let mensajeError = error.message || 'Error desconocido';
      
      if (error.code === '23505') {
        mensajeError = 'Este gasto ya existe. Por favor, verifica los datos.';
      } else if (error.code === '23503') {
        mensajeError = 'Error de referencia: La cotización o item no existe.';
      } else if (error.code === '42501') {
        mensajeError = 'No tienes permisos para crear este gasto. Verifica tu sesión.';
      } else if (error.message?.includes('JWT') || error.message?.includes('token')) {
        mensajeError = 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        mensajeError = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
      }
      
      throw new Error(mensajeError);
    }

    if (!data) {
      throw new Error('No se recibieron datos del servidor. Intenta nuevamente.');
    }

    console.log('✅ Gasto real creado exitosamente:', data.id);
    return data as GastoRealMaterial;
  } catch (error: any) {
    console.error('❌ Error completo al crear gasto real:', error);
    
    // Si es un error de red, proporcionar más información
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Error de conexión con el servidor. Verifica tu conexión a internet y que Supabase esté disponible. Si el problema persiste, recarga la página.');
    }
    
    // Re-lanzar el error con el mensaje mejorado
    throw error;
  }
}

/**
 * Obtiene todos los gastos reales de una cotización
 */
export async function obtenerGastosRealesPorCotizacion(cotizacionId: string): Promise<GastoRealMaterial[]> {
  const { data, error } = await supabase
    .from('gastos_reales_materiales')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('fecha_compra', { ascending: false });

  if (error) throw error;
  return data as GastoRealMaterial[];
}

/**
 * Obtiene gastos reales por item
 */
export async function obtenerGastosRealesPorItem(cotizacionId: string, itemId: string): Promise<GastoRealMaterial[]> {
  const { data, error } = await supabase
    .from('gastos_reales_materiales')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .eq('item_id', itemId)
    .order('fecha_compra', { ascending: false });

  if (error) throw error;
  return data as GastoRealMaterial[];
}

/**
 * Actualiza un gasto real
 */
export async function actualizarGastoReal(
  id: string,
  updates: Partial<{
    cantidad_real: number;
    precio_unitario_real: number;
    fecha_compra: string;
    proveedor: string;
    numero_factura: string;
    notas: string;
    alcance_gasto: 'unidad' | 'parcial' | 'total';
    cantidad_items_aplicados: number;
  }>
): Promise<GastoRealMaterial> {
  const { data, error } = await supabase
    .from('gastos_reales_materiales')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as GastoRealMaterial;
}

/**
 * Elimina un gasto real
 */
export async function eliminarGastoReal(id: string): Promise<void> {
  const { error } = await supabase
    .from('gastos_reales_materiales')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Obtiene resumen comparativo de presupuesto vs real para una cotización
 */
export async function obtenerResumenComparativo(cotizacionId: string): Promise<{
  totalPresupuestado: number;
  totalReal: number;
  diferencia: number;
  diferenciaPorcentaje: number;
  items: Array<{
    material_nombre: string;
    cantidad_presupuestada: number;
    cantidad_real: number;
    diferencia_cantidad: number;
    precio_presupuestado: number;
    precio_real: number;
    diferencia_precio: number;
    total_presupuestado: number;
    total_real: number;
    diferencia_total: number;
  }>;
}> {
  const gastos = await obtenerGastosRealesPorCotizacion(cotizacionId);

  const totalPresupuestado = gastos.reduce((sum, g) => {
    return sum + (g.cantidad_presupuestada * g.precio_unitario_presupuestado);
  }, 0);

  const totalReal = gastos.reduce((sum, g) => {
    return sum + (g.cantidad_real * g.precio_unitario_real);
  }, 0);

  const diferencia = totalReal - totalPresupuestado;
  const diferenciaPorcentaje = totalPresupuestado > 0 
    ? (diferencia / totalPresupuestado) * 100 
    : 0;

  // Agrupar por material
  const itemsMap = new Map<string, {
    material_nombre: string;
    cantidad_presupuestada: number;
    cantidad_real: number;
    precio_presupuestado: number;
    precio_real: number;
  }>();

  gastos.forEach(gasto => {
    const key = gasto.material_nombre;
    if (itemsMap.has(key)) {
      const item = itemsMap.get(key)!;
      item.cantidad_presupuestada += gasto.cantidad_presupuestada;
      item.cantidad_real += gasto.cantidad_real;
      // Promedio ponderado de precios
      const totalCantidad = item.cantidad_presupuestada + item.cantidad_real;
      item.precio_presupuestado = (item.precio_presupuestado * item.cantidad_presupuestada + gasto.precio_unitario_presupuestado * gasto.cantidad_presupuestada) / (item.cantidad_presupuestada + gasto.cantidad_presupuestada);
      item.precio_real = (item.precio_real * item.cantidad_real + gasto.precio_unitario_real * gasto.cantidad_real) / (item.cantidad_real + gasto.cantidad_real);
    } else {
      itemsMap.set(key, {
        material_nombre: gasto.material_nombre,
        cantidad_presupuestada: gasto.cantidad_presupuestada,
        cantidad_real: gasto.cantidad_real,
        precio_presupuestado: gasto.precio_unitario_presupuestado,
        precio_real: gasto.precio_unitario_real
      });
    }
  });

  const items = Array.from(itemsMap.values()).map(item => ({
    ...item,
    diferencia_cantidad: item.cantidad_real - item.cantidad_presupuestada,
    diferencia_precio: item.precio_real - item.precio_presupuestado,
    total_presupuestado: item.cantidad_presupuestada * item.precio_presupuestado,
    total_real: item.cantidad_real * item.precio_real,
    diferencia_total: (item.cantidad_real * item.precio_real) - (item.cantidad_presupuestada * item.precio_presupuestado)
  }));

  return {
    totalPresupuestado,
    totalReal,
    diferencia,
    diferenciaPorcentaje,
    items
  };
}


