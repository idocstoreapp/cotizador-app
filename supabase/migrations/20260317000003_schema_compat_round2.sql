-- Segunda ronda de compatibilidad: errores vistos en logs de migración
-- (muebles.imagen, cotizaciones_publicas.estado, gastos_reales_materiales.material_nombre, etc.)
-- Idempotente.

-- =========
-- muebles: faltan campos del catálogo
-- =========
ALTER TABLE public.muebles
  ADD COLUMN IF NOT EXISTS imagen text;

ALTER TABLE public.muebles
  ADD COLUMN IF NOT EXISTS imagenes_adicionales jsonb;

ALTER TABLE public.muebles
  ADD COLUMN IF NOT EXISTS imagenes_por_variante jsonb;

ALTER TABLE public.muebles
  ADD COLUMN IF NOT EXISTS categoria text;

ALTER TABLE public.muebles
  ADD COLUMN IF NOT EXISTS opciones_disponibles jsonb;

-- Backfill mínimo: si existe columna antigua "image" copiarla a "imagen"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='muebles' AND column_name='image'
  ) THEN
    EXECUTE $q$
      UPDATE public.muebles
      SET imagen = image
      WHERE (imagen IS NULL OR imagen = '') AND image IS NOT NULL
    $q$;
  END IF;
END $$;

-- =========
-- cotizaciones_publicas: faltan columnas
-- =========
ALTER TABLE public.cotizaciones_publicas
  ADD COLUMN IF NOT EXISTS estado text;

-- =========
-- gastos_reales_materiales: faltan columnas
-- =========
ALTER TABLE public.gastos_reales_materiales
  ADD COLUMN IF NOT EXISTS material_nombre text;

-- =========
-- fixed_expenses: en tu BD nueva exige "nombre" NOT NULL
-- =========
ALTER TABLE public.fixed_expenses
  ADD COLUMN IF NOT EXISTS nombre text;

-- Asegurar que no haya nulls en "nombre" sin referenciar columnas inexistentes
DO $$
DECLARE
  has_description boolean;
  has_descripcion boolean;
  has_detalle boolean;
  expr text := 'nombre';
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fixed_expenses' AND column_name='description'
  ) INTO has_description;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fixed_expenses' AND column_name='descripcion'
  ) INTO has_descripcion;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fixed_expenses' AND column_name='detalle'
  ) INTO has_detalle;

  IF has_description THEN
    expr := expr || ', description';
  END IF;
  IF has_descripcion THEN
    expr := expr || ', descripcion';
  END IF;
  IF has_detalle THEN
    expr := expr || ', detalle';
  END IF;

  EXECUTE format(
    'UPDATE public.fixed_expenses SET nombre = COALESCE(%s, %L) WHERE nombre IS NULL',
    expr,
    'Gasto fijo'
  );
END $$;

-- =========
-- balance_personal: faltan métricas
-- =========
ALTER TABLE public.balance_personal
  ADD COLUMN IF NOT EXISTS cotizaciones_vendedor integer;

ALTER TABLE public.balance_personal
  ADD COLUMN IF NOT EXISTS trabajos_realizados integer;

ALTER TABLE public.balance_personal
  ADD COLUMN IF NOT EXISTS total_liquidado numeric(14,2);

ALTER TABLE public.balance_personal
  ADD COLUMN IF NOT EXISTS total_ganado_vendedor numeric(14,2);

ALTER TABLE public.balance_personal
  ADD COLUMN IF NOT EXISTS total_ganado_trabajador numeric(14,2);

ALTER TABLE public.balance_personal
  ADD COLUMN IF NOT EXISTS ultima_liquidacion timestamptz;

-- =========
-- liquidaciones: faltan columnas
-- =========
ALTER TABLE public.liquidaciones
  ADD COLUMN IF NOT EXISTS tipo_persona text;

-- =========
-- facturas: faltan columnas
-- =========
ALTER TABLE public.facturas
  ADD COLUMN IF NOT EXISTS numero_factura text;

-- =========
-- asegurar tablas auxiliares (por si schema cache no las ve)
-- =========
CREATE TABLE IF NOT EXISTS public.caja_ahorros_movimientos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  monto numeric(14,2) NOT NULL CHECK (monto > 0),
  fecha date NOT NULL,
  nota text,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.cotizacion_pagos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  monto numeric(14,2) NOT NULL CHECK (monto > 0),
  fecha_pago date NOT NULL,
  nota text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.historial_modificaciones_cotizaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id uuid REFERENCES public.cotizaciones(id) ON DELETE CASCADE NOT NULL,
  usuario_id uuid REFERENCES auth.users(id) NOT NULL,
  descripcion text NOT NULL,
  cambios jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_anterior numeric(10,2),
  total_nuevo numeric(10,2),
  created_at timestamptz DEFAULT now()
);

