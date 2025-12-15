-- ============================================
-- Integración con Bsale
-- Agregar campo para almacenar el ID del documento en Bsale
-- ============================================

-- Agregar columna bsale_document_id a la tabla facturas
ALTER TABLE facturas 
ADD COLUMN IF NOT EXISTS bsale_document_id INTEGER;

-- Agregar índice para búsquedas rápidas por ID de Bsale
CREATE INDEX IF NOT EXISTS idx_facturas_bsale_document_id ON facturas(bsale_document_id);

-- Agregar índice para búsquedas por número de factura (para sincronización)
CREATE INDEX IF NOT EXISTS idx_facturas_numero_factura_lower ON facturas(LOWER(numero_factura));

-- Comentarios
COMMENT ON COLUMN facturas.bsale_document_id IS 'ID del documento en Bsale (para enlaces directos)';








