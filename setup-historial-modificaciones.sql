-- ============================================
-- Tabla de Historial de Modificaciones de Cotizaciones
-- ============================================

-- Tabla para guardar el historial de cambios en cotizaciones
CREATE TABLE IF NOT EXISTS historial_modificaciones_cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  descripcion TEXT NOT NULL, -- Descripción de por qué se hizo la modificación
  cambios JSONB NOT NULL DEFAULT '{}'::jsonb, -- JSON con los cambios realizados (antes/después)
  total_anterior DECIMAL(10, 2),
  total_nuevo DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE historial_modificaciones_cotizaciones ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver el historial de modificaciones
CREATE POLICY "Users can view modification history" ON historial_modificaciones_cotizaciones
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear registros de modificación
CREATE POLICY "Admins can create modification history" ON historial_modificaciones_cotizaciones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_historial_cotizacion_id ON historial_modificaciones_cotizaciones(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario_id ON historial_modificaciones_cotizaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_created_at ON historial_modificaciones_cotizaciones(created_at DESC);

