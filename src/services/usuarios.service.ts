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
    let nuevoId: string;

    // Si es vendedor, crear usuario de Supabase Auth primero
    if (role === 'vendedor') {
      if (!email || !password) {
        return { usuario: null, error: 'Email y contraseña son requeridos para vendedores' };
      }

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            nombre,
            apellido,
            role: 'vendedor'
          }
        }
      });

      if (authError) {
        return { usuario: null, error: authError.message };
      }

      if (!authData.user) {
        return { usuario: null, error: 'No se pudo crear el usuario de autenticación' };
      }

      nuevoId = authData.user.id;
    } else {
      // Para trabajadores de taller, generar UUID (sin auth)
      nuevoId = crypto.randomUUID();
    }

    // Crear perfil en la tabla de perfiles
    const perfilData: any = {
      id: nuevoId,
      nombre,
      apellido,
      role
    };

    // Agregar email si es vendedor
    if (role === 'vendedor' && email) {
      perfilData.email = email.trim();
    }

    // Solo agregar especialidad si es trabajador de taller
    if (role === 'trabajador_taller' && especialidad) {
      perfilData.especialidad = especialidad;
    }

    const { data: perfil, error: profileError } = await supabase
      .from('perfiles')
      .insert(perfilData)
      .select()
      .single();

    if (profileError) {
      // Si falla la creación del perfil pero se creó el usuario de auth, intentar eliminar el usuario de auth
      if (role === 'vendedor' && nuevoId) {
        await supabase.auth.admin.deleteUser(nuevoId).catch(() => {
          // Ignorar errores al eliminar
        });
      }
      throw profileError;
    }

    return { usuario: perfil as UserProfile, error: null };
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












