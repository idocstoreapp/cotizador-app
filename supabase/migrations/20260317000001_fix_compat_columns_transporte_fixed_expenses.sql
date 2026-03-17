-- Compatibilidad de esquema para proyectos migrados
-- Objetivo: alinear nombres de columnas que el frontend espera para evitar errores 42703.

-- =========
-- transporte_real
-- =========
ALTER TABLE public.transporte_real
  ADD COLUMN IF NOT EXISTS tipo_descripcion text;

DO $$
BEGIN
  -- Backfill: si existe columna "tipo", copiarla a tipo_descripcion
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transporte_real' AND column_name = 'tipo'
  ) THEN
    EXECUTE $q$
      UPDATE public.transporte_real
      SET tipo_descripcion = tipo
      WHERE (tipo_descripcion IS NULL OR tipo_descripcion = '') AND tipo IS NOT NULL
    $q$;
  END IF;

  -- Backfill: si existe columna "descripcion", copiarla a tipo_descripcion
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transporte_real' AND column_name = 'descripcion'
  ) THEN
    EXECUTE $q$
      UPDATE public.transporte_real
      SET tipo_descripcion = descripcion
      WHERE (tipo_descripcion IS NULL OR tipo_descripcion = '') AND descripcion IS NOT NULL
    $q$;
  END IF;
END $$;

-- =========
-- fixed_expenses
-- =========
ALTER TABLE public.fixed_expenses
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.fixed_expenses
  ADD COLUMN IF NOT EXISTS provider text;

ALTER TABLE public.fixed_expenses
  ADD COLUMN IF NOT EXISTS amount numeric(14,2);

DO $$
BEGIN
  -- Backfill description desde "descripcion" o "detalle"
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fixed_expenses' AND column_name = 'descripcion'
  ) THEN
    EXECUTE $q$
      UPDATE public.fixed_expenses
      SET description = descripcion
      WHERE (description IS NULL OR description = '') AND descripcion IS NOT NULL
    $q$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fixed_expenses' AND column_name = 'detalle'
  ) THEN
    EXECUTE $q$
      UPDATE public.fixed_expenses
      SET description = detalle
      WHERE (description IS NULL OR description = '') AND detalle IS NOT NULL
    $q$;
  END IF;

  -- Backfill provider desde "proveedor"
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fixed_expenses' AND column_name = 'proveedor'
  ) THEN
    EXECUTE $q$
      UPDATE public.fixed_expenses
      SET provider = proveedor
      WHERE (provider IS NULL OR provider = '') AND proveedor IS NOT NULL
    $q$;
  END IF;

  -- Backfill amount desde "monto" o "valor"
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fixed_expenses' AND column_name = 'monto'
  ) THEN
    EXECUTE $q$
      UPDATE public.fixed_expenses
      SET amount = monto
      WHERE amount IS NULL AND monto IS NOT NULL
    $q$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fixed_expenses' AND column_name = 'valor'
  ) THEN
    EXECUTE $q$
      UPDATE public.fixed_expenses
      SET amount = valor
      WHERE amount IS NULL AND valor IS NOT NULL
    $q$;
  END IF;
END $$;

