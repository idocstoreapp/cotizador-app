-- ============================================
-- Migración: Agregar campo imagenes_por_variante
-- ============================================
-- 
-- Este script agrega el campo imagenes_por_variante a la tabla muebles
-- si no existe ya.
--
-- ⚠️ IMPORTANTE: Si la tabla muebles NO EXISTE, ejecuta primero
-- el archivo setup-completo-muebles.sql
--
-- Ejecuta este script en el SQL Editor de Supabase antes de usar
-- el nuevo sistema de imágenes por variante.
--
-- ============================================

-- Verificar si la tabla existe
DO $$
BEGIN
  -- Verificar si la tabla existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'muebles'
  ) THEN
    RAISE EXCEPTION 'La tabla muebles no existe. Por favor ejecuta primero setup-completo-muebles.sql';
  END IF;
END $$;

-- Verificar si la columna ya existe
DO $$
BEGIN
  -- Agregar columna si no existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'muebles' 
    AND column_name = 'imagenes_por_variante'
  ) THEN
    ALTER TABLE muebles 
    ADD COLUMN imagenes_por_variante JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Columna imagenes_por_variante agregada exitosamente';
  ELSE
    RAISE NOTICE 'La columna imagenes_por_variante ya existe';
  END IF;
END $$;

-- Verificar que se agregó correctamente
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'muebles'
AND column_name = 'imagenes_por_variante';

