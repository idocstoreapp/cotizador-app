# 🔗 Cómo Obtener las URLs de las Imágenes en Supabase Storage

## 📋 Pasos Rápidos

### Opción 1: Desde el Dashboard de Supabase (Más Fácil)

1. Ve a **Supabase Dashboard**: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Storage** → **muebles-imagenes**
4. Para cada imagen (`mueble1.png`, `mueble2.png`, `mueble3.png`, `mueble4.png`):
   - **Haz clic en la imagen** para abrirla
   - Copia la **"Public URL"** que aparece en la parte superior
   - O haz **clic derecho** en la imagen → **"Copy URL"**

### Opción 2: Construir la URL Manualmente

Si conoces el nombre exacto del archivo, la URL sigue este formato:

```
https://[TU-PROYECTO-ID].supabase.co/storage/v1/object/public/muebles-imagenes/[RUTA]/[NOMBRE-ARCHIVO].png
```

**Ejemplo:**
```
https://abcdefghijklmnop.supabase.co/storage/v1/object/public/muebles-imagenes/muebles/1234567890-mueble1.png
```

**Para encontrar tu PROJECT-ID:**
- Ve a **Settings** → **API** en Supabase Dashboard
- Copia el **"Project URL"** y extrae el ID (la parte antes de `.supabase.co`)

## 📝 Mapeo de Imágenes

- **mueble1.png** → Color: **Marrón**
- **mueble2.png** → Color: **Azul Rey**
- **mueble3.png** → Color: **Gris**
- **mueble4.png** → Color: **Beige**

## ✅ Verificar que las URLs Funcionan

Antes de usar las URLs en el script SQL, verifica que funcionen:

1. Copia cada URL
2. Pégalas en una nueva pestaña del navegador
3. Deberías ver la imagen

Si no cargan, verifica:
- ✅ El bucket `muebles-imagenes` es público
- ✅ Las políticas de Storage permiten lectura pública
- ✅ La URL está completa y correcta

## 🚀 Siguiente Paso

Una vez que tengas las 4 URLs, edita el archivo `actualizar-closet-variantes-auto.sql` y reemplaza:
- `REEMPLAZAR_CON_TU_PROYECTO` con tu PROJECT-ID
- Ajusta las rutas si las imágenes están en subcarpetas





