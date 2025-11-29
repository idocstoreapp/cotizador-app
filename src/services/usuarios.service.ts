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

/**
 * Obtiene todos los vendedores
 */
export async function obtenerVendedores(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('role', 'vendedor')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as UserProfile[];
}

/**
 * Obtiene todos los trabajadores de taller
 */
export async function obtenerTrabajadoresTaller(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('role', 'trabajador_taller')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as UserProfile[];
}

/**
 * Crea un nuevo registro de vendedor o trabajador de taller
 * Para vendedores: crea usuario de Supabase Auth con email y contraseña
 * Para trabajadores de taller: solo registro en BD (sin auth)
 * Solo admins pueden crear usuarios
 */
export async function crearUsuario(
  nombre: string,
  apellido: string,
  role: 'vendedor' | 'trabajador_taller',
  especialidad?: string, // Solo para trabajador_taller
  email?: string, // Solo para vendedor
  password?: string // Solo para vendedor
): Promise<{ usuario: UserProfile | null; error: string | null }> {
  try {
    // Obtener token de sesión actual para autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { usuario: null, error: 'No estás autenticado' };
    }

    // Si es vendedor, crear usuario de Supabase Auth usando API endpoint
    if (role === 'vendedor') {
      if (!email || !password) {
        return { usuario: null, error: 'Email y contraseña son requeridos para vendedores' };
      }

      // Llamar al endpoint API para crear vendedor
      const response = await fetch('/api/crear-vendedor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          nombre,
          apellido,
          email: email.trim(),
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { usuario: null, error: result.error || 'Error al crear vendedor' };
      }

      if (!result.usuario) {
        return { usuario: null, error: 'No se pudo crear el usuario' };
      }

      // Retornar el usuario creado (ya incluye el perfil)
      return { usuario: result.usuario, error: null };
    } else {
      // Para trabajadores de taller, usar endpoint API
      // Llamar al endpoint API para crear trabajador de taller
      const response = await fetch('/api/crear-trabajador-taller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          nombre,
          apellido,
          especialidad: especialidad?.trim() || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { usuario: null, error: result.error || 'Error al crear trabajador de taller' };
      }

      if (!result.usuario) {
        return { usuario: null, error: 'No se pudo crear el trabajador de taller' };
      }

      // Retornar el usuario creado (ya incluye el perfil)
      return { usuario: result.usuario, error: null };
    }
  } catch (error: any) {
    return { usuario: null, error: error.message };
  }
}

/**
 * Actualiza un usuario existente
 * Solo admins pueden actualizar usuarios
 */
export async function actualizarUsuario(
  id: string,
  datos: Partial<{
    nombre: string;
    apellido: string;
    especialidad: string; // Solo para trabajador_taller
  }>
): Promise<{ usuario: UserProfile | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .update(datos)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { usuario: data as UserProfile, error: null };
  } catch (error: any) {
    return { usuario: null, error: error.message };
  }
}












