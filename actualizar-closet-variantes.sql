-- ============================================
-- Script para actualizar el Closet Modular con las 4 variantes de color
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Sube las 4 imágenes a Supabase Storage:
--    - Ve a Supabase Dashboard → Storage → muebles-imagenes
--    - Sube: mueble1.png (Marrón), mueble2.png (Azul Rey), mueble3.png (Gris), mueble4.png (Beige)
--    - Copia las URLs públicas de cada imagen
-- 2. Reemplaza las URLs en este script (busca "REEMPLAZAR_CON_URL_REAL")
-- 3. Ejecuta este script en el SQL Editor de Supabase
--
-- ============================================

-- Primero, verificar si el closet existe
DO $$
DECLARE
  closet_id UUID;
  url_mueble1 TEXT := 'REEMPLAZAR_CON_URL_REAL_mueble1.png'; -- Marrón
  url_mueble2 TEXT := 'REEMPLAZAR_CON_URL_REAL_mueble2.png'; -- Azul Rey
  url_mueble3 TEXT := 'REEMPLAZAR_CON_URL_REAL_mueble3.png'; -- Gris
  url_mueble4 TEXT := 'REEMPLAZAR_CON_URL_REAL_mueble4.png'; -- Beige
BEGIN
  -- Buscar el closet existente
  SELECT id INTO closet_id
  FROM muebles
  WHERE nombre ILIKE '%closet%modular%' OR nombre ILIKE '%closet%premium%'
  LIMIT 1;

  IF closet_id IS NOT NULL THEN
    -- Actualizar el closet existente
    UPDATE muebles
    SET
      imagen = url_mueble1, -- Imagen principal (Marrón)
      opciones_disponibles = '{
        "colores": ["Marrón", "Azul Rey", "Gris", "Beige"],
        "materiales": ["Melanina", "Lacado Brillo", "Madera Sólida"],
        "encimeras": [],
        "canteados": []
      }'::jsonb,
      imagenes_por_variante = '[
        {
          "color": "Marrón",
          "imagen_url": "' || url_mueble1 || '"
        },
        {
          "color": "Azul Rey",
          "imagen_url": "' || url_mueble2 || '"
        },
        {
          "color": "Gris",
          "imagen_url": "' || url_mueble3 || '"
        },
        {
          "color": "Beige",
          "imagen_url": "' || url_mueble4 || '"
        }
      ]'::jsonb,
      updated_at = NOW()
    WHERE id = closet_id;

    RAISE NOTICE '✅ Closet actualizado exitosamente (ID: %)', closet_id;
  ELSE
    -- Crear el closet si no existe
    INSERT INTO muebles (
      nombre,
      descripcion,
      imagen,
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
      url_mueble1, -- Imagen principal (Marrón)
      1950000,
      'closet',
      '{
        "ancho": 240,
        "alto": 240,
        "profundidad": 60,
        "unidad": "cm"
      }'::jsonb,
      '{
        "colores": ["Marrón", "Azul Rey", "Gris", "Beige"],
        "materiales": ["Melanina", "Lacado Brillo", "Madera Sólida"],
        "encimeras": [],
        "canteados": []
      }'::jsonb,
      '[
        {
          "color": "Marrón",
          "imagen_url": "' || url_mueble1 || '"
        },
        {
          "color": "Azul Rey",
          "imagen_url": "' || url_mueble2 || '"
        },
        {
          "color": "Gris",
          "imagen_url": "' || url_mueble3 || '"
        },
        {
          "color": "Beige",
          "imagen_url": "' || url_mueble4 || '"
        }
      ]'::jsonb,
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
      15,
      24,
      30
    ) RETURNING id INTO closet_id;

    RAISE NOTICE '✅ Closet creado exitosamente (ID: %)', closet_id;
  END IF;
END $$;

-- Verificar el resultado
SELECT 
  id,
  nombre,
  categoria,
  precio_base,
  imagen as imagen_principal,
  opciones_disponibles->'colores' as colores_disponibles,
  jsonb_array_length(imagenes_por_variante) as numero_variantes,
  imagenes_por_variante
FROM muebles
WHERE nombre ILIKE '%closet%modular%' OR nombre ILIKE '%closet%premium%'
ORDER BY updated_at DESC
LIMIT 1;




