-- ============================================
-- Script SQL: Sistema de Gastos Fijos
-- ============================================
-- Este script crea las tablas necesarias para gestionar
-- gastos fijos de la empresa (alquiler, servicios, etc.)
-- ============================================

-- ============================================
-- 1. CATEGORÍAS DE GASTOS FIJOS
-- ============================================
CREATE TABLE IF NOT EXISTS fixed_expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para categorías
CREATE INDEX IF NOT EXISTS idx_fixed_expense_categories_name ON fixed_expense_categories(name);

-- Habilitar RLS
ALTER TABLE fixed_expense_categories ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver categorías
CREATE POLICY "Users can view fixed_expense_categories" ON fixed_expense_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar categorías
CREATE POLICY "Admins can modify fixed_expense_categories" ON fixed_expense_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Comentarios
COMMENT ON TABLE fixed_expense_categories IS 'Categorías de gastos fijos (ej: Alquiler, Servicios, Internet, etc.)';
COMMENT ON COLUMN fixed_expense_categories.name IS 'Nombre de la categoría (único)';
COMMENT ON COLUMN fixed_expense_categories.description IS 'Descripción opcional de la categoría';

-- ============================================
-- 2. GASTOS FIJOS
-- ============================================
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES fixed_expense_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  provider TEXT,
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'cheque', 'otro')),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gastos fijos
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category_id ON fixed_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_date ON fixed_expenses(date);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_provider ON fixed_expenses(provider);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_amount ON fixed_expenses(amount);

-- Índice compuesto para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_date_category ON fixed_expenses(date, category_id);

-- Habilitar RLS
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver gastos fijos
CREATE POLICY "Users can view fixed_expenses" ON fixed_expenses
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden crear/modificar gastos fijos
CREATE POLICY "Admins can modify fixed_expenses" ON fixed_expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_fixed_expenses_updated_at ON fixed_expenses;
CREATE TRIGGER update_fixed_expenses_updated_at BEFORE UPDATE ON fixed_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE fixed_expenses IS 'Registro de gastos fijos de la empresa';
COMMENT ON COLUMN fixed_expenses.category_id IS 'ID de la categoría del gasto';
COMMENT ON COLUMN fixed_expenses.description IS 'Descripción del gasto';
COMMENT ON COLUMN fixed_expenses.amount IS 'Monto del gasto';
COMMENT ON COLUMN fixed_expenses.provider IS 'Proveedor o empresa que emite el gasto';
COMMENT ON COLUMN fixed_expenses.payment_method IS 'Método de pago: efectivo, transferencia, tarjeta, cheque, otro';
COMMENT ON COLUMN fixed_expenses.date IS 'Fecha del gasto';

-- ============================================
-- 3. INSERTAR CATEGORÍAS INICIALES
-- ============================================
INSERT INTO fixed_expense_categories (name, description) VALUES
  ('Alquiler', 'Alquiler de local o espacio de trabajo'),
  ('Servicios Básicos', 'Luz, agua, gas'),
  ('Internet y Telecomunicaciones', 'Internet, telefonía, servicios de comunicación'),
  ('Seguros', 'Seguros de local, vehículos, etc.'),
  ('Mantenimiento', 'Mantenimiento de equipos, instalaciones'),
  ('Contabilidad y Legal', 'Servicios contables, legales'),
  ('Marketing y Publicidad', 'Publicidad, marketing, redes sociales'),
  ('Software y Licencias', 'Software, licencias, suscripciones'),
  ('Otros', 'Otros gastos fijos no categorizados')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================


