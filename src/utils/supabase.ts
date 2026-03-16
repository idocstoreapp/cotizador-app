/**
 * Cliente de Supabase configurado para el proyecto
 * Se usa tanto en el cliente como en el servidor
 */
import { createClient} from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Variables de entorno (deben estar en .env).
let supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
let supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

// Si el bundle tiene el placeholder o el .env no se cargó (caché Vite), usar proyecto nuevo en runtime.
const PLACEHOLDER_URL = 'https://tu-proyecto.supabase.co';
const NEW_PROJECT_URL = 'https://fulwwxntkzppgnrxopej.supabase.co';
const NEW_PROJECT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHd3eG50a3pwcGducnhvcGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTY0MjYsImV4cCI6MjA4OTE3MjQyNn0.Dhv5srGNnRV4hitewthrWg9z3mYso8YQXq6InzaEm24';
const isPlaceholderUrl = supabaseUrl?.includes('tu-proyecto') || supabaseUrl === PLACEHOLDER_URL;
const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey === 'tu_clave_anon_public_aqui';
if (isPlaceholderUrl || isPlaceholderKey) {
  if (import.meta.env.DEV) {
    console.warn('[Supabase] Usando credenciales del proyecto nuevo (fulwwxntkzppgnrxopej). Si ya tienes .env correcto, haz Ctrl+C y "npm run dev" de nuevo.');
  }
  supabaseUrl = NEW_PROJECT_URL;
  supabaseAnonKey = NEW_PROJECT_ANON_KEY;
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] No se pudo cargar URL o anon key. Revisa tu .env.');
  if (!import.meta.env.DEV) throw new Error('Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY en .env');
}

/**
 * Cliente de Supabase para uso en el navegador
 * Este cliente maneja automáticamente la autenticación y las sesiones
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


/**
 * Obtiene el cliente de Supabase con la sesión del usuario
 * Útil para operaciones que requieren autenticación
 */
export async function getSupabaseClient() {
  const { data: { session } } = await supabase.auth.getSession();
  return supabase;
}


