/**
 * Utilidad para probar la conexión con Supabase
 * Ejecuta esto en la consola del navegador para diagnosticar
 */

export async function testSupabaseConnection() {
  console.log('=== TEST DE CONEXIÓN SUPABASE ===');
  
  try {
    const { supabase } = await import('./supabase');
    
    // Test 1: Verificar que Supabase está configurado
    console.log('1. Verificando configuración de Supabase...');
    const url = (supabase as any).supabaseUrl;
    const key = (supabase as any).supabaseKey;
    
    if (!url || !key) {
      console.error('✗ Supabase no está configurado correctamente');
      return false;
    }
    console.log('✓ Supabase configurado');
    
    // Test 2: Intentar obtener sesión actual
    console.log('2. Verificando sesión actual...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('✗ Error al obtener sesión:', sessionError);
    } else if (session) {
      console.log('✓ Sesión activa para:', session.user.email);
    } else {
      console.log('ℹ No hay sesión activa');
    }
    
    // Test 3: Intentar hacer una query simple
    console.log('3. Probando conexión a la base de datos...');
    const { data, error } = await supabase
      .from('perfiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('✗ Error al conectar con la base de datos:', error);
      console.error('  Mensaje:', error.message);
      console.error('  Detalles:', error.details);
      return false;
    }
    
    console.log('✓ Conexión a la base de datos exitosa');
    
    return true;
  } catch (error: any) {
    console.error('✗ Error en test:', error);
    return false;
  }
}

// Para usar en la consola del navegador:
// import { testSupabaseConnection } from './utils/testAuth';
// testSupabaseConnection();


