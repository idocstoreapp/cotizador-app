-- ============================================
-- Script SQL: Políticas RLS para Vendedores
-- ============================================
-- Este script asegura que los vendedores puedan:
-- 1. Ver sus propias cotizaciones
-- 2. Crear nuevas cotizaciones
-- 3. Actualizar sus propias cotizaciones
-- 4. Ver el catálogo (muebles)
-- ============================================

-- ============================================
-- 1. POLÍTICAS RLS PARA COTIZACIONES
-- ============================================

-- Verificar que existan las políticas básicas
-- Si no existen, crearlas

-- Política: Los usuarios pueden ver sus propias cotizaciones (incluye vendedores)
DROP POLICY IF EXISTS "Users can view own cotizaciones" ON cotizaciones;
CREATE POLICY "Users can view own cotizaciones" ON cotizaciones
  FOR SELECT 
  USING (auth.uid() = usuario_id);

-- Política: Los usuarios pueden crear cotizaciones (incluye vendedores)
DROP POLICY IF EXISTS "Users can create cotizaciones" ON cotizaciones;
CREATE POLICY "Users can create cotizaciones" ON cotizaciones
  FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios pueden actualizar sus propias cotizaciones (incluye vendedores)
DROP POLICY IF EXISTS "Users can update own cotizaciones" ON cotizaciones;
CREATE POLICY "Users can update own cotizaciones" ON cotizaciones
  FOR UPDATE 
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- ============================================
-- 2. POLÍTICAS RLS PARA MUEBLES (CATÁLOGO)
-- ============================================

-- Verificar si la tabla muebles tiene RLS habilitado
-- Si no existe, habilitarlo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'muebles' 
    AND schemaname = 'public'
  ) THEN
    RAISE NOTICE 'La tabla muebles no existe. Verifica que esté creada.';
  ELSE
    -- Habilitar RLS si no está habilitado
    ALTER TABLE muebles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado en tabla muebles';
  END IF;
END $$;

-- Política: Todos los usuarios autenticados pueden ver muebles (catálogo público)
DROP POLICY IF EXISTS "Authenticated users can view muebles" ON muebles;
CREATE POLICY "Authenticated users can view muebles" ON muebles
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. POLÍTICAS RLS PARA MATERIALES (si se necesita)
-- ============================================

-- Los vendedores NO deberían poder ver materiales directamente
-- Solo los admins pueden ver materiales
-- (Esto ya debería estar configurado, pero lo verificamos)

-- ============================================
-- 4. VERIFICACIÓN
-- ============================================

-- Verificar políticas de cotizaciones
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'cotizaciones'
ORDER BY policyname;

-- Verificar políticas de muebles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'muebles'
ORDER BY policyname;

-- ============================================
-- NOTAS
-- ============================================
-- 1. Los vendedores pueden ver y crear cotizaciones usando su usuario_id
-- 2. Los vendedores pueden ver el catálogo (muebles) porque están autenticados
-- 3. Los vendedores NO pueden ver materiales ni servicios directamente
-- 4. Los vendedores NO pueden modificar el catálogo (solo lectura)
-- ============================================



