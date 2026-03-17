-- Compatibilidad de esquema para migración OLD → NEW
-- Este archivo agrega columnas/tablas que el proyecto viejo tenía y que el script
-- `scripts/migrar-supabase.mjs` intenta insertar.
--
-- Es idempotente (IF NOT EXISTS / checks en information_schema).

-- =========
-- muebles
-- =========
ALTER TABLE public.muebles
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.muebles
  ADD COLUMN IF NOT EXISTS dias_fabricacion integer;

ALTER TABLE public.muebles
  ADD COLUMN IF NOT EXISTS horas_mano_obra numeric(14,2);

ALTER TABLE public.muebles
  ADD COLUMN IF NOT EXISTS margen_ganancia numeric(10,2);

-- =========
-- fixed_expense_categories
-- =========
ALTER TABLE public.fixed_expense_categories
  ADD COLUMN IF NOT EXISTS description text;

-- =========
-- cotizaciones_publicas
-- =========
ALTER TABLE public.cotizaciones_publicas
  ADD COLUMN IF NOT EXISTS descuento numeric(10,2);

ALTER TABLE public.cotizaciones_publicas
  ADD COLUMN IF NOT EXISTS email_cliente text;

ALTER TABLE public.cotizaciones_publicas
  ADD COLUMN IF NOT EXISTS telefono_cliente text;

ALTER TABLE public.cotizaciones_publicas
  ADD COLUMN IF NOT EXISTS direccion_cliente text;

-- =========
-- gastos_reales_materiales
-- =========
ALTER TABLE public.gastos_reales_materiales
  ADD COLUMN IF NOT EXISTS cantidad_presupuestada numeric(14,4);

ALTER TABLE public.gastos_reales_materiales
  ADD COLUMN IF NOT EXISTS item_id text;

-- Backfill desde "cantidad" si existe (algunos esquemas viejos usaban cantidad)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='gastos_reales_materiales' AND column_name='cantidad'
  ) THEN
    EXECUTE $q$
      UPDATE public.gastos_reales_materiales
      SET cantidad_presupuestada = cantidad
      WHERE cantidad_presupuestada IS NULL AND cantidad IS NOT NULL
    $q$;
  END IF;
END $$;

-- =========
-- mano_obra_real
-- =========
ALTER TABLE public.mano_obra_real
  ADD COLUMN IF NOT EXISTS comprobante_url text;

-- =========
-- gastos_hormiga
-- =========
ALTER TABLE public.gastos_hormiga
  ADD COLUMN IF NOT EXISTS evidencia_url text;

ALTER TABLE public.gastos_hormiga
  ADD COLUMN IF NOT EXISTS factura_url text;

-- =========
-- transporte_real
-- =========
ALTER TABLE public.transporte_real
  ADD COLUMN IF NOT EXISTS factura_url text;

-- En algunos esquemas, transporte_real usa "monto" como NOT NULL. Asegurar valor por defecto.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transporte_real' AND column_name='monto'
  ) THEN
    EXECUTE $q$
      ALTER TABLE public.transporte_real
      ALTER COLUMN monto SET DEFAULT 0
    $q$;
    EXECUTE $q$
      UPDATE public.transporte_real
      SET monto = 0
      WHERE monto IS NULL
    $q$;
  END IF;
END $$;

-- =========
-- balance_personal
-- =========
ALTER TABLE public.balance_personal
  ADD COLUMN IF NOT EXISTS apellido text;

ALTER TABLE public.balance_personal
  ADD COLUMN IF NOT EXISTS balance_pendiente numeric(14,2);

-- =========
-- liquidaciones
-- =========
ALTER TABLE public.liquidaciones
  ADD COLUMN IF NOT EXISTS metodo_pago text;

ALTER TABLE public.liquidaciones
  ADD COLUMN IF NOT EXISTS numero_referencia text;

-- =========
-- fixed_expenses
-- =========
ALTER TABLE public.fixed_expenses
  ADD COLUMN IF NOT EXISTS payment_method text;

-- =========
-- facturas
-- =========
ALTER TABLE public.facturas
  ADD COLUMN IF NOT EXISTS archivo_url text;

ALTER TABLE public.facturas
  ADD COLUMN IF NOT EXISTS fecha_factura date;

-- =========
-- historial_modificaciones_cotizaciones (faltaba en migraciones)
-- =========
CREATE TABLE IF NOT EXISTS public.historial_modificaciones_cotizaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id),
  descripcion text NOT NULL,
  cambios jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_anterior numeric(10,2),
  total_nuevo numeric(10,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.historial_modificaciones_cotizaciones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='historial_modificaciones_cotizaciones' AND policyname='Users can view modification history'
  ) THEN
    EXECUTE $q$
      CREATE POLICY "Users can view modification history"
      ON public.historial_modificaciones_cotizaciones
      FOR SELECT
      USING (auth.role() = 'authenticated')
    $q$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='historial_modificaciones_cotizaciones' AND policyname='Admins can create modification history'
  ) THEN
    EXECUTE $q$
      CREATE POLICY "Admins can create modification history"
      ON public.historial_modificaciones_cotizaciones
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.perfiles
          WHERE public.perfiles.id = auth.uid() AND public.perfiles.role = 'admin'
        )
      )
    $q$;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_historial_cotizacion_id ON public.historial_modificaciones_cotizaciones(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario_id ON public.historial_modificaciones_cotizaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_created_at ON public.historial_modificaciones_cotizaciones(created_at DESC);

-- =========
-- caja_ahorros_movimientos / cotizacion_pagos (por si no se corrieron migraciones previas)
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

