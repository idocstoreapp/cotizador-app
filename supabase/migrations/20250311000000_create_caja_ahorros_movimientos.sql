-- Caja de ahorros: movimientos de depósito (el dinero ahorrado no se usa para pagos).
-- Ejecutar en el SQL Editor de Supabase si no usas migraciones.

CREATE TABLE IF NOT EXISTS public.caja_ahorros_movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monto numeric(14, 2) NOT NULL CHECK (monto > 0),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

COMMENT ON TABLE public.caja_ahorros_movimientos IS 'Depósitos a caja de ahorros. El total ahorrado no se descuenta al pagar gastos fijos ni liquidaciones.';
COMMENT ON COLUMN public.caja_ahorros_movimientos.monto IS 'Monto depositado (siempre positivo).';

-- RLS: solo usuarios autenticados (ajustar política si quieres solo admin)
ALTER TABLE public.caja_ahorros_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver movimientos"
  ON public.caja_ahorros_movimientos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar movimientos"
  ON public.caja_ahorros_movimientos FOR INSERT
  TO authenticated WITH CHECK (true);
