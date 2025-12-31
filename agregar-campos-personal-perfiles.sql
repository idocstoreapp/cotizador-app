-- ============================================
-- Script SQL: Agregar campos rut, direccion y telefono a perfiles
-- ============================================
-- Este script agrega los campos necesarios para la gestión de personal
-- (trabajadores de taller y vendedores)
-- ============================================

-- Agregar campo rut
ALTER TABLE perfiles
ADD COLUMN IF NOT EXISTS rut TEXT;

-- Agregar campo direccion
ALTER TABLE perfiles
ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Agregar campo telefono
ALTER TABLE perfiles
ADD COLUMN IF NOT EXISTS telefono TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN perfiles.rut IS 'RUT del trabajador o vendedor';
COMMENT ON COLUMN perfiles.direccion IS 'Dirección del trabajador o vendedor';
COMMENT ON COLUMN perfiles.telefono IS 'Número de teléfono del trabajador o vendedor';

-- ============================================
-- Verificar que los campos se agregaron correctamente
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'perfiles'
  AND column_name IN ('rut', 'direccion', 'telefono')
ORDER BY column_name;

