-- Permite que el vendedor relacionado con una cotización aprobada registre costos reales.
-- Mantiene el acceso existente para administradores y agrega permisos acotados por cotización.

DROP POLICY IF EXISTS "Related vendors can modify real material costs" ON public.gastos_reales_materiales;
CREATE POLICY "Related vendors can modify real material costs"
  ON public.gastos_reales_materiales
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Related vendors can modify real labor costs" ON public.mano_obra_real;
CREATE POLICY "Related vendors can modify real labor costs"
  ON public.mano_obra_real
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Related vendors can modify small real costs" ON public.gastos_hormiga;
CREATE POLICY "Related vendors can modify small real costs"
  ON public.gastos_hormiga
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Related vendors can modify transport real costs" ON public.transporte_real;
CREATE POLICY "Related vendors can modify transport real costs"
  ON public.transporte_real
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Related vendors can modify invoices" ON public.facturas;
CREATE POLICY "Related vendors can modify invoices"
  ON public.facturas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cotizaciones
      WHERE public.cotizaciones.id = cotizacion_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Related vendors can modify invoice items" ON public.factura_items;
CREATE POLICY "Related vendors can modify invoice items"
  ON public.factura_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.facturas
      JOIN public.cotizaciones ON public.cotizaciones.id = public.facturas.cotizacion_id
      WHERE public.facturas.id = factura_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.facturas
      JOIN public.cotizaciones ON public.cotizaciones.id = public.facturas.cotizacion_id
      WHERE public.facturas.id = factura_id
        AND public.cotizaciones.estado = 'aceptada'
        AND (public.cotizaciones.usuario_id = auth.uid() OR public.cotizaciones.vendedor_id = auth.uid())
    )
  );
