-- ============================================
-- Script SQL: Agregar TODOS los campos nuevos a perfiles
-- ============================================
-- Este script agrega todos los campos necesarios para la gestión de personal:
-- - rut, direccion, telefono (de agregar-campos-personal-perfiles.sql)
-- - sueldo, frecuencia_pago (de agregar-sueldo-frecuencia-perfiles.sql)
-- ============================================

-- ============================================
-- 1. AGREGAR CAMPOS: rut, direccion, telefono
-- ============================================

-- Agregar campo rut
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfiles' AND column_name = 'rut'
  ) THEN
    ALTER TABLE perfiles ADD COLUMN rut TEXT;
    RAISE NOTICE '✅ Campo rut agregado';
  ELSE
    RAISE NOTICE 'ℹ️ Campo rut ya existe';
  END IF;
END $$;

-- Agregar campo direccion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfiles' AND column_name = 'direccion'
  ) THEN
    ALTER TABLE perfiles ADD COLUMN direccion TEXT;
    RAISE NOTICE '✅ Campo direccion agregado';
  ELSE
    RAISE NOTICE 'ℹ️ Campo direccion ya existe';
  END IF;
END $$;

-- Agregar campo telefono
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfiles' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE perfiles ADD COLUMN telefono TEXT;
    RAISE NOTICE '✅ Campo telefono agregado';
  ELSE
    RAISE NOTICE 'ℹ️ Campo telefono ya existe';
  END IF;
END $$;

-- ============================================
-- 2. AGREGAR CAMPOS: sueldo, frecuencia_pago
-- ============================================

-- Agregar campo sueldo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfiles' AND column_name = 'sueldo'
  ) THEN
    ALTER TABLE perfiles ADD COLUMN sueldo DECIMAL(12, 2);
    RAISE NOTICE '✅ Campo sueldo agregado';
  ELSE
    RAISE NOTICE 'ℹ️ Campo sueldo ya existe';
  END IF;
END $$;

-- Agregar campo frecuencia_pago
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfiles' AND column_name = 'frecuencia_pago'
  ) THEN
    -- Agregar la columna sin constraint primero
    ALTER TABLE perfiles ADD COLUMN frecuencia_pago TEXT;
    
    -- Establecer valor por defecto
    ALTER TABLE perfiles ALTER COLUMN frecuencia_pago SET DEFAULT 'mensual';
    
    -- Actualizar valores NULL a 'mensual'
    UPDATE perfiles SET frecuencia_pago = 'mensual' WHERE frecuencia_pago IS NULL;
    
    -- Agregar el constraint CHECK después
    ALTER TABLE perfiles 
    ADD CONSTRAINT frecuencia_pago_check 
    CHECK (frecuencia_pago IN ('mensual', 'quincenal', 'semanal', 'diario'));
    
    RAISE NOTICE '✅ Campo frecuencia_pago agregado con constraint';
  ELSE
    RAISE NOTICE 'ℹ️ Campo frecuencia_pago ya existe';
    
    -- Si existe pero no tiene constraint, agregarlo
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'perfiles' 
      AND constraint_name = 'frecuencia_pago_check'
    ) THEN
      -- Eliminar constraint anterior si existe con otro nombre
      ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS frecuencia_pago_check;
      
      -- Actualizar valores NULL a 'mensual' si hay
      UPDATE perfiles SET frecuencia_pago = 'mensual' WHERE frecuencia_pago IS NULL;
      
      -- Agregar el constraint
      ALTER TABLE perfiles 
      ADD CONSTRAINT frecuencia_pago_check 
      CHECK (frecuencia_pago IN ('mensual', 'quincenal', 'semanal', 'diario'));
      
      RAISE NOTICE '✅ Constraint frecuencia_pago_check agregado';
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. AGREGAR COMENTARIOS
-- ============================================
COMMENT ON COLUMN perfiles.rut IS 'RUT del trabajador o vendedor';
COMMENT ON COLUMN perfiles.direccion IS 'Dirección del trabajador o vendedor';
COMMENT ON COLUMN perfiles.telefono IS 'Número de teléfono del trabajador o vendedor';
COMMENT ON COLUMN perfiles.sueldo IS 'Sueldo del trabajador o vendedor';
COMMENT ON COLUMN perfiles.frecuencia_pago IS 'Frecuencia de pago del sueldo: mensual, quincenal, semanal o diario';

-- ============================================
-- 4. VERIFICACIÓN FINAL
-- ============================================
SELECT 
  'Verificación de campos' as tipo,
  column_name as campo,
  data_type as tipo_dato,
  is_nullable as puede_ser_null,
  column_default as valor_por_defecto,
  CASE 
    WHEN column_name IN ('rut', 'direccion', 'telefono', 'sueldo', 'frecuencia_pago') THEN '✅ Existe'
    ELSE '❌ No encontrado'
  END as estado
FROM information_schema.columns
WHERE table_name = 'perfiles'
  AND column_name IN ('rut', 'direccion', 'telefono', 'sueldo', 'frecuencia_pago')
ORDER BY 
  CASE column_name
    WHEN 'rut' THEN 1
    WHEN 'direccion' THEN 2
    WHEN 'telefono' THEN 3
    WHEN 'sueldo' THEN 4
    WHEN 'frecuencia_pago' THEN 5
  END;

-- Verificar constraint de frecuencia_pago
SELECT 
  'Verificación de constraint' as tipo,
  constraint_name as nombre_constraint,
  constraint_type as tipo_constraint,
  table_name as tabla
FROM information_schema.table_constraints
WHERE table_name = 'perfiles'
  AND constraint_name = 'frecuencia_pago_check';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Después de ejecutar este script, recarga la aplicación
-- 2. Si el error persiste, puede ser que el schema cache de Supabase
--    necesite refrescarse. Espera unos segundos y recarga.
-- 3. Si aún hay problemas, verifica en Supabase Dashboard > Table Editor
--    que los campos aparezcan en la tabla perfiles
-- ============================================

