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
}): Promise<TransporteReal> {
  const { data, error } = await supabase
    .from('transporte_real')
    .insert({
      cotizacion_id: transporte.cotizacion_id,
      tipo_descripcion: transporte.tipo_descripcion,
      costo: transporte.costo,
      fecha: transporte.fecha,
      factura_url: transporte.factura_url || null,
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
  }>
): Promise<TransporteReal> {
  const { data, error } = await supabase
    .from('transporte_real')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
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

