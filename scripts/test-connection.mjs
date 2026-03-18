import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://tnlkdtslqgoezfecvcbj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGtkdHNscWdvZXpmZWN2Y2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3ODk5NywiZXhwIjoyMDc4OTU0OTk3fQ.2t5D8LEuETJSzrZjRcvn6N6pfKjbbXR_1MmybIfCmkg'
  )

const tablas = [
  'gastos_reales_materiales'
]

async function run() {
  for (const tabla of tablas) {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ ${tabla}:`, error.message)
      continue
    }

    if (data.length === 0) {
      console.log(`⚠️ ${tabla}: sin datos`)
      continue
    }

    console.log(`✅ ${tabla}:`, Object.keys(data[0]))
  }
}

run()