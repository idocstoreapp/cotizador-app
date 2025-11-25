-- ============================================
-- Script para Verificar y Corregir Cotizaciones
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase: https://app.supabase.com
-- 2. Ve a "SQL Editor" en el menú lateral
-- 3. Haz clic en "New Query"
-- 4. Copia y pega TODO este script
-- 5. Haz clic en "Run" o presiona Ctrl+Enter
-- ============================================

-- 1. Verificar si la tabla existe y tiene datos
SELECT 
  'Total de cotizaciones' as descripcion,
  COUNT(*) as cantidad
FROM cotizaciones;

-- 2. Verificar estados de las cotizaciones
SELECT 
  estado,
  COUNT(*) as cantidad
FROM cotizaciones
GROUP BY estado;

-- 3. Verificar políticas RLS existentes
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

-- 4. Verificar si RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'cotizaciones';

-- 5. Verificar cotizaciones por usuario
SELECT 
  usuario_id,
  COUNT(*) as cantidad_cotizaciones,
  MIN(created_at) as primera_cotizacion,
  MAX(created_at) as ultima_cotizacion
FROM cotizaciones
GROUP BY usuario_id;

-- 6. Verificar perfiles y roles
SELECT 
  id,
  email,
  nombre,
  role,
  created_at
FROM perfiles;

-- ============================================
-- CORRECCIONES (ejecutar solo si es necesario)
-- ============================================

-- A. Asegurar que RLS esté habilitado
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

-- B. Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view own cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Admins can view all cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Users can create cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Users can update own cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Admins can update all cotizaciones" ON cotizaciones;

-- C. Crear políticas correctas
-- Política: Los usuarios pueden ver sus propias cotizaciones
CREATE POLICY "Users can view own cotizaciones" ON cotizaciones
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política: Los admins pueden ver todas las cotizaciones
CREATE POLICY "Admins can view all cotizaciones" ON cotizaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Política: Los usuarios pueden crear cotizaciones
CREATE POLICY "Users can create cotizaciones" ON cotizaciones
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios pueden actualizar sus propias cotizaciones
CREATE POLICY "Users can update own cotizaciones" ON cotizaciones
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política: Los admins pueden actualizar todas las cotizaciones
CREATE POLICY "Admins can update all cotizaciones" ON cotizaciones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- D. Verificar que el estado sea correcto (debe ser 'pendiente', 'aceptada', 'rechazada')
-- Si hay estados antiguos, actualizarlos
UPDATE cotizaciones 
SET estado = 'pendiente' 
WHERE estado NOT IN ('pendiente', 'aceptada', 'rechazada');

-- E. Asegurar que el CHECK constraint permita los estados correctos
ALTER TABLE cotizaciones 
  DROP CONSTRAINT IF EXISTS cotizaciones_estado_check;

ALTER TABLE cotizaciones
  ADD CONSTRAINT cotizaciones_estado_check 
  CHECK (estado IN ('pendiente', 'aceptada', 'rechazada'));

-- F. Verificar que el default sea 'pendiente'
ALTER TABLE cotizaciones
  ALTER COLUMN estado SET DEFAULT 'pendiente';

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que todo esté correcto
SELECT 
  'Verificación final' as descripcion,
  (SELECT COUNT(*) FROM cotizaciones) as total_cotizaciones,
  (SELECT COUNT(*) FROM cotizaciones WHERE estado IN ('pendiente', 'aceptada', 'rechazada')) as cotizaciones_estado_correcto,
  (SELECT COUNT(*) FROM perfiles WHERE role = 'admin') as total_admins;

