# 🚨 SOLUCIÓN RÁPIDA: Crear Bucket de Storage

## ⚡ Pasos Rápidos (2 minutos)

### Paso 1: Abre Supabase Dashboard
1. Ve a: **https://app.supabase.com**
2. Inicia sesión si es necesario
3. Selecciona tu proyecto

### Paso 2: Ve a Storage
1. En el menú lateral izquierdo, busca **"Storage"**
2. Haz clic en **"Storage"**

### Paso 3: Crea el Bucket
1. Verás un botón verde **"New bucket"** o **"Create bucket"**
2. Haz clic en ese botón
3. En el formulario que aparece:
   - **Name**: Escribe exactamente: `muebles-imagenes`
   - **Public bucket**: ✅ **MARCAR ESTA CASILLA** (muy importante)
4. Haz clic en **"Create bucket"** o **"Save"**

### Paso 4: Verifica
1. Deberías ver `muebles-imagenes` en la lista de buckets
2. Vuelve a tu aplicación
3. Intenta crear un mueble nuevamente

## 📸 Guía Visual

```
Supabase Dashboard
├── Storage (haz clic aquí)
    ├── [New bucket] ← Haz clic aquí
    │   ├── Name: muebles-imagenes
    │   ├── Public bucket: ✅ (marcar)
    │   └── [Create bucket] ← Confirmar
    └── muebles-imagenes ← Debería aparecer aquí
```

## ⚠️ Errores Comunes

### Error: "Bucket name already exists"
- El bucket ya existe, pero puede que no esté público
- Solución: Haz clic en el bucket existente y marca "Public bucket"

### Error: "Invalid bucket name"
- El nombre debe ser exactamente: `muebles-imagenes`
- No uses espacios, mayúsculas o caracteres especiales

### El bucket existe pero sigue el error
1. Verifica que el nombre sea exactamente `muebles-imagenes`
2. Verifica que esté marcado como "Public bucket"
3. Recarga la página de tu aplicación
4. Intenta crear el mueble nuevamente

## 🔧 Configuración Avanzada (Opcional)

Si quieres configurar políticas de seguridad más específicas:

1. Ve a **Storage** > **muebles-imagenes** > **Policies**
2. Abre el archivo `supabase-storage-setup.sql` en este proyecto
3. Copia el contenido
4. Ve a **SQL Editor** en Supabase
5. Pega y ejecuta el script

## ✅ Verificación Final

Después de crear el bucket, deberías poder:
- ✅ Ver el bucket en la lista de Storage
- ✅ Crear muebles con imágenes sin errores
- ✅ Ver las imágenes en el catálogo

## 🆘 ¿Aún no funciona?

1. **Verifica que estás en el proyecto correcto de Supabase**
2. **Verifica que el bucket se llama exactamente `muebles-imagenes`**
3. **Verifica que el bucket está marcado como público**
4. **Limpia la caché del navegador (Ctrl+Shift+R)**
5. **Revisa la consola del navegador (F12) para más detalles**


