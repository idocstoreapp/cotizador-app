-- ============================================
-- Script SQL: Sistema de Control de Costos Reales y Rentabilidad
-- ============================================
-- Este script crea todas las tablas necesarias para registrar
-- costos reales de proyectos y calcular rentabilidad
-- ============================================

-- ============================================
-- 1. MANO DE OBRA REAL
-- ============================================
CREATE TABLE IF NOT EXISTS mano_obra_real (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  trabajador_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  horas_trabajadas DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pago_por_hora DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_pagado DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL,
  comprobante_url TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mano de obra real
CREATE INDEX IF NOT EXISTS idx_mano_obra_real_cotizacion_id ON mano_obra_real(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_mano_obra_real_trabajador_id ON mano_obra_real(trabajador_id);
CREATE INDEX IF NOT EXISTS idx_mano_obra_real_fecha ON mano_obra_real(fecha);

-- Habilitar RLS
ALTER TABLE mano_obra_real ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver mano de obra real
CREATE POLICY "Users can view mano_obra_real" ON mano_obra_real
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar mano de obra real
CREATE POLICY "Admins can modify mano_obra_real" ON mano_obra_real
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Comentarios
COMMENT ON TABLE mano_obra_real IS 'Registro de mano de obra real pagada en proyectos';
COMMENT ON COLUMN mano_obra_real.total_pagado IS 'Total pagado = horas_trabajadas * pago_por_hora';

-- ============================================
-- 2. GASTOS HORMIGA
-- ============================================
CREATE TABLE IF NOT EXISTS gastos_hormiga (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  descripcion TEXT NOT NULL,
  monto DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL,
  factura_url TEXT,
  evidencia_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gastos hormiga
CREATE INDEX IF NOT EXISTS idx_gastos_hormiga_cotizacion_id ON gastos_hormiga(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_gastos_hormiga_fecha ON gastos_hormiga(fecha);

-- Habilitar RLS
ALTER TABLE gastos_hormiga ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver gastos hormiga
CREATE POLICY "Users can view gastos_hormiga" ON gastos_hormiga
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar gastos hormiga
CREATE POLICY "Admins can modify gastos_hormiga" ON gastos_hormiga
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Comentarios
COMMENT ON TABLE gastos_hormiga IS 'Gastos menores no presupuestados (gastos hormiga)';

-- ============================================
-- 3. TRANSPORTE REAL
-- ============================================
CREATE TABLE IF NOT EXISTS transporte_real (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  tipo_descripcion TEXT NOT NULL,
  costo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL,
  factura_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para transporte real
CREATE INDEX IF NOT EXISTS idx_transporte_real_cotizacion_id ON transporte_real(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_transporte_real_fecha ON transporte_real(fecha);

-- Habilitar RLS
ALTER TABLE transporte_real ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver transporte real
CREATE POLICY "Users can view transporte_real" ON transporte_real
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar transporte real
CREATE POLICY "Admins can modify transporte_real" ON transporte_real
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Comentarios
COMMENT ON TABLE transporte_real IS 'Costos reales de transporte en proyectos';

-- ============================================
-- 4. FACTURAS
-- ============================================
CREATE TABLE IF NOT EXISTS facturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  numero_factura TEXT NOT NULL,
  fecha_factura DATE NOT NULL,
  proveedor TEXT,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  archivo_url TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('material', 'mano_obra', 'transporte', 'gasto_hormiga', 'mixta')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para facturas
CREATE INDEX IF NOT EXISTS idx_facturas_cotizacion_id ON facturas(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha_factura);

-- Habilitar RLS
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver facturas
CREATE POLICY "Users can view facturas" ON facturas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar facturas
CREATE POLICY "Admins can modify facturas" ON facturas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Comentarios
COMMENT ON TABLE facturas IS 'Facturas y comprobantes de gastos reales';
COMMENT ON COLUMN facturas.tipo IS 'Tipo de factura: material, mano_obra, transporte, gasto_hormiga, mixta';

-- ============================================
-- 5. FACTURA ITEMS (Relación muchos a muchos)
-- ============================================
CREATE TABLE IF NOT EXISTS factura_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factura_id UUID REFERENCES facturas(id) ON DELETE CASCADE NOT NULL,
  tipo_item TEXT NOT NULL CHECK (tipo_item IN ('material_real', 'mano_obra_real', 'transporte_real', 'gasto_hormiga')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para factura_items
CREATE INDEX IF NOT EXISTS idx_factura_items_factura_id ON factura_items(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_items_item_id ON factura_items(item_id, tipo_item);

-- Habilitar RLS
ALTER TABLE factura_items ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver factura_items
CREATE POLICY "Users can view factura_items" ON factura_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar factura_items
CREATE POLICY "Admins can modify factura_items" ON factura_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Comentarios
COMMENT ON TABLE factura_items IS 'Relación entre facturas y sus items (materiales, mano de obra, etc.)';

-- ============================================
-- 6. TRIGGERS PARA ACTUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_mano_obra_real_updated_at BEFORE UPDATE ON mano_obra_real
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gastos_hormiga_updated_at BEFORE UPDATE ON gastos_hormiga
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transporte_real_updated_at BEFORE UPDATE ON transporte_real
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON facturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

