import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar .env.migracion sin depender de dotenv
const envPath = path.join(process.cwd(), '.env.migracion');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const OLD_URL = process.env.SUPABASE_OLD_URL;
const OLD_SERVICE_ROLE = process.env.SUPABASE_OLD_SERVICE_ROLE;
const NEW_URL = process.env.SUPABASE_NEW_URL;
const NEW_SERVICE_ROLE = process.env.SUPABASE_NEW_SERVICE_ROLE;

if (!OLD_URL || !OLD_SERVICE_ROLE || !NEW_URL || !NEW_SERVICE_ROLE) {
  console.error('❌ Faltan variables en .env.migracion');
  console.error('Revisa que existan: SUPABASE_OLD_URL, SUPABASE_OLD_SERVICE_ROLE, SUPABASE_NEW_URL, SUPABASE_NEW_SERVICE_ROLE');
  process.exit(1);
}

const oldClient = createClient(OLD_URL, OLD_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const newClient = createClient(NEW_URL, NEW_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Orden pensado para respetar llaves foráneas (primero "maestras", luego dependientes)
const TABLES_IN_ORDER = [
  // Catálogos / maestros
  'perfiles',
  'clientes',
  'materiales',
  'servicios',
  'muebles',
  'fixed_expense_categories',

  // Tablas principales de negocio
  'cotizaciones',
  'cotizaciones_publicas',
  'trabajos',
  'cotizacion_trabajadores',

  // Costos reales por cotización
  'gastos_reales_materiales',
  'mano_obra_real',
  'gastos_hormiga',
  'transporte_real',

  // Gastos fijos / finanzas
  'fixed_expenses',
  'balance_personal',
  'liquidaciones',
  'caja_ahorros_movimientos',

  // Facturación
  'facturas',
  'factura_items',

  // Historial / auditoría
  'historial_modificaciones_cotizaciones',
  'cotizacion_pagos'
];

const PAGE_SIZE = 1000;

async function migrateTable(tableName) {
  console.log(`\n📦 Migrando tabla: ${tableName}`);
  let from = 0;
  let totalRows = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await oldClient
      .from(tableName)
      .select('*', { head: false })
      .range(from, to);

    if (error) {
      console.error(`❌ Error al leer de ${tableName}:`, error.message || error);
      break;
    }

    if (!data || data.length === 0) {
      if (from === 0) {
        console.log(`   → 0 filas (tabla vacía o sin acceso)`);
      }
      break;
    }

    console.log(`   → Lote ${from}-${from + data.length - 1} (${data.length} filas)`);

    const { error: insertError } = await newClient
      .from(tableName)
      .insert(data);

    if (insertError) {
      console.error(`❌ Error al insertar en ${tableName}:`, insertError.message || insertError);
      console.error('   Revisa claves foráneas / RLS en el proyecto nuevo.');
      break;
    }

    totalRows += data.length;
    from += PAGE_SIZE;

    if (data.length < PAGE_SIZE) {
      // Último lote
      break;
    }
  }

  console.log(`✅ Tabla ${tableName} migrada. Filas insertadas: ${totalRows}`);
}

async function main() {
  console.log('🚀 Iniciando migración Supabase OLD → NEW');
  console.log(`   Origen: ${OLD_URL}`);
  console.log(`   Destino: ${NEW_URL}`);

  for (const table of TABLES_IN_ORDER) {
    try {
      await migrateTable(table);
    } catch (e) {
      console.error(`❌ Error inesperado migrando ${table}:`, e);
    }
  }

  console.log('\n🎉 Migración terminada (revisa logs por si alguna tabla falló).');
}

main().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Error general en la migración:', err);
  process.exit(1);
});

