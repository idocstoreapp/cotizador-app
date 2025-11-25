# 📦 Crear Closet de Ejemplo con 4 Variantes

Este documento explica cómo crear el Closet de ejemplo con las 4 variantes de color usando las imágenes `mueble1.png`, `mueble2.png`, `mueble3.png`, y `mueble4.png`.

## 📋 Pasos

### Paso 1: Subir las imágenes a Supabase Storage

1. Ve a **Supabase Dashboard** → **Storage** → **muebles-imagenes**
2. Haz clic en **"Upload file"** o arrastra las imágenes
3. Sube las 4 imágenes:
   - `mueble1.png` (Marrón)
   - `mueble2.png` (Azul Rey)
   - `mueble3.png` (Gris)
   - `mueble4.png` (Beige)
4. Después de subir cada imagen, haz clic derecho → **"Copy URL"** o usa el botón de compartir para obtener la URL pública

### Paso 2: Obtener las URLs públicas

Las URLs deberían verse así:
```
https://[tu-proyecto].supabase.co/storage/v1/object/public/muebles-imagenes/muebles/[nombre-archivo].png
```

### Paso 3: Actualizar el script SQL

1. Abre el archivo `crear-closet-ejemplo.sql`
2. Reemplaza las URLs placeholder con las URLs reales de tus imágenes:
   - Busca `"imagen_url": "https://via.placeholder.com/..."`
   - Reemplaza con las URLs reales de Supabase Storage

### Paso 4: Ejecutar el script

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `crear-closet-ejemplo.sql` (con las URLs actualizadas)
3. Haz clic en **"Run"** o presiona `Ctrl+Enter`
4. Verifica que el mensaje sea exitoso

### Paso 5: Verificar en la aplicación

1. Ve a tu aplicación → **Catálogo**
2. Deberías ver el "Closet Modular Premium"
3. Haz clic en él para ver las opciones de color
4. Al seleccionar diferentes colores, la imagen debería cambiar automáticamente

## 🎨 Mapeo de Colores

- **mueble1.png** → Color: "Marrón"
- **mueble2.png** → Color: "Azul Rey"
- **mueble3.png** → Color: "Gris"
- **mueble4.png** → Color: "Beige"

## ⚠️ Notas Importantes

- Asegúrate de que el bucket `muebles-imagenes` esté creado y sea público
- Las imágenes deben ser accesibles públicamente
- Si cambias los nombres de los colores en el script, asegúrate de que coincidan exactamente con los que están en `opciones_disponibles.colores`

## 🔧 Alternativa: Crear desde la UI

También puedes crear el Closet desde la interfaz de gestión:

1. Ve a **Catálogo** → **Gestionar Catálogo**
2. Haz clic en **"Crear Nuevo Mueble"**
3. Completa el formulario:
   - Nombre: "Closet Modular Premium"
   - Categoría: "closet"
   - Precio Base: 1950000
   - Agrega los colores: Marrón, Azul Rey, Gris, Beige
   - En la sección **"Imágenes por Variante"**, sube cada imagen y asocia el color correspondiente

## ✅ Verificación

Después de crear el Closet, verifica que:
- ✅ Aparece en el catálogo
- ✅ Tiene 4 opciones de color
- ✅ Al seleccionar cada color, la imagen cambia correctamente
- ✅ Los thumbnails de variantes se muestran debajo de la imagen principal

