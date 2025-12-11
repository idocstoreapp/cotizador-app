-- ============================================
-- MIGRACIÓN RÁPIDA - Ejecuta estos comandos en Supabase SQL Editor
-- ============================================

-- 1. Agregar columnas a mano_obra_real
ALTER TABLE mano_obra_real
ADD COLUMN IF NOT EXISTS tipo_calculo TEXT CHECK (tipo_calculo IN ('horas', 'monto')) DEFAULT 'horas',
ADD COLUMN IF NOT EXISTS monto_manual NUMERIC;

-- 2. Actualizar registros existentes
UPDATE mano_obra_real
SET tipo_calculo = 'horas'
WHERE tipo_calculo IS NULL;

-- 3. Agregar columnas a cotizaciones (si aún no las tienes)
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS estado_pago TEXT CHECK (estado_pago IN ('no_pagado', 'pago_parcial', 'pagado')),
ADD COLUMN IF NOT EXISTS monto_pagado NUMERIC DEFAULT 0;

-- ✅ Listo! Las columnas deberían estar creadas ahora.


