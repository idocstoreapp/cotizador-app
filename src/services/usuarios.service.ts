/**
 * Servicio para obtener usuarios/empleados
 */
import { supabase } from '../utils/supabase';
import type { UserProfile } from '../types/database';

/**
 * Obtiene todos los usuarios (empleados)
 */
export async function obtenerUsuarios(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as UserProfile[];
}








