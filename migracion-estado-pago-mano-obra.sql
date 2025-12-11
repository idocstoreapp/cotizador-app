-- ============================================
-- Script SQL: Agregar estado de pago y monto manual de mano de obra
-- ============================================
-- Este script agrega las columnas necesarias para:
-- 1. Estado de pago en cotizaciones (estado_pago, monto_pagado)
-- 2. Monto manual de mano de obra (monto_manual, tipo_calculo)
-- ============================================
-- IMPORTANTE: Ejecuta este script en el SQL Editor de Supabase
-- ============================================

-- ============================================
-- 1. AGREGAR ESTADO DE PAGO A COTIZACIONES
-- ============================================
DO $$ 
BEGIN
  -- Agregar estado_pago si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' 
    AND column_name = 'estado_pago'
  ) THEN
    ALTER TABLE cotizaciones 
    ADD COLUMN estado_pago TEXT CHECK (estado_pago IN ('no_pagado', 'pago_parcial', 'pagado'));
    
    COMMENT ON COLUMN cotizaciones.estado_pago IS 'Estado de pago de la cotización: no_pagado, pago_parcial, pagado';
  END IF;

  -- Agregar monto_pagado si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' 
    AND column_name = 'monto_pagado'
  ) THEN
    ALTER TABLE cotizaciones 
    ADD COLUMN monto_pagado NUMERIC DEFAULT 0;
    
    COMMENT ON COLUMN cotizaciones.monto_pagado IS 'Monto total pagado hasta el momento';
  END IF;
END $$;

-- ============================================
-- 2. AGREGAR MONTO MANUAL A MANO DE OBRA REAL
-- ============================================
DO $$ 
BEGIN
  -- Agregar tipo_calculo si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mano_obra_real' 
    AND column_name = 'tipo_calculo'
  ) THEN
    ALTER TABLE mano_obra_real
    ADD COLUMN tipo_calculo TEXT CHECK (tipo_calculo IN ('horas', 'monto')) DEFAULT 'horas';
    
    COMMENT ON COLUMN mano_obra_real.tipo_calculo IS 'Tipo de cálculo: horas (horas × precio) o monto (monto manual)';
    
    -- Actualizar registros existentes para que tengan el valor por defecto
    UPDATE mano_obra_real
    SET tipo_calculo = 'horas'
    WHERE tipo_calculo IS NULL;
  END IF;

  -- Agregar monto_manual si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mano_obra_real' 
    AND column_name = 'monto_manual'
  ) THEN
    ALTER TABLE mano_obra_real
    ADD COLUMN monto_manual NUMERIC;
    
    COMMENT ON COLUMN mano_obra_real.monto_manual IS 'Monto manual de mano de obra cuando tipo_calculo es monto';
  END IF;
END $$;

-- Actualizar total_pagado para registros existentes con monto_manual
UPDATE mano_obra_real
SET total_pagado = monto_manual
WHERE tipo_calculo = 'monto' 
  AND monto_manual IS NOT NULL 
  AND monto_manual > 0
  AND (total_pagado IS NULL OR total_pagado = 0);

-- Verificar que las columnas se crearon correctamente
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada. Verificando columnas...';
  
  -- Verificar cotizaciones
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' AND column_name = 'estado_pago'
  ) THEN
    RAISE NOTICE '✅ Columna estado_pago existe en cotizaciones';
  ELSE
    RAISE WARNING '❌ Columna estado_pago NO existe en cotizaciones';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' AND column_name = 'monto_pagado'
  ) THEN
    RAISE NOTICE '✅ Columna monto_pagado existe en cotizaciones';
  ELSE
    RAISE WARNING '❌ Columna monto_pagado NO existe en cotizaciones';
  END IF;
  
  -- Verificar mano_obra_real
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mano_obra_real' AND column_name = 'tipo_calculo'
  ) THEN
    RAISE NOTICE '✅ Columna tipo_calculo existe en mano_obra_real';
  ELSE
    RAISE WARNING '❌ Columna tipo_calculo NO existe en mano_obra_real';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mano_obra_real' AND column_name = 'monto_manual'
  ) THEN
    RAISE NOTICE '✅ Columna monto_manual existe en mano_obra_real';
  ELSE
    RAISE WARNING '❌ Columna monto_manual NO existe en mano_obra_real';
  END IF;
END $$;
