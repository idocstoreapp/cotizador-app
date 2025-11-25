-- ============================================
-- Script para crear el Closet de ejemplo con 4 variantes de color
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Primero, sube las 4 imágenes (mueble1.png, mueble2.png, mueble3.png, mueble4.png) 
--    a Supabase Storage en el bucket "muebles-imagenes"
-- 2. Obtén las URLs públicas de cada imagen
-- 3. Reemplaza las URLs en este script con las URLs reales de tus imágenes
-- 4. Ejecuta este script en el SQL Editor de Supabase
--
-- ============================================

-- Insertar el Closet con las 4 variantes
INSERT INTO muebles (
  nombre,
  descripcion,
  imagen, -- Imagen principal (usar mueble1.png como default)
  precio_base,
  categoria,
  medidas,
  opciones_disponibles,
  imagenes_por_variante,
  materiales_predeterminados,
  dias_fabricacion,
  horas_mano_obra,
  margen_ganancia
) VALUES (
  'Closet Modular Premium',
  'Closet modular con sistema de organización inteligente. Disponible en múltiples colores y acabados.',
  -- Reemplaza esta URL con la URL pública de mueble1.png después de subirlo a Storage
  'https://via.placeholder.com/800x800?text=Closet+Principal',
  
  1950000, -- Precio base
  
  'closet', -- Categoría
  
  -- Medidas predeterminadas (en cm)
  '{
    "ancho": 240,
    "alto": 240,
    "profundidad": 60,
    "unidad": "cm"
  }'::jsonb,
  
  -- Opciones disponibles
  '{
    "colores": ["Marrón", "Azul Rey", "Gris", "Beige"],
    "materiales": ["Melanina", "Lacado Brillo", "Madera Sólida"],
    "encimeras": [],
    "canteados": []
  }'::jsonb,
  
  -- Imágenes por variante (REEMPLAZA LAS URLs CON LAS REALES)
  '[
    {
      "color": "Marrón",
      "imagen_url": "https://via.placeholder.com/800x800?text=Closet+Marrón"
    },
    {
      "color": "Azul Rey",
      "imagen_url": "https://via.placeholder.com/800x800?text=Closet+Azul+Rey"
    },
    {
      "color": "Gris",
      "imagen_url": "https://via.placeholder.com/800x800?text=Closet+Gris"
    },
    {
      "color": "Beige",
      "imagen_url": "https://via.placeholder.com/800x800?text=Closet+Beige"
    }
  ]'::jsonb,
  
  -- Materiales predeterminados (ejemplo)
  '[
    {
      "material_id": "00000000-0000-0000-0000-000000000001",
      "material_nombre": "Melanina Premium",
      "cantidad": 15,
      "unidad": "m²",
      "precio_unitario": 45000
    },
    {
      "material_id": "00000000-0000-0000-0000-000000000002",
      "material_nombre": "Herrajes",
      "cantidad": 1,
      "unidad": "unidad",
      "precio_unitario": 150000
    }
  ]'::jsonb,
  
  15, -- Días de fabricación
  24, -- Horas de mano de obra
  30  -- Margen de ganancia (%)
);

-- Verificar que se creó correctamente
SELECT 
  id,
  nombre,
  categoria,
  precio_base,
  opciones_disponibles->'colores' as colores_disponibles,
  jsonb_array_length(imagenes_por_variante) as numero_variantes
FROM muebles
WHERE nombre = 'Closet Modular Premium';

