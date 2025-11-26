/**
 * Servicio para gestión de trabajos
 */
import { supabase } from '../utils/supabase';
import type { Trabajo } from '../types/database';

/**
 * Crea un nuevo trabajo desde una cotización aceptada
 */
export async function crearTrabajo(trabajo: {
  cliente_id: string;
  cotizacion_id: string;
  empleados_asignados?: string[];
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  notas?: string;
}): Promise<Trabajo> {
  const { data, error } = await supabase
    .from('trabajos')
    .insert({
      cliente_id: trabajo.cliente_id,
      cotizacion_id: trabajo.cotizacion_id,
      estado: 'pendiente',
      empleados_asignados: trabajo.empleados_asignados || [],
      fecha_inicio: trabajo.fecha_inicio || null,
      fecha_fin_estimada: trabajo.fecha_fin_estimada || null,
      notas: trabajo.notas || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      cliente:clientes(*),
      cotizacion:cotizaciones(*)
    `)
    .single();

  if (error) throw error;
  return data as Trabajo;
}

/**
 * Actualiza un trabajo (para asignar empleados, cambiar estado, etc.)
 */
export async function actualizarTrabajo(
  id: string,
  updates: {
    empleados_asignados?: string[];
    estado?: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
    fecha_inicio?: string;
    fecha_fin_estimada?: string;
    notas?: string;
  }
): Promise<Trabajo> {
  const { data, error } = await supabase
    .from('trabajos')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      cliente:clientes(*),
      cotizacion:cotizaciones(*)
    `)
    .single();

  if (error) throw error;
  return data as Trabajo;
}

/**
 * Obtiene todos los trabajos
 */
export async function obtenerTrabajos(): Promise<Trabajo[]> {
  const { data, error } = await supabase
    .from('trabajos')
    .select(`
      *,
      cliente:clientes(*),
      cotizacion:cotizaciones(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Trabajo[];
}

/**
 * Obtiene un trabajo por ID
 */
export async function obtenerTrabajoPorId(id: string): Promise<Trabajo | null> {
  const { data, error } = await supabase
    .from('trabajos')
    .select(`
      *,
      cliente:clientes(*),
      cotizacion:cotizaciones(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Trabajo | null;
}










