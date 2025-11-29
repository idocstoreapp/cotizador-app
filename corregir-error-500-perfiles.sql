-- ============================================
-- Script SQL: Corregir Error 500 al Cargar Perfiles
-- ============================================
-- Este script corrige el error 500 que ocurre al intentar cargar perfiles
-- ============================================

-- 1. CORREGIR POLÍTICAS RLS (esto puede estar causando el error 500)
-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON perfiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON perfiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON perfiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON perfiles;

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
CREATE POLICY "Admins can view all profiles" ON perfiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM perfiles AS p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Política: Los admins pueden crear perfiles de otros usuarios (vendedores y trabajadores)
CREATE POLICY "Admins can create profiles" ON perfiles
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles AS p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Política: Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles" ON perfiles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM perfiles AS p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- 2. CREAR O ACTUALIZAR EL PERFIL DEL USUARIO admin@cotizador.com
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
    
    -- Insertar o actualizar el perfil
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

-- 3. VERIFICAR QUE EL PERFIL SE CREÓ CORRECTAMENTE
SELECT 
  'Verificación' as tipo,
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

-- 4. VERIFICAR ESTRUCTURA DE LA TABLA (por si hay problemas)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'perfiles'
ORDER BY ordinal_position;

-- 5. VERIFICAR CONSTRAINTS (por si hay problemas con foreign keys)
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'perfiles'::regclass;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- Si el error 500 persiste después de ejecutar este script:
-- 
-- 1. Verifica en Supabase Dashboard > Database > Tables > perfiles
--    que la tabla existe y tiene la estructura correcta
--
-- 2. Verifica en Supabase Dashboard > Authentication > Policies
--    que las políticas RLS están activas
--
-- 3. Verifica que no haya triggers o funciones que estén causando errores
--    en Supabase Dashboard > Database > Functions
--
-- 4. Si el problema persiste, intenta deshabilitar RLS temporalmente:
--    ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;
--    (Luego vuelve a habilitarlo: ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;)
-- ============================================

