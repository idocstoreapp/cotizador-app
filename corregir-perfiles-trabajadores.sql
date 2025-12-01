-- ============================================
-- Script SQL: Corregir tabla perfiles para trabajadores de taller
-- ============================================
-- Este script permite que la tabla perfiles tenga IDs que NO sean referencias a auth.users
-- Esto es necesario para trabajadores de taller que no tienen usuario de autenticación
-- ============================================

-- 1. Eliminar la foreign key constraint que requiere que id sea referencia a auth.users
ALTER TABLE perfiles
DROP CONSTRAINT IF EXISTS perfiles_id_fkey;

-- 2. Hacer que el campo email no sea obligatorio (trabajadores de taller no tienen email)
ALTER TABLE perfiles
ALTER COLUMN email DROP NOT NULL;

-- 3. Agregar constraint para que el id pueda ser cualquier UUID (no solo de auth.users)
-- Nota: No podemos agregar un constraint que valide esto, pero al eliminar la FK ya funciona

-- 4. Actualizar políticas RLS para permitir que admins creen perfiles de otros usuarios
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON perfiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON perfiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON perfiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON perfiles;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON perfiles
  FOR SELECT USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil (para registro inicial)
CREATE POLICY "Users can insert own profile" ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política: Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON perfiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política: Los admins pueden crear perfiles de otros usuarios (vendedores y trabajadores)
CREATE POLICY "Admins can create profiles" ON perfiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política: Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles" ON perfiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================
-- Verificación
-- ============================================
-- Después de ejecutar este script, verifica que:
-- 1. La foreign key constraint fue eliminada
-- 2. Las políticas RLS fueron actualizadas
-- 3. Puedes insertar perfiles con IDs que no sean de auth.users
-- ============================================


