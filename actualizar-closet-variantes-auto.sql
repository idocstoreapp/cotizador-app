-- ============================================
-- Script para actualizar el Closet Modular con las 4 variantes de color
-- Las imágenes ya están en Supabase Storage: mueble1.png, mueble2.png, mueble3.png, mueble4.png
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Obtén las URLs públicas de las imágenes desde Supabase Storage:
--    - Ve a Storage → muebles-imagenes
--    - Para cada imagen (mueble1.png, mueble2.png, mueble3.png, mueble4.png):
--      * Haz clic derecho → "Copy URL" o
--      * Haz clic en la imagen → Copia la "Public URL"
-- 2. Reemplaza las URLs en las variables url_mueble1, url_mueble2, url_mueble3, url_mueble4
-- 3. Ejecuta este script en el SQL Editor de Supabase
--
-- ============================================

-- OPCION 1: Si conoces las URLs exactas, reemplázalas aquí:
DO $$
DECLARE
  closet_id UUID;
  -- REEMPLAZA ESTAS URLs CON LAS URLs REALES DE TUS IMÁGENES EN SUPABASE STORAGE
  -- Formato: https://[tu-proyecto].supabase.co/storage/v1/object/public/muebles-imagenes/[ruta]/[nombre-archivo].png
  url_mueble1 TEXT := 'https://REEMPLAZAR_CON_TU_PROYECTO.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/mueble1.png'; -- Marrón
  url_mueble2 TEXT := 'https://REEMPLAZAR_CON_TU_PROYECTO.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/mueble2.png'; -- Azul Rey
  url_mueble3 TEXT := 'https://REEMPLAZAR_CON_TU_PROYECTO.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/mueble3.png'; -- Gris
  url_mueble4 TEXT := 'https://REEMPLAZAR_CON_TU_PROYECTO.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/mueble4.png'; -- Beige
BEGIN
  -- Buscar el closet existente (busca por nombre que contenga "closet")
  SELECT id INTO closet_id
  FROM muebles
  WHERE nombre ILIKE '%closet%' OR nombre ILIKE '%Closet%'
  ORDER BY created_at DESC
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
      imagenes_por_variante = jsonb_build_array(
        jsonb_build_object('color', 'Marrón', 'imagen_url', url_mueble1),
        jsonb_build_object('color', 'Azul Rey', 'imagen_url', url_mueble2),
        jsonb_build_object('color', 'Gris', 'imagen_url', url_mueble3),
        jsonb_build_object('color', 'Beige', 'imagen_url', url_mueble4)
      ),
      updated_at = NOW()
    WHERE id = closet_id;

    RAISE NOTICE '✅ Closet actualizado exitosamente (ID: %)', closet_id;
    RAISE NOTICE '📸 Imagen principal: %', url_mueble1;
    RAISE NOTICE '🎨 Variantes: 4 (Marrón, Azul Rey, Gris, Beige)';
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
      jsonb_build_array(
        jsonb_build_object('color', 'Marrón', 'imagen_url', url_mueble1),
        jsonb_build_object('color', 'Azul Rey', 'imagen_url', url_mueble2),
        jsonb_build_object('color', 'Gris', 'imagen_url', url_mueble3),
        jsonb_build_object('color', 'Beige', 'imagen_url', url_mueble4)
      ),
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
    RAISE NOTICE '📸 Imagen principal: %', url_mueble1;
    RAISE NOTICE '🎨 Variantes: 4 (Marrón, Azul Rey, Gris, Beige)';
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
WHERE nombre ILIKE '%closet%' OR categoria = 'closet'
ORDER BY updated_at DESC
LIMIT 1;





