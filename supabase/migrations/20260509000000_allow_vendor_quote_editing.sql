-- Permite que los vendedores autenticados vean/editen cotizaciones asignadas a ellos
-- y que cualquier usuario autenticado registre historial al modificar una cotización
-- que puede actualizar por RLS.

DROP POLICY IF EXISTS "Users can view own cotizaciones" ON public.cotizaciones;
CREATE POLICY "Users can view own cotizaciones" ON public.cotizaciones
  FOR SELECT
  USING (auth.uid() = usuario_id OR auth.uid() = vendedor_id);

DROP POLICY IF EXISTS "Users can update own cotizaciones" ON public.cotizaciones;
CREATE POLICY "Users can update own cotizaciones" ON public.cotizaciones
  FOR UPDATE
  USING (auth.uid() = usuario_id OR auth.uid() = vendedor_id)
  WITH CHECK (auth.uid() = usuario_id OR auth.uid() = vendedor_id);

DROP POLICY IF EXISTS "Users can create modification history" ON public.historial_modificaciones_cotizaciones;
CREATE POLICY "Users can create modification history"
  ON public.historial_modificaciones_cotizaciones
  FOR INSERT
  WITH CHECK (
    auth.uid() = usuario_id
    AND EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND (
          public.cotizaciones.usuario_id = auth.uid()
          OR public.cotizaciones.vendedor_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.perfiles
            WHERE public.perfiles.id = auth.uid()
              AND public.perfiles.role = 'admin'
          )
        )
    )
  );
