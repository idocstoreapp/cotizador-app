/**
 * Servicio para gestionar el historial de modificaciones de cotizaciones
 */
import { supabase } from '../utils/supabase';
import type { HistorialModificacion } from '../types/database';

/**
 * Crea un registro de modificación en el historial
 */
export async function crearRegistroModificacion(
  cotizacionId: string,
  usuarioId: string,
  descripcion: string,
  cambios: any,
  totalAnterior?: number,
  totalNuevo?: number
): Promise<HistorialModificacion> {
  const { data, error } = await supabase
    .from('historial_modificaciones_cotizaciones')
    .insert({
      cotizacion_id: cotizacionId,
      usuario_id: usuarioId,
      descripcion,
      cambios,
      total_anterior: totalAnterior || null,
      total_nuevo: totalNuevo || null,
      created_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as HistorialModificacion;
}

/**
 * Obtiene el historial de modificaciones de una cotización
 */
export async function obtenerHistorialModificaciones(
  cotizacionId: string
): Promise<HistorialModificacion[]> {
  const { data, error } = await supabase
    .from('historial_modificaciones_cotizaciones')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Cargar usuarios por separado
  const userIds = [...new Set(data.map(h => h.usuario_id))];
  const { data: perfilesData } = await supabase
    .from('perfiles')
    .select('id, nombre, email, role')
    .in('id', userIds);

  const perfilesMap = new Map(perfilesData?.map(p => [p.id, p]) || []);

  return data.map(historial => ({
    ...historial,
    usuario: perfilesMap.get(historial.usuario_id) || null
  })) as HistorialModificacion[];
}

