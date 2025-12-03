-- ============================================
-- Script para agregar campo de alcance a gastos reales
-- Permite indicar si el gasto es por unidad, parcial o total
-- ============================================

-- Función auxiliar para agregar columna solo si no existe
DO $$
BEGIN
  -- Agregar campo alcance_gasto a gastos_reales_materiales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gastos_reales_materiales' 
    AND column_name = 'alcance_gasto'
  ) THEN
    ALTER TABLE gastos_reales_materiales
    ADD COLUMN alcance_gasto TEXT DEFAULT 'unidad';
    
    ALTER TABLE gastos_reales_materiales
    ADD CONSTRAINT check_alcance_gasto_materiales 
    CHECK (alcance_gasto IN ('unidad', 'parcial', 'total'));
  END IF;

  -- Agregar campo alcance_gasto a mano_obra_real
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mano_obra_real' 
    AND column_name = 'alcance_gasto'
  ) THEN
    ALTER TABLE mano_obra_real
    ADD COLUMN alcance_gasto TEXT DEFAULT 'unidad';
    
    ALTER TABLE mano_obra_real
    ADD CONSTRAINT check_alcance_gasto_mano_obra 
    CHECK (alcance_gasto IN ('unidad', 'parcial', 'total'));
  END IF;

  -- Agregar campo alcance_gasto a gastos_hormiga
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gastos_hormiga' 
    AND column_name = 'alcance_gasto'
  ) THEN
    ALTER TABLE gastos_hormiga
    ADD COLUMN alcance_gasto TEXT DEFAULT 'unidad';
    
    ALTER TABLE gastos_hormiga
    ADD CONSTRAINT check_alcance_gasto_hormiga 
    CHECK (alcance_gasto IN ('unidad', 'parcial', 'total'));
  END IF;

  -- Agregar campo alcance_gasto a transporte_real
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transporte_real' 
    AND column_name = 'alcance_gasto'
  ) THEN
    ALTER TABLE transporte_real
    ADD COLUMN alcance_gasto TEXT DEFAULT 'unidad';
    
    ALTER TABLE transporte_real
    ADD CONSTRAINT check_alcance_gasto_transporte 
    CHECK (alcance_gasto IN ('unidad', 'parcial', 'total'));
  END IF;

  -- Agregar campo cantidad_items_aplicados a gastos_reales_materiales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gastos_reales_materiales' 
    AND column_name = 'cantidad_items_aplicados'
  ) THEN
    ALTER TABLE gastos_reales_materiales
    ADD COLUMN cantidad_items_aplicados INTEGER;
  END IF;

  -- Agregar campo cantidad_items_aplicados a mano_obra_real
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mano_obra_real' 
    AND column_name = 'cantidad_items_aplicados'
  ) THEN
    ALTER TABLE mano_obra_real
    ADD COLUMN cantidad_items_aplicados INTEGER;
  END IF;

  -- Agregar campo cantidad_items_aplicados a gastos_hormiga
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gastos_hormiga' 
    AND column_name = 'cantidad_items_aplicados'
  ) THEN
    ALTER TABLE gastos_hormiga
    ADD COLUMN cantidad_items_aplicados INTEGER;
  END IF;

  -- Agregar campo cantidad_items_aplicados a transporte_real
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transporte_real' 
    AND column_name = 'cantidad_items_aplicados'
  ) THEN
    ALTER TABLE transporte_real
    ADD COLUMN cantidad_items_aplicados INTEGER;
  END IF;
END $$;

-- Comentarios (se ejecutan siempre, pero no causan error si ya existen)
COMMENT ON COLUMN gastos_reales_materiales.alcance_gasto IS 'Indica si el gasto es por unidad (1 item), parcial (varios items) o total (todos los items)';
COMMENT ON COLUMN gastos_reales_materiales.cantidad_items_aplicados IS 'Cantidad de items a los que aplica este gasto (solo para alcance_gasto = parcial)';
COMMENT ON COLUMN mano_obra_real.alcance_gasto IS 'Indica si el gasto es por unidad (1 item), parcial (varios items) o total (todos los items)';
COMMENT ON COLUMN mano_obra_real.cantidad_items_aplicados IS 'Cantidad de items a los que aplica este gasto (solo para alcance_gasto = parcial)';
COMMENT ON COLUMN gastos_hormiga.alcance_gasto IS 'Indica si el gasto es por unidad (1 item), parcial (varios items) o total (todos los items)';
COMMENT ON COLUMN gastos_hormiga.cantidad_items_aplicados IS 'Cantidad de items a los que aplica este gasto (solo para alcance_gasto = parcial)';
COMMENT ON COLUMN transporte_real.alcance_gasto IS 'Indica si el gasto es por unidad (1 item), parcial (varios items) o total (todos los items)';
COMMENT ON COLUMN transporte_real.cantidad_items_aplicados IS 'Cantidad de items a los que aplica este gasto (solo para alcance_gasto = parcial)';
