-- Permitir editar y eliminar movimientos de caja de ahorros para usuarios autenticados.
-- Sin estas políticas, UPDATE/DELETE falla por RLS aunque SELECT/INSERT funcione.

ALTER TABLE IF EXISTS public.caja_ahorros_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar movimientos" ON public.caja_ahorros_movimientos;
CREATE POLICY "Usuarios autenticados pueden actualizar movimientos"
  ON public.caja_ahorros_movimientos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar movimientos" ON public.caja_ahorros_movimientos;
CREATE POLICY "Usuarios autenticados pueden eliminar movimientos"
  ON public.caja_ahorros_movimientos FOR DELETE
  TO authenticated
  USING (true);
