-- =============================================================================
-- Arregla relaciones y columnas para que PostgREST reconozca los embeds
-- y la app (Caja de Ahorros, Dashboard, Liquidaciones, Gastos Fijos) no falle.
-- Ejecutar en Supabase → SQL Editor del proyecto correspondiente.
-- =============================================================================

-- 1) LIQUIDACIONES: columnas y FKs para persona y liquidador
-- La app usa persona_id y liquidado_por; PostgREST necesita FKs con estos nombres.
ALTER TABLE public.liquidaciones
  ADD COLUMN IF NOT EXISTS persona_id uuid,
  ADD COLUMN IF NOT EXISTS liquidado_por uuid,
  ADD COLUMN IF NOT EXISTS fecha_liquidacion timestamptz;

-- Sincronizar datos: si existe trabajador_id, usarlo como persona_id
UPDATE public.liquidaciones
SET persona_id = trabajador_id
WHERE persona_id IS NULL AND trabajador_id IS NOT NULL;

UPDATE public.liquidaciones
SET fecha_liquidacion = (fecha AT TIME ZONE 'UTC')::timestamptz
WHERE fecha_liquidacion IS NULL AND fecha IS NOT NULL;

-- Crear FKs con los nombres exactos que usa el código
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'liquidaciones_persona_id_fkey'
  ) THEN
    ALTER TABLE public.liquidaciones
      ADD CONSTRAINT liquidaciones_persona_id_fkey
      FOREIGN KEY (persona_id) REFERENCES public.perfiles(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'liquidaciones_liquidado_por_fkey'
  ) THEN
    ALTER TABLE public.liquidaciones
      ADD CONSTRAINT liquidaciones_liquidado_por_fkey
      FOREIGN KEY (liquidado_por) REFERENCES public.perfiles(id);
  END IF;
END $$;

-- 2) FIXED_EXPENSES ↔ FIXED_EXPENSE_CATEGORIES
-- La app hace select con category:fixed_expense_categories(...); necesita FK.
ALTER TABLE public.fixed_expense_categories
  ADD COLUMN IF NOT EXISTS name text;

-- Copiar nombre → name solo si existe columna nombre
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fixed_expense_categories' AND column_name = 'nombre'
  ) THEN
    UPDATE public.fixed_expense_categories SET name = nombre WHERE name IS NULL AND nombre IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fixed_expenses_category_id_fkey'
  ) THEN
    ALTER TABLE public.fixed_expenses
      ADD CONSTRAINT fixed_expenses_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.fixed_expense_categories(id);
  END IF;
END $$;

-- 3) BALANCE_PERSONAL: la app filtra por persona_id
ALTER TABLE public.balance_personal
  ADD COLUMN IF NOT EXISTS persona_id uuid;

UPDATE public.balance_personal
SET persona_id = trabajador_id
WHERE persona_id IS NULL AND trabajador_id IS NOT NULL;

-- 4) GASTOS_REALES_MATERIALES: columna cantidad_real (el código la usa)
ALTER TABLE public.gastos_reales_materiales
  ADD COLUMN IF NOT EXISTS cantidad_real numeric(14,4);

UPDATE public.gastos_reales_materiales
SET cantidad_real = cantidad
WHERE cantidad_real IS NULL AND cantidad IS NOT NULL;

-- 5) TRANSPORTE_REAL: columna costo (el código la usa; en tabla está monto)
ALTER TABLE public.transporte_real
  ADD COLUMN IF NOT EXISTS costo numeric(14,2);

UPDATE public.transporte_real
SET costo = monto
WHERE costo IS NULL AND monto IS NOT NULL;

-- 6) MANO_OBRA_REAL → perfiles (trabajador) para el embed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mano_obra_real_trabajador_id_fkey'
  ) THEN
    ALTER TABLE public.mano_obra_real
      ADD CONSTRAINT mano_obra_real_trabajador_id_fkey
      FOREIGN KEY (trabajador_id) REFERENCES public.perfiles(id);
  END IF;
END $$;
