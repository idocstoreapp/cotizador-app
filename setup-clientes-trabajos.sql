-- Script SQL para crear tablas de clientes y trabajos
-- Ejecutar en Supabase SQL Editor

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver clientes
CREATE POLICY "Users can view clientes" ON clientes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar clientes
CREATE POLICY "Admins can modify clientes" ON clientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Tabla de trabajos
CREATE TABLE IF NOT EXISTS trabajos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
  empleados_asignados TEXT[] DEFAULT '{}'::text[],
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_fin_estimada TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE trabajos ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver trabajos
CREATE POLICY "Users can view trabajos" ON trabajos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar trabajos
CREATE POLICY "Admins can modify trabajos" ON trabajos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Actualizar tabla cotizaciones para cambiar estados
ALTER TABLE cotizaciones 
  DROP CONSTRAINT IF EXISTS cotizaciones_estado_check;

ALTER TABLE cotizaciones
  ADD CONSTRAINT cotizaciones_estado_check 
  CHECK (estado IN ('pendiente', 'aceptada', 'rechazada'));

-- Actualizar estado por defecto
ALTER TABLE cotizaciones
  ALTER COLUMN estado SET DEFAULT 'pendiente';

-- Actualizar cotizaciones existentes con estado 'borrador' o 'enviada' a 'pendiente'
UPDATE cotizaciones 
SET estado = 'pendiente' 
WHERE estado IN ('borrador', 'enviada', 'aprobada');

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_trabajos_cliente_id ON trabajos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_cotizacion_id ON trabajos(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_estado ON trabajos(estado);











