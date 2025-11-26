-- ============================================
-- Corregir políticas RLS de cotizaciones
-- ============================================

-- 1. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view own cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Admins can view all cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Users can create cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Users can update own cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Admins can update all cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Admins can delete all cotizaciones" ON cotizaciones;

-- 2. Crear políticas correctas

-- Política: Los usuarios pueden ver sus propias cotizaciones
CREATE POLICY "Users can view own cotizaciones" ON cotizaciones
  FOR SELECT 
  USING (auth.uid() = usuario_id);

-- Política: Los admins pueden ver TODAS las cotizaciones
CREATE POLICY "Admins can view all cotizaciones" ON cotizaciones
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() 
      AND perfiles.role = 'admin'
    )
  );

-- Política: Los usuarios pueden crear cotizaciones
CREATE POLICY "Users can create cotizaciones" ON cotizaciones
  FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios pueden actualizar sus propias cotizaciones
CREATE POLICY "Users can update own cotizaciones" ON cotizaciones
  FOR UPDATE 
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Política: Los admins pueden actualizar todas las cotizaciones
CREATE POLICY "Admins can update all cotizaciones" ON cotizaciones
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() 
      AND perfiles.role = 'admin'
    )
  );

-- Política: Los admins pueden eliminar todas las cotizaciones
CREATE POLICY "Admins can delete all cotizaciones" ON cotizaciones
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() 
      AND perfiles.role = 'admin'
    )
  );

-- 3. Verificar que las políticas estén creadas
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'cotizaciones'
ORDER BY policyname;

