-- ============================================
-- Script SQL: Sistema de Vendedores y Trabajadores de Taller
-- ============================================
-- Este script agrega:
-- 1. Roles de vendedor y trabajador_taller a la tabla perfiles
-- 2. Campo especialidad para trabajadores de taller
-- 3. Campos vendedor_id y pago_vendedor a cotizaciones
-- 4. Tabla cotizacion_trabajadores para asignar trabajadores con pagos
-- ============================================

-- ============================================
-- 1. MODIFICAR TABLA PERFILES
-- ============================================

-- Agregar campo especialidad (solo para trabajadores de taller)
ALTER TABLE perfiles
ADD COLUMN IF NOT EXISTS especialidad TEXT;

-- Actualizar el CHECK constraint de role para incluir vendedor y trabajador_taller
-- Primero eliminar el constraint existente
ALTER TABLE perfiles
DROP CONSTRAINT IF EXISTS perfiles_role_check;

-- Agregar nuevo constraint con todos los roles
ALTER TABLE perfiles
ADD CONSTRAINT perfiles_role_check 
CHECK (role IN ('admin', 'tecnico', 'vendedor', 'trabajador_taller'));

-- Comentario para documentación
COMMENT ON COLUMN perfiles.especialidad IS 'Especialidad del trabajador de taller (ej: carpintero, pintor, etc.). Solo aplica para role = trabajador_taller';

-- ============================================
-- 2. MODIFICAR TABLA COTIZACIONES
-- ============================================

-- Agregar campo vendedor_id (FK a perfiles)
ALTER TABLE cotizaciones
ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES perfiles(id) ON DELETE SET NULL;

-- Agregar campo pago_vendedor (monto del pago al vendedor)
ALTER TABLE cotizaciones
ADD COLUMN IF NOT EXISTS pago_vendedor DECIMAL(10, 2) DEFAULT 0;

-- Crear índice para búsquedas por vendedor
CREATE INDEX IF NOT EXISTS idx_cotizaciones_vendedor_id ON cotizaciones(vendedor_id);

-- Comentarios para documentación
COMMENT ON COLUMN cotizaciones.vendedor_id IS 'ID del vendedor que generó la cotización';
COMMENT ON COLUMN cotizaciones.pago_vendedor IS 'Monto del pago asignado al vendedor (solo para cotizaciones aceptadas)';

-- ============================================
-- 3. CREAR TABLA COTIZACION_TRABAJADORES
-- ============================================

CREATE TABLE IF NOT EXISTS cotizacion_trabajadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  trabajador_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
  pago_trabajador DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Evitar duplicados: un trabajador solo puede estar asignado una vez por cotización
  UNIQUE(cotizacion_id, trabajador_id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_cotizacion_trabajadores_cotizacion_id ON cotizacion_trabajadores(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_trabajadores_trabajador_id ON cotizacion_trabajadores(trabajador_id);

-- Habilitar RLS
ALTER TABLE cotizacion_trabajadores ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver trabajadores asignados
CREATE POLICY "Users can view cotizacion_trabajadores" ON cotizacion_trabajadores
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar trabajadores asignados
CREATE POLICY "Admins can modify cotizacion_trabajadores" ON cotizacion_trabajadores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Política: Los técnicos pueden ver trabajadores de sus propias cotizaciones
CREATE POLICY "Technicians can view own cotizacion_trabajadores" ON cotizacion_trabajadores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cotizaciones
      WHERE cotizaciones.id = cotizacion_trabajadores.cotizacion_id 
      AND cotizaciones.usuario_id = auth.uid()
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE cotizacion_trabajadores IS 'Trabajadores de taller asignados a cotizaciones aceptadas con sus respectivos pagos';
COMMENT ON COLUMN cotizacion_trabajadores.pago_trabajador IS 'Monto del pago asignado al trabajador';

-- ============================================
-- 4. ACTUALIZAR COTIZACIONES EXISTENTES (OPCIONAL)
-- ============================================

-- Si hay cotizaciones existentes, podemos dejar vendedor_id como NULL
-- y pago_vendedor como 0 por defecto (ya está configurado)

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

