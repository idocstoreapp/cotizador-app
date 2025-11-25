// Script para verificar que las variables de entorno se cargan correctamente
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), 'PUBLIC_');

console.log('Variables de entorno cargadas:');
console.log('PUBLIC_SUPABASE_URL:', env.PUBLIC_SUPABASE_URL ? '✓ Configurada' : '✗ No encontrada');
console.log('PUBLIC_SUPABASE_ANON_KEY:', env.PUBLIC_SUPABASE_ANON_KEY ? '✓ Configurada' : '✗ No encontrada');
console.log('\nTodas las variables PUBLIC_:');
Object.keys(env).forEach(key => {
  console.log(`  ${key}: ${env[key] ? '✓' : '✗'}`);
});


