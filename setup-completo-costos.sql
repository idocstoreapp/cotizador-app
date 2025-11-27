-- ============================================
-- Script SQL Completo: Sistema de Control de Costos
-- Este script ejecuta todos los scripts necesarios en orden
-- ============================================

-- ============================================
-- 1. AGREGAR APELLIDO A PERFILES (si no existe)
-- ============================================
ALTER TABLE perfiles
ADD COLUMN IF NOT EXISTS apellido TEXT;

COMMENT ON COLUMN perfiles.apellido IS 'Apellido del vendedor o trabajador de taller';

-- ============================================
-- 2. CREAR TABLA GASTOS REALES MATERIALES (si no existe)
-- ============================================
CREATE TABLE IF NOT EXISTS gastos_reales_materiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  material_id UUID REFERENCES materiales(id) ON DELETE SET NULL,
  material_nombre TEXT NOT NULL,
  cantidad_presupuestada DECIMAL(10, 2) NOT NULL,
  cantidad_real DECIMAL(10, 2) NOT NULL,
  precio_unitario_presupuestado DECIMAL(10, 2) NOT NULL,
  precio_unitario_real DECIMAL(10, 2) NOT NULL,
  unidad TEXT NOT NULL,
  fecha_compra DATE NOT NULL,
  proveedor TEXT,
  numero_factura TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gastos_reales_materiales
CREATE INDEX IF NOT EXISTS idx_gastos_reales_cotizacion_id ON gastos_reales_materiales(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_gastos_reales_item_id ON gastos_reales_materiales(item_id);
CREATE INDEX IF NOT EXISTS idx_gastos_reales_material_id ON gastos_reales_materiales(material_id);
CREATE INDEX IF NOT EXISTS idx_gastos_reales_fecha_compra ON gastos_reales_materiales(fecha_compra);

-- Habilitar RLS
ALTER TABLE gastos_reales_materiales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view gastos reales" ON gastos_reales_materiales;
CREATE POLICY "Users can view gastos reales" ON gastos_reales_materiales
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can modify gastos reales" ON gastos_reales_materiales;
CREATE POLICY "Admins can modify gastos reales" ON gastos_reales_materiales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_gastos_reales_materiales_updated_at ON gastos_reales_materiales;
CREATE TRIGGER update_gastos_reales_materiales_updated_at BEFORE UPDATE ON gastos_reales_materiales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. CREAR TABLAS DE CONTROL DE COSTOS
-- ============================================

-- Mano de obra real
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

CREATE INDEX IF NOT EXISTS idx_mano_obra_real_cotizacion_id ON mano_obra_real(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_mano_obra_real_trabajador_id ON mano_obra_real(trabajador_id);
CREATE INDEX IF NOT EXISTS idx_mano_obra_real_fecha ON mano_obra_real(fecha);

ALTER TABLE mano_obra_real ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view mano_obra_real" ON mano_obra_real;
CREATE POLICY "Users can view mano_obra_real" ON mano_obra_real
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can modify mano_obra_real" ON mano_obra_real;
CREATE POLICY "Admins can modify mano_obra_real" ON mano_obra_real
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_mano_obra_real_updated_at ON mano_obra_real;
CREATE TRIGGER update_mano_obra_real_updated_at BEFORE UPDATE ON mano_obra_real
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Gastos hormiga
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

CREATE INDEX IF NOT EXISTS idx_gastos_hormiga_cotizacion_id ON gastos_hormiga(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_gastos_hormiga_fecha ON gastos_hormiga(fecha);

ALTER TABLE gastos_hormiga ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view gastos_hormiga" ON gastos_hormiga;
CREATE POLICY "Users can view gastos_hormiga" ON gastos_hormiga
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can modify gastos_hormiga" ON gastos_hormiga;
CREATE POLICY "Admins can modify gastos_hormiga" ON gastos_hormiga
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_gastos_hormiga_updated_at ON gastos_hormiga;
CREATE TRIGGER update_gastos_hormiga_updated_at BEFORE UPDATE ON gastos_hormiga
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Transporte real
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

CREATE INDEX IF NOT EXISTS idx_transporte_real_cotizacion_id ON transporte_real(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_transporte_real_fecha ON transporte_real(fecha);

ALTER TABLE transporte_real ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view transporte_real" ON transporte_real;
CREATE POLICY "Users can view transporte_real" ON transporte_real
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can modify transporte_real" ON transporte_real;
CREATE POLICY "Admins can modify transporte_real" ON transporte_real
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_transporte_real_updated_at ON transporte_real;
CREATE TRIGGER update_transporte_real_updated_at BEFORE UPDATE ON transporte_real
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Facturas
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

CREATE INDEX IF NOT EXISTS idx_facturas_cotizacion_id ON facturas(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha_factura);

ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view facturas" ON facturas;
CREATE POLICY "Users can view facturas" ON facturas
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can modify facturas" ON facturas;
CREATE POLICY "Admins can modify facturas" ON facturas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_facturas_updated_at ON facturas;
CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON facturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Factura items
CREATE TABLE IF NOT EXISTS factura_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factura_id UUID REFERENCES facturas(id) ON DELETE CASCADE NOT NULL,
  tipo_item TEXT NOT NULL CHECK (tipo_item IN ('material_real', 'mano_obra_real', 'transporte_real', 'gasto_hormiga')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factura_items_factura_id ON factura_items(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_items_item_id ON factura_items(item_id, tipo_item);

ALTER TABLE factura_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view factura_items" ON factura_items;
CREATE POLICY "Users can view factura_items" ON factura_items
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can modify factura_items" ON factura_items;
CREATE POLICY "Admins can modify factura_items" ON factura_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- ============================================
-- FIN DEL SCRIPT
-- ============================================


