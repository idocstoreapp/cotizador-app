import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar .env.migracion a mano (igual que hicimos antes)
const envPath = path.join(process.cwd(), '.env.migracion');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^[\"']|[\"']$/g, '').trim();
  }
}

const OLD_URL = process.env.SUPABASE_OLD_URL;
const OLD_SERVICE_ROLE = process.env.SUPABASE_OLD_SERVICE_ROLE;
const NEW_URL = process.env.SUPABASE_NEW_URL;
const NEW_SERVICE_ROLE = process.env.SUPABASE_NEW_SERVICE_ROLE;
const BUCKET = process.env.STORAGE_BUCKET_MUEBLES;

if (!OLD_URL || !OLD_SERVICE_ROLE || !NEW_URL || !NEW_SERVICE_ROLE || !BUCKET) {
  console.error('❌ Faltan variables en .env.migracion (SUPABASE_OLD_*, SUPABASE_NEW_*, STORAGE_BUCKET_MUEBLES)');
  process.exit(1);
}

const oldClient = createClient(OLD_URL, OLD_SERVICE_ROLE);
const newClient = createClient(NEW_URL, NEW_SERVICE_ROLE);

// Carpeta temporal local para archivos
const TMP_DIR = path.join(process.cwd(), '.tmp-storage-muebles');

async function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
}

async function listAllFiles(bucket) {
  let page = 0;
  const limit = 1000;
  let all = [];

  // usamos paginación porque listObjects tiene límite
  // bucle simple hasta que la página devuelva 0
  // ojo: solo primer nivel + subcarpetas; usamos prefix vacío
  while (true) {
    const { data, error } = await oldClient.storage.from(bucket).list('', {
      limit,
      offset: page * limit,
      sortBy: { column: 'name', order: 'asc' },
      search: '' // todas
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < limit) break;
    page++;
  }
  return all;
}

// Listar recursivo (bucket puede tener carpetas)
async function listRecursive(bucket, prefix = '') {
  const { data, error } = await oldClient.storage.from(bucket).list(prefix, {
    limit: 1000,
    offset: 0
  });
  if (error) throw error;
  let files = [];
  for (const item of data || []) {
    if (item.name.endsWith('/')) continue;
    if (item.id) {
      // archivo
      files.push(prefix ? `${prefix}/${item.name}` : item.name);
    } else if (item.type === 'folder' || item.metadata?.isDirectory) {
      const subPrefix = prefix ? `${prefix}/${item.name}` : item.name;
      const subFiles = await listRecursive(bucket, subPrefix);
      files = files.concat(subFiles);
    } else if (item.name && !item.id && !item.type) {
      // Supabase v2: folder no viene tan claro, tratamos recursivo igual
      const subPrefix = prefix ? `${prefix}/${item.name}` : item.name;
      const subFiles = await listRecursive(bucket, subPrefix);
      files = files.concat(subFiles);
    }
  }
  return files;
}

async function migrarBucket() {
  console.log(`🚀 Migrando bucket "${BUCKET}" de OLD → NEW`);
  await ensureTmpDir();

  // 1) Listar TODOS los paths
  const files = await listRecursive(BUCKET, '');
  console.log(`📂 Archivos encontrados en bucket viejo: ${files.length}`);

  for (const filePath of files) {
    try {
      console.log(`\n➡️  Migrando ${filePath}`);

      // 2) Descargar del proyecto viejo
      const { data, error } = await oldClient.storage.from(BUCKET).download(filePath);
      if (error) {
        console.error(`   ❌ Error al descargar:`, error.message || error);
        continue;
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 3) Subir al proyecto nuevo en la misma ruta
      const { error: uploadError } = await newClient.storage.from(BUCKET).upload(filePath, buffer, {
        upsert: true,
        contentType: undefined // dejar que Supabase detecte
      });
      if (uploadError) {
        console.error(`   ❌ Error al subir:`, uploadError.message || uploadError);
        continue;
      }

      console.log(`   ✅ Migrado correctamente`);
    } catch (e) {
      console.error(`   ❌ Error inesperado con ${filePath}:`, e);
    }
  }

  console.log('\n🎉 Migración de imágenes terminada.');
}

migrarBucket()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error general en migrar-storage:', err);
    process.exit(1);
  });