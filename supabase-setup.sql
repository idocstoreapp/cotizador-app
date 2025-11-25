-- ============================================
-- Script de Configuración de Supabase
-- Mueblería Cotizador
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase: https://tnlkdtslqgoezfecvcbj.supabase.co
-- 2. Ve a "SQL Editor" en el menú lateral
-- 3. Haz clic en "New Query"
-- 4. Copia y pega TODO este script
-- 5. Haz clic en "Run" o presiona Ctrl+Enter
-- 6. Espera a que se ejecuten todos los comandos
-- ============================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  nombre TEXT,
  role TEXT NOT NULL DEFAULT 'tecnico' CHECK (role IN ('admin', 'tecnico')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON perfiles;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON perfiles
  FOR SELECT USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tabla de materiales
CREATE TABLE IF NOT EXISTS materiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  unidad TEXT NOT NULL,
  costo_unitario DECIMAL(10, 2) NOT NULL,
  proveedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE materiales ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view materials" ON materiales;
DROP POLICY IF EXISTS "Admins can modify materials" ON materiales;

-- Política: Todos los usuarios autenticados pueden ver materiales
CREATE POLICY "Authenticated users can view materials" ON materiales
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden modificar materiales
CREATE POLICY "Admins can modify materials" ON materiales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_por_hora DECIMAL(10, 2) NOT NULL,
  horas_estimadas DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view services" ON servicios;
DROP POLICY IF EXISTS "Admins can modify services" ON servicios;

-- Política: Todos los usuarios autenticados pueden ver servicios
CREATE POLICY "Authenticated users can view services" ON servicios
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden modificar servicios
CREATE POLICY "Admins can modify services" ON servicios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Tabla de cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefono TEXT,
  cliente_direccion TEXT,
  materiales JSONB NOT NULL DEFAULT '[]'::jsonb,
  servicios JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_materiales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal_servicios DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  iva DECIMAL(10, 2) NOT NULL DEFAULT 0,
  margen_ganancia DECIMAL(5, 2) NOT NULL DEFAULT 30,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada')),
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Admins can view all cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Users can create cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Users can update own cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Admins can update all cotizaciones" ON cotizaciones;

-- Política: Los usuarios pueden ver sus propias cotizaciones
CREATE POLICY "Users can view own cotizaciones" ON cotizaciones
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política: Los admins pueden ver todas las cotizaciones
CREATE POLICY "Admins can view all cotizaciones" ON cotizaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Política: Los usuarios pueden crear cotizaciones
CREATE POLICY "Users can create cotizaciones" ON cotizaciones
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios pueden actualizar sus propias cotizaciones
CREATE POLICY "Users can update own cotizaciones" ON cotizaciones
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política: Los admins pueden actualizar todas las cotizaciones
CREATE POLICY "Admins can update all cotizaciones" ON cotizaciones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar triggers existentes si los hay
DROP TRIGGER IF EXISTS update_materiales_updated_at ON materiales;
DROP TRIGGER IF EXISTS update_servicios_updated_at ON servicios;
DROP TRIGGER IF EXISTS update_cotizaciones_updated_at ON cotizaciones;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_materiales_updated_at BEFORE UPDATE ON materiales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at BEFORE UPDATE ON servicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cotizaciones_updated_at BEFORE UPDATE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verificación
-- ============================================
-- Después de ejecutar este script, verifica que las tablas se crearon:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('perfiles', 'materiales', 'servicios', 'cotizaciones');
-- ============================================


