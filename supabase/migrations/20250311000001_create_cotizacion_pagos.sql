-- Historial de pagos por cotización (parciales y total) con fecha
CREATE TABLE IF NOT EXISTS public.cotizacion_pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  monto numeric(14, 2) NOT NULL CHECK (monto > 0),
  fecha_pago date NOT NULL DEFAULT CURRENT_DATE,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_pagos_cotizacion_id ON public.cotizacion_pagos(cotizacion_id);

COMMENT ON TABLE public.cotizacion_pagos IS 'Historial de pagos (parciales o total) por cotización. cotizaciones.monto_pagado = suma de montos aquí.';

ALTER TABLE public.cotizacion_pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver pagos"
  ON public.cotizacion_pagos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar pagos"
  ON public.cotizacion_pagos FOR INSERT TO authenticated WITH CHECK (true);
