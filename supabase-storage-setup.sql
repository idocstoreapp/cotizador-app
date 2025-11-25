-- ============================================
-- Script para crear el Bucket de Storage para Imágenes de Muebles
-- Ejecutar este script en el SQL Editor de Supabase
-- ============================================

-- Crear el bucket "muebles-imagenes"
-- Nota: Los buckets se crean usando la extensión storage, pero en Supabase
-- es mejor crearlos desde el Dashboard. Este script configura las políticas.

-- IMPORTANTE: Primero debes crear el bucket manualmente desde el Dashboard:
-- 1. Ve a Storage en Supabase Dashboard
-- 2. Haz clic en "New Bucket"
-- 3. Nombre: "muebles-imagenes"
-- 4. Marca "Public bucket" como TRUE
-- 5. Haz clic en "Create bucket"

-- ============================================
-- Políticas de Storage para el bucket muebles-imagenes
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Public read access for muebles-imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to muebles-imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update muebles-imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete muebles-imagenes" ON storage.objects;

-- Política 1: Lectura pública (cualquiera puede ver las imágenes)
CREATE POLICY "Public read access for muebles-imagenes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'muebles-imagenes');

-- Política 2: Solo usuarios autenticados pueden subir imágenes
CREATE POLICY "Authenticated users can upload to muebles-imagenes"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'muebles-imagenes' 
  AND auth.role() = 'authenticated'
);

-- Política 3: Solo usuarios autenticados pueden actualizar imágenes
CREATE POLICY "Authenticated users can update muebles-imagenes"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'muebles-imagenes' 
  AND auth.role() = 'authenticated'
);

-- Política 4: Solo usuarios autenticados pueden eliminar imágenes
CREATE POLICY "Authenticated users can delete muebles-imagenes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'muebles-imagenes' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- Verificación
-- ============================================
-- Para verificar que las políticas se crearon correctamente:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%muebles-imagenes%';


