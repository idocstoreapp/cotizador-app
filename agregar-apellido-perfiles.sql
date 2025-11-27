-- ============================================
-- Script SQL: Agregar campo apellido a perfiles
-- ============================================

-- Agregar campo apellido
ALTER TABLE perfiles
ADD COLUMN IF NOT EXISTS apellido TEXT;

-- Comentario para documentación
COMMENT ON COLUMN perfiles.apellido IS 'Apellido del vendedor o trabajador de taller';

