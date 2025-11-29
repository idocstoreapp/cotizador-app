-- ============================================
-- Script SQL: Diagnosticar y Corregir Perfil de Usuario
-- ============================================
-- Este script diagnostica y corrige problemas con el perfil del usuario
-- ============================================

-- 1. VERIFICAR SI EL USUARIO EXISTE EN auth.users
SELECT 
  'Usuario en auth.users' as tipo,
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'admin@cotizador.com';

-- 2. VERIFICAR SI EL PERFIL EXISTE EN perfiles
SELECT 
  'Perfil en perfiles' as tipo,
  id,
  email,
  nombre,
  apellido,
  role,
  especialidad,
  created_at
FROM perfiles
WHERE email = 'admin@cotizador.com' OR id = '9fb511b6-d911-48e6-ba65-1405b2d52c47';

-- 3. VERIFICAR POLÍTICAS RLS EXISTENTES
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

-- 4. VERIFICAR CONSTRAINTS DE LA TABLA
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'perfiles'::regclass;

-- 5. VERIFICAR ESTRUCTURA DE LA TABLA
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'perfiles'
ORDER BY ordinal_position;

-- ============================================
-- CORRECCIONES (ejecutar solo si es necesario)
-- ============================================

-- A. Crear o actualizar el perfil del usuario
-- Primero obtener el ID del usuario desde auth.users
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
    RAISE NOTICE 'Usuario no encontrado en auth.users';
  ELSE
    RAISE NOTICE 'Usuario encontrado: % (ID: %)', user_email, user_id;
    
    -- Insertar o actualizar el perfil
    INSERT INTO perfiles (id, email, role, nombre, apellido)
    VALUES (
      user_id,
      user_email,
      'admin',  -- Cambiar a 'admin' si debe ser administrador
      'Administrador',
      NULL
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      role = 'admin',  -- Asegurar que sea admin
      nombre = COALESCE(EXCLUDED.nombre, perfiles.nombre, 'Administrador'),
      apellido = COALESCE(EXCLUDED.apellido, perfiles.apellido);
    
    RAISE NOTICE 'Perfil creado/actualizado correctamente';
  END IF;
END $$;

-- B. Verificar que las políticas RLS permitan leer el perfil propio
-- Eliminar políticas problemáticas si existen
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;

-- Crear política correcta para ver el perfil propio
CREATE POLICY "Users can view own profile" ON perfiles
  FOR SELECT 
  USING (auth.uid() = id);

-- C. Asegurar que los admins puedan ver todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON perfiles;

CREATE POLICY "Admins can view all profiles" ON perfiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM perfiles AS p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Después de ejecutar las correcciones, verifica:

SELECT 
  'Verificación final' as tipo,
  u.id as user_id,
  u.email as user_email,
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
-- NOTAS
-- ============================================
-- Si el error 500 persiste después de esto, puede ser:
-- 1. Un problema con triggers o funciones en la tabla perfiles
-- 2. Un problema con la conexión a la base de datos
-- 3. Un problema con las variables de entorno de Supabase
-- ============================================

