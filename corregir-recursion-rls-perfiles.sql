-- ============================================
-- Script SQL: Corregir Recursión Infinita en Políticas RLS
-- ============================================
-- El error "infinite recursion detected in policy" ocurre porque
-- las políticas intentan consultar la tabla perfiles para verificar
-- si el usuario es admin, causando recursión infinita.
-- 
-- SOLUCIÓN: Usar user_metadata del JWT en lugar de consultar perfiles
-- ============================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON perfiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON perfiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON perfiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON perfiles;

-- 2. CREAR POLÍTICAS SIN RECURSIÓN
-- Usar auth.uid() directamente, sin consultar la tabla perfiles

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
-- IMPORTANTE: Usar SECURITY DEFINER function para evitar recursión
-- Primero crear una función helper que verifique el rol sin causar recursión
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Obtener el rol directamente desde perfiles sin pasar por RLS
  SELECT role INTO user_role
  FROM perfiles
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$;

-- Política: Los admins pueden ver todos los perfiles
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

-- 3. CREAR O ACTUALIZAR EL PERFIL DEL USUARIO admin@cotizador.com
-- Asegurar que tenga rol 'admin' y no 'tecnico'
DO $$
DECLARE
  user_id UUID;
  user_email TEXT;
BEGIN
  -- Obtener ID y email del usuario
  SELECT id, email INTO user_id, user_email
  FROM auth.users
  WHERE email = 'admin@cotizador.com'
  LIMIT 1;

  IF user_id IS NULL THEN
    RAISE NOTICE '❌ Usuario admin@cotizador.com no encontrado en auth.users';
  ELSE
    RAISE NOTICE '✅ Usuario encontrado: % (ID: %)', user_email, user_id;
    
    -- Insertar o actualizar el perfil con rol 'admin'
    INSERT INTO perfiles (id, email, role, nombre, apellido)
    VALUES (
      user_id,
      user_email,
      'admin',  -- Asegurar que sea admin
      'Administrador',
      NULL
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      role = 'admin',  -- Cambiar a admin si era tecnico
      nombre = COALESCE(EXCLUDED.nombre, perfiles.nombre, 'Administrador'),
      apellido = COALESCE(EXCLUDED.apellido, perfiles.apellido);
    
    RAISE NOTICE '✅ Perfil creado/actualizado correctamente con rol admin';
  END IF;
END $$;

-- 4. ACTUALIZAR user_metadata EN auth.users PARA EVITAR RECURSIÓN
-- Esto permite que las políticas verifiquen el rol sin consultar perfiles
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'admin',
  'nombre', 'Administrador'
)
WHERE email = 'admin@cotizador.com'
AND (raw_user_meta_data->>'role' IS NULL OR raw_user_meta_data->>'role' != 'admin');

-- 5. VERIFICACIÓN FINAL
SELECT 
  'Verificación' as tipo,
  u.id as user_id,
  u.email as user_email,
  u.raw_user_meta_data->>'role' as jwt_role,
  p.id as profile_id,
  p.role as profile_role,
  p.nombre as profile_nombre,
  CASE 
    WHEN p.id IS NULL THEN '❌ PERFIL FALTANTE'
    WHEN p.role != 'admin' THEN '⚠️ ROL INCORRECTO (debería ser admin)'
    ELSE '✅ PERFIL CORRECTO'
  END as estado
FROM auth.users u
LEFT JOIN perfiles p ON p.id = u.id
WHERE u.email = 'admin@cotizador.com';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Las políticas ahora usan user_metadata del JWT para verificar
--    si el usuario es admin, evitando la recursión infinita
--
-- 2. El perfil del usuario se actualiza con rol 'admin'
--
-- 3. El user_metadata en auth.users también se actualiza para que
--    las políticas puedan verificar el rol sin consultar perfiles
--
-- 4. Después de ejecutar este script:
--    - Recarga la aplicación
--    - El usuario debería aparecer como 'admin' en lugar de 'tecnico'
--    - El error 500 debería desaparecer
-- ============================================

