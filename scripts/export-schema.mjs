import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://tnlkdtslqgoezfecvcbj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGtkdHNscWdvZXpmZWN2Y2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3ODk5NywiZXhwIjoyMDc4OTU0OTk3fQ.2t5D8LEuETJSzrZjRcvn6N6pfKjbbXR_1MmybIfCmkg'
  )
async function run() {

  // 🔹 TABLAS
  const { data: tables, error: err1 } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')

  if (err1) return console.error(err1)

    console.log('📦 TABLAS EN DB VIEJA:\n');

    tables.forEach(t => {
      console.log(`- ${t.table_name}`);
    });

  // 🔹 COLUMNAS
  const { data: columns, error: err2 } = await supabase
    .from('information_schema.columns')
    .select('*')
    .eq('table_schema', 'public')

  if (err2) return console.error(err2)

  console.log('🧱 COLUMNAS:')
  console.log(columns)
}

run()