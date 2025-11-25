-- ============================================
-- Script Completo de Setup: Tabla Muebles
-- ============================================
-- 
-- Este script crea la tabla muebles con todos los campos necesarios,
-- incluyendo el nuevo campo imagenes_por_variante.
-- 
-- Ejecuta este script en el SQL Editor de Supabase.
--
-- ============================================

-- Función para actualizar updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear tabla muebles si no existe
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

-- Agregar columna imagenes_por_variante si la tabla ya existía pero no tenía esta columna
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'muebles' 
    AND column_name = 'imagenes_por_variante'
  ) THEN
    ALTER TABLE muebles 
    ADD COLUMN imagenes_por_variante JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Columna imagenes_por_variante agregada exitosamente';
  ELSE
    RAISE NOTICE 'La columna imagenes_por_variante ya existe';
  END IF;
END $$;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_muebles_categoria ON muebles(categoria);
CREATE INDEX IF NOT EXISTS idx_muebles_nombre ON muebles(nombre);
CREATE INDEX IF NOT EXISTS idx_muebles_created_at ON muebles(created_at DESC);

-- Habilitar RLS
ALTER TABLE muebles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para evitar conflictos)
DROP POLICY IF EXISTS "Authenticated users can view muebles" ON muebles;
DROP POLICY IF EXISTS "Admins can create muebles" ON muebles;
DROP POLICY IF EXISTS "Admins can update muebles" ON muebles;
DROP POLICY IF EXISTS "Admins can delete muebles" ON muebles;

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
DROP TRIGGER IF EXISTS update_muebles_updated_at ON muebles;
CREATE TRIGGER update_muebles_updated_at BEFORE UPDATE ON muebles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificación final
SELECT 
  'Tabla muebles creada/actualizada exitosamente' as mensaje,
  COUNT(*) as total_muebles
FROM muebles;

-- Mostrar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'muebles'
ORDER BY ordinal_position;

