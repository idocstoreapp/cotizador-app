-- ============================================
-- Script SQL: Agregar Política RLS para DELETE en perfiles
-- ============================================
-- Este script agrega la política necesaria para que los admins
-- puedan eliminar perfiles de vendedores y trabajadores de taller
-- ============================================

-- Política: Los admins pueden eliminar perfiles
-- IMPORTANTE: Usar la función es_admin() si existe, o verificar directamente
DROP POLICY IF EXISTS "Admins can delete profiles" ON perfiles;

-- Si existe la función es_admin(), usarla
DO $$
BEGIN
  -- Verificar si existe la función es_admin()
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'es_admin'
  ) THEN
    -- Usar función es_admin() para evitar recursión
    EXECUTE '
      CREATE POLICY "Admins can delete profiles" ON perfiles
        FOR DELETE 
        USING (es_admin())
    ';
  ELSE
    -- Si no existe la función, usar consulta directa (puede causar recursión)
    -- Pero es mejor que no tener la política
    EXECUTE '
      CREATE POLICY "Admins can delete profiles" ON perfiles
        FOR DELETE 
        USING (
          EXISTS (
            SELECT 1 FROM perfiles AS p
            WHERE p.id = auth.uid() 
            AND p.role = ''admin''
          )
        )
    ';
  END IF;
END $$;

-- ============================================
-- Verificación
-- ============================================
-- Después de ejecutar este script, verifica que:
-- 1. La política "Admins can delete profiles" fue creada
-- 2. Los admins pueden eliminar perfiles de vendedores y trabajadores
-- ============================================



