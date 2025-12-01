/**
 * Script para verificar la configuración del proyecto
 * Ejecuta: node verificar-configuracion.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verificando configuración del proyecto...\n');

// 1. Verificar si existe .env
const envPath = join(__dirname, '.env');
const envExamplePath = join(__dirname, '.env.example');

console.log('1. Archivo .env:');
if (existsSync(envPath)) {
  console.log('   ✅ Archivo .env existe');
  
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const hasSupabaseUrl = envContent.includes('PUBLIC_SUPABASE_URL');
    const hasSupabaseKey = envContent.includes('PUBLIC_SUPABASE_ANON_KEY');
    
    console.log('   Variables encontradas:');
    console.log(`   ${hasSupabaseUrl ? '✅' : '❌'} PUBLIC_SUPABASE_URL`);
    console.log(`   ${hasSupabaseKey ? '✅' : '❌'} PUBLIC_SUPABASE_ANON_KEY`);
    
    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.log('\n   ⚠️  Faltan variables de entorno en .env');
      console.log('   💡 Crea o actualiza tu archivo .env con:');
      console.log('      PUBLIC_SUPABASE_URL=https://tnlkdtslqgoezfecvcbj.supabase.co');
      console.log('      PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui');
    }
  } catch (error) {
    console.log('   ⚠️  Error al leer .env:', error.message);
  }
} else {
  console.log('   ❌ Archivo .env NO existe');
  console.log('   💡 Crea un archivo .env en la raíz del proyecto');
  
  if (existsSync(envExamplePath)) {
    console.log('   💡 Puedes copiar .env.example como base:');
    console.log('      cp .env.example .env');
  } else {
    console.log('   💡 Crea .env con este contenido:');
    console.log('      PUBLIC_SUPABASE_URL=https://tnlkdtslqgoezfecvcbj.supabase.co');
    console.log('      PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui');
  }
}

// 2. Verificar node_modules
console.log('\n2. Dependencias:');
const nodeModulesPath = join(__dirname, 'node_modules');
if (existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules existe');
} else {
  console.log('   ❌ node_modules NO existe');
  console.log('   💡 Ejecuta: npm install');
}

// 3. Verificar package.json
console.log('\n3. package.json:');
const packageJsonPath = join(__dirname, 'package.json');
if (existsSync(packageJsonPath)) {
  console.log('   ✅ package.json existe');
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    console.log(`   Nombre: ${packageJson.name || 'N/A'}`);
    console.log(`   Versión: ${packageJson.version || 'N/A'}`);
  } catch (error) {
    console.log('   ⚠️  Error al leer package.json');
  }
} else {
  console.log('   ❌ package.json NO existe');
}

// 4. Verificar estructura de carpetas
console.log('\n4. Estructura del proyecto:');
const srcPath = join(__dirname, 'src');
const publicPath = join(__dirname, 'public');

console.log(`   ${existsSync(srcPath) ? '✅' : '❌'} Carpeta src/`);
console.log(`   ${existsSync(publicPath) ? '✅' : '❌'} Carpeta public/`);

// 5. Resumen
console.log('\n📋 Resumen:');
console.log('   Si falta el archivo .env, créalo con las variables de entorno');
console.log('   Si falta node_modules, ejecuta: npm install');
console.log('   Después de crear/actualizar .env, reinicia el servidor\n');


