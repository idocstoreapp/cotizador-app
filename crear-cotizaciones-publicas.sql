-- ============================================
-- Tabla de Cotizaciones Públicas
-- Para el catálogo público de cocinas
-- ============================================

CREATE TABLE IF NOT EXISTS cotizaciones_publicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Datos de contacto del cliente
  nombre_cliente TEXT NOT NULL,
  email_cliente TEXT,
  telefono_cliente TEXT,
  mensaje_cliente TEXT,
  
  -- Datos de la cotización
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de items cotizados
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  descuento DECIMAL(5, 2) DEFAULT 0,
  iva DECIMAL(5, 2) DEFAULT 19,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Método de contacto preferido
  metodo_contacto TEXT CHECK (metodo_contacto IN ('whatsapp', 'email', 'formulario')),
  
  -- Estado
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'cerrado')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- IP y User Agent para tracking (opcional)
  ip_address TEXT,
  user_agent TEXT
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_cotizaciones_publicas_estado ON cotizaciones_publicas(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_publicas_created_at ON cotizaciones_publicas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_publicas_email ON cotizaciones_publicas(email_cliente);

-- Comentarios
COMMENT ON TABLE cotizaciones_publicas IS 'Cotizaciones realizadas desde el catálogo público de cocinas';
COMMENT ON COLUMN cotizaciones_publicas.items IS 'Array JSON con los items de la cotización (muebles, opciones, cantidades, precios)';
COMMENT ON COLUMN cotizaciones_publicas.metodo_contacto IS 'Método preferido por el cliente: whatsapp, email o formulario';
COMMENT ON COLUMN cotizaciones_publicas.estado IS 'Estado de la cotización: pendiente, contactado, cerrado';

-- Política RLS (Row Level Security)
ALTER TABLE cotizaciones_publicas ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública (solo para admins en el futuro)
CREATE POLICY "Solo admins pueden ver cotizaciones públicas"
  ON cotizaciones_publicas
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

-- Permitir inserción pública (cualquiera puede crear cotizaciones)
CREATE POLICY "Cualquiera puede crear cotizaciones públicas"
  ON cotizaciones_publicas
  FOR INSERT
  WITH CHECK (true);

-- Solo admins pueden actualizar
CREATE POLICY "Solo admins pueden actualizar cotizaciones públicas"
  ON cotizaciones_publicas
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_cotizaciones_publicas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cotizaciones_publicas_updated_at
  BEFORE UPDATE ON cotizaciones_publicas
  FOR EACH ROW
  EXECUTE FUNCTION update_cotizaciones_publicas_updated_at();

