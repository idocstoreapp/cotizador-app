# 📦 Instrucciones: Actualizar Closet Modular con Variantes

Este documento explica cómo actualizar el Closet Modular con las 4 variantes de color usando las imágenes que están en la raíz del proyecto.

## 📋 Mapeo de Imágenes a Colores

- **mueble1.png** → Color: **Marrón**
- **mueble2.png** → Color: **Azul Rey**
- **mueble3.png** → Color: **Gris**
- **mueble4.png** → Color: **Beige**

## 🚀 Pasos para Actualizar

### Paso 1: Subir las Imágenes a Supabase Storage

1. Ve a **Supabase Dashboard**: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Asegúrate de que existe el bucket **`muebles-imagenes`**
   - Si no existe, créalo:
     - Haz clic en **"New bucket"**
     - Nombre: `muebles-imagenes`
     - Marca **"Public bucket"** ✅
     - Haz clic en **"Create bucket"**
5. Haz clic en el bucket **`muebles-imagenes`**
6. Sube las 4 imágenes:
   - Haz clic en **"Upload file"** o arrastra las imágenes
   - Sube: `mueble1.png`, `mueble2.png`, `mueble3.png`, `mueble4.png`
   - Espera a que se completen las subidas

### Paso 2: Obtener las URLs Públicas

Para cada imagen subida:

1. Haz clic derecho en la imagen → **"Copy URL"** o
2. Haz clic en la imagen → Copia la URL del campo **"Public URL"**

Las URLs deberían verse así:
```
https://[tu-proyecto].supabase.co/storage/v1/object/public/muebles-imagenes/muebles/[timestamp]-[random].png
```

**Ejemplo:**
```
https://abcdefghijklmnop.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/1234567890-abc123.png
```

### Paso 3: Actualizar el Script SQL

1. Abre el archivo **`actualizar-closet-variantes.sql`**
2. Busca las líneas que dicen `REEMPLAZAR_CON_URL_REAL`
3. Reemplaza cada una con la URL real de la imagen correspondiente:

```sql
url_mueble1 TEXT := 'https://tu-proyecto.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/...mueble1.png';
url_mueble2 TEXT := 'https://tu-proyecto.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/...mueble2.png';
url_mueble3 TEXT := 'https://tu-proyecto.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/...mueble3.png';
url_mueble4 TEXT := 'https://tu-proyecto.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/...mueble4.png';
```

### Paso 4: Ejecutar el Script

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo **`actualizar-closet-variantes.sql`** (con las URLs actualizadas)
3. Copia todo el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"** o presiona `Ctrl+Enter`
6. Verifica que aparezca el mensaje: `✅ Closet actualizado exitosamente` o `✅ Closet creado exitosamente`

### Paso 5: Verificar en la Aplicación

1. Recarga tu aplicación
2. Ve a **Catálogo**
3. Busca el **"Closet Modular Premium"**
4. Haz clic en él para abrir el detalle
5. Deberías ver:
   - ✅ La imagen principal (Marrón)
   - ✅ 4 thumbnails de variantes debajo de la imagen principal
   - ✅ Selector de colores con 4 opciones: Marrón, Azul Rey, Gris, Beige
   - ✅ Al cambiar el color, la imagen principal debería cambiar automáticamente

## 🔍 Verificación en Supabase

Si quieres verificar directamente en Supabase:

```sql
SELECT 
  nombre,
  imagen as imagen_principal,
  opciones_disponibles->'colores' as colores,
  jsonb_array_length(imagenes_por_variante) as num_variantes,
  imagenes_por_variante
FROM muebles
WHERE nombre ILIKE '%closet%';
```

Deberías ver:
- `colores`: `["Marrón", "Azul Rey", "Gris", "Beige"]`
- `num_variantes`: `4`
- `imagenes_por_variante`: Array con 4 objetos, cada uno con `color` e `imagen_url`

## ⚠️ Solución de Problemas

### Las variantes no se muestran

1. Verifica que las URLs en la base de datos sean correctas:
   ```sql
   SELECT imagenes_por_variante FROM muebles WHERE nombre ILIKE '%closet%';
   ```

2. Verifica que las imágenes sean accesibles públicamente:
   - Abre cada URL en una nueva pestaña del navegador
   - Deberías ver la imagen

3. Revisa la consola del navegador (F12) para ver si hay errores

### Las imágenes no cargan

1. Verifica que el bucket `muebles-imagenes` sea público
2. Verifica que las políticas de Storage permitan lectura pública
3. Verifica que las URLs no tengan espacios o caracteres especiales

## 📝 Notas

- El script actualizará el closet si ya existe, o lo creará si no existe
- La imagen principal será `mueble1.png` (Marrón)
- Las variantes se mostrarán como thumbnails debajo de la imagen principal
- Al seleccionar un color, la imagen principal cambiará automáticamente




