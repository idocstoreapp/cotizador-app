# 🔍 Verificar y Solucionar Problemas con el Bucket

## ❌ Error: "El bucket muebles-imagenes no existe"

Si sigues recibiendo este error después de crear el bucket, sigue estos pasos:

## ✅ Verificación Paso a Paso

### 1. Verificar que el bucket existe

1. Ve a **Supabase Dashboard** → **Storage**
2. Busca en la lista el bucket `muebles-imagenes`
3. **Verifica el nombre exacto:**
   - ✅ Debe ser: `muebles-imagenes` (con guión, sin espacios)
   - ❌ NO debe ser: `muebles_imagenes` (con guión bajo)
   - ❌ NO debe ser: `muebles imagenes` (con espacio)
   - ❌ NO debe ser: `Muebles-Imagenes` (con mayúsculas)

### 2. Verificar que el bucket es público

1. Haz clic en el bucket `muebles-imagenes`
2. Verifica que esté marcado como **"Public bucket"** ✅
3. Si no lo está:
   - Haz clic en **"Settings"** o **"Configuración"**
   - Marca **"Public bucket"**
   - Guarda los cambios

### 3. Verificar permisos de Storage

1. Ve a **Storage** → **Policies**
2. Verifica que existan políticas que permitan:
   - **SELECT** (leer) para usuarios autenticados
   - **INSERT** (subir) para administradores
   - **UPDATE** (actualizar) para administradores
   - **DELETE** (eliminar) para administradores

3. Si no existen, ejecuta el script `supabase-storage-setup.sql` en el SQL Editor

### 4. Verificar que estás en el proyecto correcto

1. Verifica que estás usando el proyecto correcto de Supabase
2. Verifica que las variables de entorno en tu aplicación apuntan al proyecto correcto:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 5. Verificar autenticación

1. Asegúrate de estar autenticado como administrador
2. Verifica que tu usuario tenga el rol `admin` en la tabla `perfiles`

## 🔧 Solución Rápida: Recrear el Bucket

Si nada funciona, intenta recrear el bucket:

1. **Elimina el bucket existente** (si existe):
   - Ve a Storage → `muebles-imagenes`
   - Haz clic en **"Delete bucket"** o los tres puntos → **"Delete"**
   - Confirma la eliminación

2. **Crea el bucket nuevamente:**
   - Haz clic en **"New bucket"**
   - **Name:** `muebles-imagenes` (exactamente así)
   - **Public bucket:** ✅ Marca esta casilla
   - Haz clic en **"Create bucket"**

3. **Configura las políticas:**
   - Ejecuta `supabase-storage-setup.sql` en el SQL Editor

4. **Prueba nuevamente:**
   - Intenta subir una imagen desde la aplicación
   - Revisa la consola del navegador (F12) para ver logs detallados

## 🐛 Debug: Ver Logs en la Consola

1. Abre la consola del navegador (F12)
2. Intenta subir una imagen
3. Busca mensajes que empiecen con:
   - `📦 Buckets disponibles:`
   - `🔍 Buscando bucket:`
   - `📤 Intentando subir archivo:`
   - `❌ Error al subir imagen:`

Estos logs te dirán exactamente qué está pasando.

## 📋 Checklist Final

- [ ] El bucket se llama exactamente `muebles-imagenes` (con guión)
- [ ] El bucket está marcado como público
- [ ] Las políticas de Storage están configuradas
- [ ] Estás autenticado como administrador
- [ ] Estás en el proyecto correcto de Supabase
- [ ] Las variables de entorno están correctas
- [ ] La consola del navegador no muestra errores de conexión

## 🆘 Si Aún No Funciona

1. **Verifica la consola del navegador** para ver el error exacto
2. **Verifica los logs de Supabase:**
   - Ve a Supabase Dashboard → **Logs** → **API Logs**
   - Busca errores relacionados con Storage
3. **Prueba crear el bucket desde SQL:**
   - Ejecuta `supabase-storage-setup.sql` completo
4. **Contacta soporte** con:
   - El error exacto de la consola
   - Una captura de pantalla de tus buckets
   - Los logs de la consola del navegador








