-- ============================================
-- Migración: Agregar campo empresa a cotizaciones y clientes
-- ============================================

-- Agregar campo empresa a la tabla cotizaciones
ALTER TABLE cotizaciones
ADD COLUMN IF NOT EXISTS empresa TEXT CHECK (empresa IN ('casablanca', 'kubica'));

-- Crear índice para búsquedas por empresa
CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa ON cotizaciones(empresa);

-- Agregar campo empresa a la tabla clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS empresa TEXT CHECK (empresa IN ('casablanca', 'kubica'));

-- Crear índice para búsquedas por empresa
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa);

-- Comentarios para documentación
COMMENT ON COLUMN cotizaciones.empresa IS 'Empresa que generó la cotización: casablanca o kubica';
COMMENT ON COLUMN clientes.empresa IS 'Empresa a la que pertenece el cliente: casablanca o kubica';

