/**
 * Servicio para gestionar gastos hormiga
 */
import { supabase } from '../utils/supabase';
import type { GastoHormiga } from '../types/database';

/**
 * Crea un registro de gasto hormiga
 */
export async function crearGastoHormiga(gasto: {
  cotizacion_id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  factura_url?: string;
  evidencia_url?: string;
  alcance_gasto?: 'unidad' | 'parcial' | 'total';
  cantidad_items_aplicados?: number;
}): Promise<GastoHormiga> {
  const { data, error } = await supabase
    .from('gastos_hormiga')
    .insert({
      cotizacion_id: gasto.cotizacion_id,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      factura_url: gasto.factura_url || null,
      evidencia_url: gasto.evidencia_url || null,
      alcance_gasto: gasto.alcance_gasto || 'unidad',
      cantidad_items_aplicados: gasto.cantidad_items_aplicados || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data as GastoHormiga;
}

/**
 * Obtiene todos los gastos hormiga de una cotización
 */
export async function obtenerGastosHormigaPorCotizacion(cotizacionId: string): Promise<GastoHormiga[]> {
  const { data, error } = await supabase
    .from('gastos_hormiga')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('fecha', { ascending: false });

  if (error) throw error;
  return data as GastoHormiga[];
}

/**
 * Actualiza un gasto hormiga
 */
export async function actualizarGastoHormiga(
  id: string,
  updates: Partial<{
    descripcion: string;
    monto: number;
    fecha: string;
    factura_url: string;
    evidencia_url: string;
    alcance_gasto: 'unidad' | 'parcial' | 'total';
    cantidad_items_aplicados: number;
  }>
): Promise<GastoHormiga> {
  const { data, error } = await supabase
    .from('gastos_hormiga')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as GastoHormiga;
}

/**
 * Elimina un gasto hormiga
 */
export async function eliminarGastoHormiga(id: string): Promise<void> {
  const { error } = await supabase
    .from('gastos_hormiga')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

