-- ============================================
-- Script SQL: Corregir Recursión Infinita en Políticas RLS de perfiles
-- ============================================
-- El error "infinite recursion detected in policy" ocurre porque
-- las políticas intentan consultar la tabla perfiles para verificar
-- si el usuario es admin, causando recursión infinita.
-- 
-- SOLUCIÓN: Usar función SECURITY DEFINER que bypasea RLS
-- ============================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON perfiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON perfiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON perfiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON perfiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON perfiles;

-- 2. CREAR FUNCIÓN HELPER QUE EVITA RECURSIÓN
-- Esta función usa SECURITY DEFINER para bypasear RLS y evitar recursión
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Si no hay usuario autenticado, retornar false
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Obtener el rol directamente desde perfiles sin pasar por RLS
  -- SECURITY DEFINER permite esto
  SELECT role INTO user_role
  FROM perfiles
  WHERE id = auth.uid();
  
  -- Retornar true solo si el rol es 'admin'
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$;

-- 3. CREAR POLÍTICAS SIN RECURSIÓN

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON perfiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON perfiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil (para registro inicial)
CREATE POLICY "Users can insert own profile" ON perfiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Política: Los admins pueden ver todos los perfiles
-- IMPORTANTE: Usar la función es_admin() que evita recursión
CREATE POLICY "Admins can view all profiles" ON perfiles
  FOR SELECT 
  USING (
    -- Permitir ver su propio perfil
    auth.uid() = id
    OR
    -- O si es admin (usando función que evita recursión)
    es_admin()
  );

-- Política: Los admins pueden crear perfiles de otros usuarios
CREATE POLICY "Admins can create profiles" ON perfiles
  FOR INSERT 
  WITH CHECK (
    -- Permitir si es su propio perfil
    auth.uid() = id
    OR
    -- O si es admin (usando función que evita recursión)
    es_admin()
  );

-- Política: Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles" ON perfiles
  FOR UPDATE 
  USING (
    -- Permitir si es su propio perfil
    auth.uid() = id
    OR
    -- O si es admin (usando función que evita recursión)
    es_admin()
  );

-- Política: Los admins pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles" ON perfiles
  FOR DELETE 
  USING (es_admin());

-- ============================================
-- Verificación
-- ============================================
-- Verificar que las políticas fueron creadas correctamente
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
WHERE tablename = 'perfiles'
ORDER BY policyname;

-- Verificar que la función fue creada
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'es_admin';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. La función es_admin() usa SECURITY DEFINER para bypasear RLS
--    y evitar la recursión infinita
-- 2. La función es STABLE para optimización
-- 3. Las políticas ahora usan la función en lugar de consultar
--    directamente la tabla perfiles
-- 4. Esto permite que los admins vean, creen, actualicen y eliminen
--    perfiles sin causar recursión
-- ============================================

