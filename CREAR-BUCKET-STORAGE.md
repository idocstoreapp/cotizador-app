# 🔧 Solución: Error "Bucket not found"

## Problema
Al intentar crear un mueble, aparece el error: **"Error al crear mueble: Bucket not found"**

Esto significa que el bucket de Storage `muebles-imagenes` no existe en Supabase.

## ✅ Solución Rápida

### Opción 1: Crear el Bucket desde el Dashboard (Recomendado)

1. **Abre tu proyecto de Supabase**
   - Ve a: https://app.supabase.com
   - Selecciona tu proyecto

2. **Ve a Storage**
   - En el menú lateral izquierdo, haz clic en **"Storage"**

3. **Crea el Bucket**
   - Haz clic en el botón **"New bucket"** (botón verde)
   - Configura el bucket:
     - **Name**: `muebles-imagenes` (exactamente este nombre, sin espacios)
     - **Public bucket**: ✅ **MARCAR COMO PÚBLICO** (esto es muy importante)
   - Haz clic en **"Create bucket"**

4. **Configurar Políticas (Opcional pero Recomendado)**
   - Haz clic en el bucket `muebles-imagenes` que acabas de crear
   - Ve a la pestaña **"Policies"**
   - Ejecuta el script SQL `supabase-storage-setup.sql` en el SQL Editor para configurar las políticas automáticamente

### Opción 2: Usar el Script SQL

1. **Crea el bucket manualmente** (paso 1-3 de la Opción 1)

2. **Ejecuta el script SQL**
   - Abre el archivo `supabase-storage-setup.sql` en este proyecto
   - Ve a Supabase Dashboard > SQL Editor
   - Pega el contenido del script
   - Haz clic en **"Run"**

## 🔍 Verificación

Después de crear el bucket:

1. **Verifica que el bucket existe**
   - Ve a Storage en Supabase
   - Deberías ver `muebles-imagenes` en la lista

2. **Prueba crear un mueble**
   - Ve a tu aplicación
   - Intenta crear un mueble con una imagen
   - El error debería desaparecer

## ⚠️ Notas Importantes

- El nombre del bucket **DEBE** ser exactamente `muebles-imagenes` (sin espacios, con guión)
- El bucket **DEBE** ser público para que las imágenes sean accesibles
- Si cambias el nombre del bucket, también debes actualizar `BUCKET_NAME` en `src/services/storage.service.ts`

## 🐛 Si el Error Persiste

1. Verifica que el bucket se llama exactamente `muebles-imagenes`
2. Verifica que el bucket está marcado como público
3. Verifica que las políticas de Storage están configuradas
4. Revisa la consola del navegador para más detalles del error
5. Verifica que estás autenticado como administrador


