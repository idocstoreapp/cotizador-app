/**
 * Servicio para gestionar transporte real
 */
import { supabase } from '../utils/supabase';
import type { TransporteReal } from '../types/database';

/**
 * Crea un registro de transporte real
 */
export async function crearTransporteReal(transporte: {
  cotizacion_id: string;
  tipo_descripcion: string;
  costo: number;
  fecha: string;
  factura_url?: string;
  alcance_gasto?: 'unidad' | 'parcial' | 'total';
  cantidad_items_aplicados?: number;
}): Promise<TransporteReal> {
  const { data, error } = await supabase
    .from('transporte_real')
    .insert({
      cotizacion_id: transporte.cotizacion_id,
      tipo_descripcion: transporte.tipo_descripcion,
      costo: transporte.costo,
      fecha: transporte.fecha,
      factura_url: transporte.factura_url || null,
      alcance_gasto: transporte.alcance_gasto || 'unidad',
      cantidad_items_aplicados: transporte.cantidad_items_aplicados || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data as TransporteReal;
}

/**
 * Obtiene todos los transportes reales de una cotización
 */
export async function obtenerTransportesRealesPorCotizacion(cotizacionId: string): Promise<TransporteReal[]> {
  const { data, error } = await supabase
    .from('transporte_real')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('fecha', { ascending: false });

  if (error) throw error;
  return data as TransporteReal[];
}

/**
 * Actualiza un transporte real
 */
export async function actualizarTransporteReal(
  id: string,
  updates: Partial<{
    tipo_descripcion: string;
    costo: number;
    fecha: string;
    factura_url: string;
    alcance_gasto: 'unidad' | 'parcial' | 'total';
    cantidad_items_aplicados: number;
  }>
): Promise<TransporteReal> {
  console.log('💾 [transporte-real.service] Actualizando transporte ID:', id);
  console.log('💾 [transporte-real.service] Updates:', updates);
  
  // Asegurar que alcance_gasto se envíe correctamente (incluso si es undefined, enviarlo como null)
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  // Si alcance_gasto no está definido, no lo incluyamos (dejar que la BD use el default)
  if (updates.alcance_gasto === undefined) {
    delete updateData.alcance_gasto;
  }
  
  // Si cantidad_items_aplicados es undefined y alcance_gasto no es parcial, enviar null
  if (updates.alcance_gasto !== 'parcial' && updates.cantidad_items_aplicados === undefined) {
    updateData.cantidad_items_aplicados = null;
  }
  
  console.log('💾 [transporte-real.service] UpdateData final:', updateData);
  
  const { data, error } = await supabase
    .from('transporte_real')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ [transporte-real.service] Error al actualizar:', error);
    throw error;
  }
  
  console.log('✅ [transporte-real.service] Transporte actualizado:', data);
  return data as TransporteReal;
}

/**
 * Elimina un transporte real
 */
export async function eliminarTransporteReal(id: string): Promise<void> {
  const { error } = await supabase
    .from('transporte_real')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

