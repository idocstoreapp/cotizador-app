-- ============================================
-- Migración: Agregar campo items a cotizaciones
-- ============================================
-- Este campo guardará los items completos de la cotización
-- con toda su información: nombre, descripción, medidas, materiales, servicios, costos, utilidades, etc.

-- Agregar columna items si no existe
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Comentario para documentar el campo
COMMENT ON COLUMN cotizaciones.items IS 'Items completos de la cotización con toda su información detallada (nombre, descripción, medidas, materiales, servicios, costos, utilidades, etc.)';

