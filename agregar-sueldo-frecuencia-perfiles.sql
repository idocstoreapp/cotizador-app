-- ============================================
-- Script SQL: Agregar campos sueldo y frecuencia_pago a perfiles
-- ============================================
-- Este script agrega los campos necesarios para registrar el sueldo
-- y la frecuencia de pago de trabajadores y vendedores
-- ============================================

-- 1. Agregar campo sueldo (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfiles' AND column_name = 'sueldo'
  ) THEN
    ALTER TABLE perfiles ADD COLUMN sueldo DECIMAL(12, 2);
    RAISE NOTICE 'Campo sueldo agregado correctamente';
  ELSE
    RAISE NOTICE 'Campo sueldo ya existe';
  END IF;
END $$;

-- 2. Agregar campo frecuencia_pago (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfiles' AND column_name = 'frecuencia_pago'
  ) THEN
    -- Primero agregar la columna sin constraint
    ALTER TABLE perfiles ADD COLUMN frecuencia_pago TEXT;
    
    -- Establecer valor por defecto
    ALTER TABLE perfiles ALTER COLUMN frecuencia_pago SET DEFAULT 'mensual';
    
    -- Actualizar valores NULL a 'mensual'
    UPDATE perfiles SET frecuencia_pago = 'mensual' WHERE frecuencia_pago IS NULL;
    
    -- Agregar el constraint CHECK después
    ALTER TABLE perfiles 
    ADD CONSTRAINT frecuencia_pago_check 
    CHECK (frecuencia_pago IN ('mensual', 'quincenal', 'semanal', 'diario'));
    
    RAISE NOTICE 'Campo frecuencia_pago agregado correctamente';
  ELSE
    RAISE NOTICE 'Campo frecuencia_pago ya existe';
    
    -- Si existe pero no tiene constraint, agregarlo
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'perfiles' 
      AND constraint_name = 'frecuencia_pago_check'
    ) THEN
      -- Eliminar constraint anterior si existe con otro nombre
      ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS frecuencia_pago_check;
      
      -- Agregar el constraint
      ALTER TABLE perfiles 
      ADD CONSTRAINT frecuencia_pago_check 
      CHECK (frecuencia_pago IN ('mensual', 'quincenal', 'semanal', 'diario'));
      
      RAISE NOTICE 'Constraint frecuencia_pago_check agregado';
    END IF;
  END IF;
END $$;

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN perfiles.sueldo IS 'Sueldo del trabajador o vendedor';
COMMENT ON COLUMN perfiles.frecuencia_pago IS 'Frecuencia de pago del sueldo: mensual, quincenal, semanal o diario';

-- ============================================
-- Verificar que los campos se agregaron correctamente
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'frecuencia_pago' THEN '✅ Campo existe'
    WHEN column_name = 'sueldo' THEN '✅ Campo existe'
    ELSE '❌ Campo no encontrado'
  END as estado
FROM information_schema.columns
WHERE table_name = 'perfiles'
  AND column_name IN ('sueldo', 'frecuencia_pago')
ORDER BY column_name;

-- Verificar constraint
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'perfiles'
  AND constraint_name = 'frecuencia_pago_check';

