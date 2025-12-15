-- ============================================
-- Script SQL: Agregar Política RLS para DELETE en perfiles
-- ============================================
-- Este script agrega la política necesaria para que los admins
-- puedan eliminar perfiles de vendedores y trabajadores de taller
-- ============================================

-- 1. Verificar si existe la función es_admin() y crearla si no existe
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

-- 2. Eliminar política de DELETE si existe
DROP POLICY IF EXISTS "Admins can delete profiles" ON perfiles;

-- 3. Crear política de DELETE para admins
CREATE POLICY "Admins can delete profiles" ON perfiles
  FOR DELETE 
  USING (es_admin());

-- ============================================
-- Verificación
-- ============================================
-- Después de ejecutar este script, verifica que:
-- 1. La función es_admin() fue creada/actualizada
-- 2. La política "Admins can delete profiles" fue creada
-- 3. Los admins pueden eliminar perfiles de vendedores y trabajadores
-- ============================================

-- Para verificar que la política existe:
-- SELECT * FROM pg_policies WHERE tablename = 'perfiles' AND policyname = 'Admins can delete profiles';





