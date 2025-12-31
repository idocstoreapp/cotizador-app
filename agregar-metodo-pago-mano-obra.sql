-- ============================================
-- Script SQL: Agregar campo metodo_pago a mano_obra_real
-- ============================================
-- Este script agrega el campo metodo_pago para registrar
-- cómo se le pagó al trabajador (efectivo o transferencia)
-- ============================================

-- Agregar campo metodo_pago
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mano_obra_real' AND column_name = 'metodo_pago'
  ) THEN
    -- Agregar la columna sin constraint primero
    ALTER TABLE mano_obra_real ADD COLUMN metodo_pago TEXT;
    
    -- Agregar el constraint CHECK después
    ALTER TABLE mano_obra_real 
    ADD CONSTRAINT metodo_pago_check 
    CHECK (metodo_pago IS NULL OR metodo_pago IN ('efectivo', 'transferencia'));
    
    RAISE NOTICE '✅ Campo metodo_pago agregado correctamente con constraint';
  ELSE
    RAISE NOTICE 'ℹ️ Campo metodo_pago ya existe';
    
    -- Si existe pero no tiene constraint, agregarlo
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'mano_obra_real' 
      AND constraint_name = 'metodo_pago_check'
    ) THEN
      -- Eliminar constraint anterior si existe con otro nombre
      ALTER TABLE mano_obra_real DROP CONSTRAINT IF EXISTS metodo_pago_check;
      
      -- Agregar el constraint
      ALTER TABLE mano_obra_real 
      ADD CONSTRAINT metodo_pago_check 
      CHECK (metodo_pago IS NULL OR metodo_pago IN ('efectivo', 'transferencia'));
      
      RAISE NOTICE '✅ Constraint metodo_pago_check agregado';
    END IF;
  END IF;
END $$;

-- Agregar comentario para documentación
COMMENT ON COLUMN mano_obra_real.metodo_pago IS 'Método de pago al trabajador: efectivo o transferencia';

-- ============================================
-- Verificación
-- ============================================
SELECT 
  'Verificación de campo' as tipo,
  column_name as campo,
  data_type as tipo_dato,
  is_nullable as puede_ser_null,
  CASE 
    WHEN column_name = 'metodo_pago' THEN '✅ Campo existe'
    ELSE '❌ Campo no encontrado'
  END as estado
FROM information_schema.columns
WHERE table_name = 'mano_obra_real'
  AND column_name = 'metodo_pago';

-- Verificar constraint
SELECT 
  'Verificación de constraint' as tipo,
  constraint_name as nombre_constraint,
  constraint_type as tipo_constraint,
  table_name as tabla
FROM information_schema.table_constraints
WHERE table_name = 'mano_obra_real'
  AND constraint_name = 'metodo_pago_check';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. El campo metodo_pago es opcional (puede ser NULL)
-- 2. Solo acepta valores 'efectivo' o 'transferencia'
-- 3. Después de ejecutar este script, recarga la aplicación
-- 4. Si el error persiste, espera unos segundos para que
--    el schema cache de Supabase se actualice
-- ============================================

