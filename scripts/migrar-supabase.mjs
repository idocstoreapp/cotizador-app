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
  
  'balance_personal'
  
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

    // Normalizar filas para compatibilidad entre esquemas OLD/NEW
    const normalized = (data || []).map((row) => {
      const r = { ...row };

      if (tableName === 'fixed_expense_categories') {
        // En algunos esquemas: OLD tiene "name" y NEW exige "nombre" (NOT NULL)
        if ((r.nombre === null || r.nombre === undefined || r.nombre === '') && r.name) {
          r.nombre = r.name;
        }
      }

      if (tableName === 'transporte_real') {
        // En algunos esquemas: NEW exige "monto" (NOT NULL) y OLD usa "costo"
        if ((r.monto === null || r.monto === undefined) && (r.costo !== null && r.costo !== undefined)) {
          r.monto = r.costo;
        }
        // Si ambos vienen nulos, dejar 0 para evitar NOT NULL
        if (r.monto === null || r.monto === undefined) {
          r.monto = 0;
        }
      }

      if (tableName === 'fixed_expenses') {
        // En algunos esquemas: OLD usa "metodo_pago"
        if ((r.payment_method === null || r.payment_method === undefined) && r.metodo_pago) {
          r.payment_method = r.metodo_pago;
        }
        // En algunos esquemas NEW: existe "nombre" NOT NULL
        if ((r.nombre === null || r.nombre === undefined || r.nombre === '') && (r.description || r.descripcion || r.detalle)) {
          r.nombre = r.description || r.descripcion || r.detalle;
        }
      }

      if (tableName === 'liquidaciones') {
        // En algunos esquemas: OLD usa "referencia"
        if ((r.numero_referencia === null || r.numero_referencia === undefined) && r.referencia) {
          r.numero_referencia = r.referencia;
        }
      }

      return r;
    });

    // IMPORTANTE:
    // - En re-ejecuciones es normal tener IDs duplicados (PK). Usamos upsert para no frenar toda la migración.
    // - Si una tabla no tiene columna id (raro aquí), Supabase rechazará onConflict.
    const hasId = normalized.length > 0 && Object.prototype.hasOwnProperty.call(normalized[0], 'id');
    const insertBuilder = newClient.from(tableName);
    const { error: insertError } = hasId
      ? await insertBuilder.upsert(normalized, { onConflict: 'id' })
      : await insertBuilder.insert(normalized);

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
  console.log(' Iniciando migración Supabase OLD → NEW');
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

