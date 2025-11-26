-- ============================================
-- Verificar políticas RLS de cotizaciones
-- ============================================

-- 1. Verificar que RLS esté habilitado
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'cotizaciones';

-- 2. Ver todas las políticas de cotizaciones
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'cotizaciones';

-- 3. Verificar que existan cotizaciones en la tabla
SELECT COUNT(*) as total_cotizaciones FROM cotizaciones;

-- 4. Verificar que el usuario admin pueda ver todas las cotizaciones
-- (Ejecutar esto como admin en Supabase)
SELECT 
  id,
  numero,
  cliente_nombre,
  estado,
  usuario_id,
  created_at
FROM cotizaciones
ORDER BY created_at DESC
LIMIT 10;

-- 5. Si hay problemas, estas son las políticas que deberían existir:

-- Política para que usuarios vean sus propias cotizaciones
-- CREATE POLICY "Users can view own cotizaciones" ON cotizaciones
--   FOR SELECT USING (auth.uid() = usuario_id);

-- Política para que admins vean todas las cotizaciones
-- CREATE POLICY "Admins can view all cotizaciones" ON cotizaciones
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM perfiles
--       WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
--     )
--   );

