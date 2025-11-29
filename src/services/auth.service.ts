/**
 * Servicio de autenticación
 * Maneja registro, login, logout y obtención de usuario actual
 */
import { supabase } from '../utils/supabase';
import type { UserProfile, UserRole } from '../types/database';
import type { LoginInput, RegistroInput } from '../schemas/validations';

/**
 * Registra un nuevo usuario
 * @param datos - Datos de registro (email, password, nombre, role)
 * @returns Usuario creado o error
 */
export async function registrarUsuario(datos: RegistroInput) {
  try {
    // Registrar en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    // Crear perfil en la tabla de perfiles
    const { error: profileError } = await supabase
      .from('perfiles')
      .insert({
        id: authData.user.id,
        email: datos.email,
        nombre: datos.nombre,
        role: datos.role || 'tecnico'
      });

    if (profileError) throw profileError;

    return { usuario: authData.user, error: null };
  } catch (error: any) {
    return { usuario: null, error: error.message };
  }
}

/**
 * Inicia sesión con email y contraseña
 * @param datos - Datos de login (email, password)
 * @returns Sesión del usuario o error
 */
export async function iniciarSesion(datos: LoginInput) {
  try {
    console.log('Intentando iniciar sesión con:', datos.email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: datos.email,
      password: datos.password
    });

    if (error) {
      console.error('Error de autenticación:', error);
      throw error;
    }
    
    if (!data || !data.user) {
      console.error('No se recibió usuario en la respuesta');
      throw new Error('No se pudo iniciar sesión. Intenta nuevamente.');
    }
    
    console.log('Login exitoso para usuario:', data.user.email);
    return { sesion: data, error: null };
  } catch (error: any) {
    console.error('Error completo en iniciarSesion:', error);
    return { sesion: null, error: error.message || 'Error desconocido al iniciar sesión' };
  }
}

/**
 * Cierra la sesión del usuario actual
 */
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Obtiene el usuario autenticado actual
 * @returns Perfil del usuario o null
 */
export async function obtenerUsuarioActual(): Promise<UserProfile | null> {
  try {
    // Primero intentar obtener la sesión (más confiable para sesiones persistidas)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error al obtener sesión:', sessionError);
      return null;
    }
    
    if (!session || !session.user) {
      // No loguear en cada verificación para no saturar la consola
      return null;
    }

    const user = session.user;

    // Obtener perfil desde la tabla de perfiles
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // Si el error es que no se encontró el perfil (PGRST116), no es crítico
      // pero sí es un problema que debemos reportar
      if (error.code === 'PGRST116') {
        console.warn('⚠️ Perfil no encontrado para usuario:', user.id, user.email);
        console.warn('⚠️ El usuario existe en auth.users pero no tiene perfil en la tabla perfiles');
        console.warn('⚠️ Esto puede causar problemas. Asegúrate de crear el perfil después del registro.');
        return null;
      }
      
      // Para otros errores, loguear y retornar null
      console.error('Error al obtener perfil:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje:', error.message);
      return null;
    }
    
    if (!perfil) {
      console.warn('⚠️ No se encontró perfil para el usuario:', user.id);
      return null;
    }
    
    return perfil as UserProfile;
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    console.error('Tipo de error:', error?.constructor?.name);
    console.error('Mensaje:', error?.message);
    return null;
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param usuario - Perfil del usuario
 * @param rol - Rol a verificar
 * @returns true si el usuario tiene el rol
 */
export function tieneRol(usuario: UserProfile | null, rol: UserRole): boolean {
  return usuario?.role === rol;
}

/**
 * Verifica si el usuario es administrador
 * @param usuario - Perfil del usuario
 * @returns true si es admin
 */
export function esAdmin(usuario: UserProfile | null): boolean {
  return tieneRol(usuario, 'admin');
}


