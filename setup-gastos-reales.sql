-- ============================================
-- Tabla para registrar gastos reales de materiales
-- Permite comparar presupuesto vs gasto real
-- ============================================

-- Tabla de gastos reales de materiales
CREATE TABLE IF NOT EXISTS gastos_reales_materiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL, -- ID del item dentro de la cotización
  material_id UUID REFERENCES materiales(id) ON DELETE SET NULL,
  material_nombre TEXT NOT NULL, -- Nombre del material al momento de la compra
  cantidad_presupuestada DECIMAL(10, 2) NOT NULL, -- Cantidad que se presupuestó
  cantidad_real DECIMAL(10, 2) NOT NULL, -- Cantidad realmente comprada/usada
  precio_unitario_presupuestado DECIMAL(10, 2) NOT NULL, -- Precio que se presupuestó
  precio_unitario_real DECIMAL(10, 2) NOT NULL, -- Precio realmente pagado
  unidad TEXT NOT NULL, -- Unidad de medida (m², m, unidad, etc.)
  fecha_compra DATE NOT NULL, -- Fecha en que se realizó la compra
  proveedor TEXT, -- Nombre del proveedor
  numero_factura TEXT, -- Número de factura o comprobante
  notas TEXT, -- Notas adicionales sobre la compra
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_gastos_reales_cotizacion_id ON gastos_reales_materiales(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_gastos_reales_item_id ON gastos_reales_materiales(item_id);
CREATE INDEX IF NOT EXISTS idx_gastos_reales_material_id ON gastos_reales_materiales(material_id);
CREATE INDEX IF NOT EXISTS idx_gastos_reales_fecha_compra ON gastos_reales_materiales(fecha_compra);

-- Habilitar RLS
ALTER TABLE gastos_reales_materiales ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver gastos reales
CREATE POLICY "Users can view gastos reales" ON gastos_reales_materiales
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar gastos reales
CREATE POLICY "Admins can modify gastos reales" ON gastos_reales_materiales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE gastos_reales_materiales IS 'Registro de gastos reales de materiales para comparar con presupuesto';
COMMENT ON COLUMN gastos_reales_materiales.cantidad_presupuestada IS 'Cantidad que se presupuestó en la cotización';
COMMENT ON COLUMN gastos_reales_materiales.cantidad_real IS 'Cantidad realmente comprada/usada';
COMMENT ON COLUMN gastos_reales_materiales.precio_unitario_presupuestado IS 'Precio unitario presupuestado';
COMMENT ON COLUMN gastos_reales_materiales.precio_unitario_real IS 'Precio unitario realmente pagado';


