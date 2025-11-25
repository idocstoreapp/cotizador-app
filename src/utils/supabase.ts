/**
 * Cliente de Supabase configurado para el proyecto
 * Se usa tanto en el cliente como en el servidor
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Variables de entorno (deben estar en .env)
// Valores por defecto para desarrollo (temporal)
const DEFAULT_SUPABASE_URL = 'https://tnlkdtslqgoezfecvcbj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGtkdHNscWdvZXpmZWN2Y2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzg5OTcsImV4cCI6MjA3ODk1NDk5N30.fBJhRkJg-Q4LuuQMoJWZXe56StEvFo-aIAUlWmULBsY';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Validar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables de entorno:', {
    PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL ? '✓ Configurada' : '✗ Faltante (usando valor por defecto)',
    PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? '✓ Configurada' : '✗ Faltante (usando valor por defecto)',
    todasLasEnv: Object.keys(import.meta.env).filter(k => k.startsWith('PUBLIC_'))
  });
  
  // En desarrollo, usar valores por defecto
  if (import.meta.env.DEV) {
    console.warn('⚠️ Modo desarrollo: Usando valores por defecto de Supabase');
    console.warn('⚠️ Para usar variables de entorno, reinicia el servidor después de crear/modificar .env');
  } else {
    throw new Error(
      'Faltan las variables de entorno de Supabase. ' +
      'Asegúrate de tener PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en tu archivo .env. ' +
      'Reinicia el servidor después de crear/modificar el archivo .env'
    );
  }
}

/**
 * Cliente de Supabase para uso en el navegador
 * Este cliente maneja automáticamente la autenticación y las sesiones
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    flowType: 'pkce'
  }
});

/**
 * Obtiene el cliente de Supabase con la sesión del usuario
 * Útil para operaciones que requieren autenticación
 */
export async function getSupabaseClient() {
  const { data: { session } } = await supabase.auth.getSession();
  return supabase;
}


