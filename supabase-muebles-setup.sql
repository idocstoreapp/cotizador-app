-- ============================================
-- Tabla de Muebles del Catálogo
-- ============================================

-- Tabla principal de muebles
CREATE TABLE IF NOT EXISTS muebles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  imagen TEXT, -- URL de la imagen principal
  precio_base DECIMAL(10, 2) NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL CHECK (categoria IN ('closet', 'cocina', 'bano', 'sensorial', 'otros')),
  
  -- Medidas predeterminadas (JSONB para flexibilidad)
  medidas JSONB, -- {ancho: number, alto: number, profundidad: number, unidad: string}
  
  -- Materiales predeterminados (JSONB array)
  materiales_predeterminados JSONB DEFAULT '[]'::jsonb, -- Array de {material_id, material_nombre, cantidad, unidad, precio_unitario}
  
  -- Servicios predeterminados (JSONB array)
  servicios_predeterminados JSONB DEFAULT '[]'::jsonb, -- Array de {servicio_id, servicio_nombre, horas, precio_por_hora}
  
  -- Opciones disponibles (JSONB)
  opciones_disponibles JSONB DEFAULT '{}'::jsonb, -- {colores: [], materiales: [], encimeras: [], canteados: []}
  
  -- Imágenes adicionales con colores asociados (JSONB array)
  imagenes_adicionales JSONB DEFAULT '[]'::jsonb, -- Array de {url: string, color: string, descripcion?: string}
  
  -- Imágenes por variante (nuevo sistema - mapea opciones a imágenes)
  imagenes_por_variante JSONB DEFAULT '[]'::jsonb, -- Array de {color?: string, material?: string, encimera?: string, imagen_url: string}
  
  -- Configuración de fabricación
  dias_fabricacion INTEGER DEFAULT 0,
  horas_mano_obra DECIMAL(5, 2) DEFAULT 0,
  margen_ganancia DECIMAL(5, 2) DEFAULT 30, -- Porcentaje
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_muebles_categoria ON muebles(categoria);
CREATE INDEX IF NOT EXISTS idx_muebles_nombre ON muebles(nombre);
CREATE INDEX IF NOT EXISTS idx_muebles_created_at ON muebles(created_at DESC);

-- Habilitar RLS
ALTER TABLE muebles ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver muebles
CREATE POLICY "Authenticated users can view muebles" ON muebles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear muebles
CREATE POLICY "Admins can create muebles" ON muebles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar muebles
CREATE POLICY "Admins can update muebles" ON muebles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Política: Solo admins pueden eliminar muebles
CREATE POLICY "Admins can delete muebles" ON muebles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER update_muebles_updated_at BEFORE UPDATE ON muebles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Storage Bucket para Imágenes de Muebles
-- ============================================

-- Nota: El bucket debe crearse manualmente desde el dashboard de Supabase
-- Storage > Buckets > New Bucket
-- Nombre: "muebles-imagenes"
-- Public: true (para que las imágenes sean accesibles públicamente)

-- Política de Storage: Todos pueden leer imágenes
-- Esto se configura desde el dashboard de Supabase en Storage > Policies

-- ============================================
-- Verificación
-- ============================================
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name = 'muebles';


