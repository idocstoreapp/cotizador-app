/**
 * Servicio para gestión de servicios/mano de obra
 * CRUD completo de servicios
 */
import { supabase } from '../utils/supabase';
import type { Servicio } from '../types/database';
import type { ServicioInput } from '../schemas/validations';

/**
 * Obtiene todos los servicios
 * @returns Lista de servicios
 */
export async function obtenerServicios(): Promise<Servicio[]> {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as Servicio[];
}

/**
 * Obtiene un servicio por ID
 * @param id - ID del servicio
 * @returns Servicio o null
 */
export async function obtenerServicioPorId(id: string): Promise<Servicio | null> {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Servicio | null;
}

/**
 * Crea un nuevo servicio
 * @param servicio - Datos del servicio
 * @returns Servicio creado
 */
export async function crearServicio(servicio: ServicioInput): Promise<Servicio> {
  const { data, error } = await supabase
    .from('servicios')
    .insert({
      ...servicio,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data as Servicio;
}

/**
 * Actualiza un servicio existente
 * @param id - ID del servicio
 * @param servicio - Datos actualizados
 * @returns Servicio actualizado
 */
export async function actualizarServicio(
  id: string,
  servicio: Partial<ServicioInput>
): Promise<Servicio> {
  const { data, error } = await supabase
    .from('servicios')
    .update({
      ...servicio,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Servicio;
}

/**
 * Elimina un servicio
 * @param id - ID del servicio
 */
export async function eliminarServicio(id: string): Promise<void> {
  const { error } = await supabase
    .from('servicios')
    .delete()
    .eq('id', id);

  if (error) throw error;
}


