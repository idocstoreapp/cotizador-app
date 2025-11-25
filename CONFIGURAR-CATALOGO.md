# Configuración del Catálogo de Muebles

## 📋 Paso 1: Crear la Tabla de Muebles en Supabase

1. **Abre tu proyecto de Supabase**
   - Ve a: https://tnlkdtslqgoezfecvcbj.supabase.co
   - Inicia sesión si es necesario

2. **Abre el SQL Editor**
   - En el menú lateral izquierdo, haz clic en **"SQL Editor"**
   - Haz clic en **"New Query"** (botón verde)

3. **Ejecuta el Script SQL**
   - Abre el archivo `supabase-muebles-setup.sql` en este proyecto
   - Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
   - Pega el script en el editor de SQL de Supabase
   - Haz clic en **"Run"** o presiona **Ctrl+Enter**
   - Espera a que termine (debería tomar 5-10 segundos)

4. **Verifica que se creó la tabla**
   - En el menú lateral, ve a **"Table Editor"**
   - Deberías ver la tabla `muebles` en la lista

## 🗂️ Paso 2: Crear el Bucket de Storage para Imágenes

1. **Ve a Storage en Supabase**
   - En el menú lateral, haz clic en **"Storage"**

2. **Crea un nuevo Bucket**
   - Haz clic en **"New Bucket"** (botón verde)
   - Configura el bucket:
     - **Name**: `muebles-imagenes`
     - **Public bucket**: ✅ **MARCAR COMO PÚBLICO** (importante para que las imágenes sean accesibles)
   - Haz clic en **"Create bucket"**

3. **Configurar Políticas de Storage (Opcional pero Recomendado)**
   - Haz clic en el bucket `muebles-imagenes`
   - Ve a la pestaña **"Policies"**
   - Crea una política para permitir lectura pública:
     - Haz clic en **"New Policy"**
     - Selecciona **"For full customization"**
     - Nombre: `Public read access`
     - Política:
     ```sql
     (bucket_id = 'muebles-imagenes')
     ```
     - Haz clic en **"Review"** y luego **"Save policy"**

## ✅ Paso 3: Verificar la Configuración

1. **Verifica la tabla**
   - Ve a **"Table Editor"** > **"muebles"**
   - Deberías ver una tabla vacía (esto es normal)

2. **Verifica el bucket**
   - Ve a **"Storage"** > **"muebles-imagenes"**
   - Deberías ver un bucket vacío (esto es normal)

## 🎯 Paso 4: Usar la Gestión de Catálogo

1. **Inicia sesión como Administrador**
   - Ve a: http://localhost:4321
   - Inicia sesión con una cuenta de administrador

2. **Accede a la Gestión de Catálogo**
   - En el menú lateral, haz clic en **"⚙️ Gestionar Catálogo"**
   - O ve directamente a: http://localhost:4321/admin/catalogo

3. **Crea tu primer mueble**
   - Haz clic en **"+ Nuevo Mueble"**
   - Completa el formulario:
     - Nombre del mueble
     - Categoría
     - Descripción
     - Precio base
     - Sube una imagen principal
     - Configura medidas (opcional)
     - Agrega colores disponibles
     - Agrega materiales como opciones
     - Agrega materiales predeterminados con cantidades
     - Agrega servicios/mano de obra predeterminados
     - Sube imágenes adicionales con colores asociados
     - Configura días de fabricación, horas de mano de obra y margen de ganancia
   - Haz clic en **"Crear Mueble"**

## 📝 Notas Importantes

- **Imágenes**: Las imágenes se suben automáticamente a Supabase Storage
- **Materiales Predeterminados**: Debes tener materiales creados en la tabla `materiales` antes de agregarlos a un mueble
- **Servicios Predeterminados**: Debes tener servicios creados en la tabla `servicios` antes de agregarlos a un mueble
- **Colores en Imágenes**: Puedes asociar cada imagen adicional con un color específico para mostrar variantes del mismo mueble

## 🔧 Solución de Problemas

### Error: "bucket does not exist"
- Asegúrate de haber creado el bucket `muebles-imuebles-imagenes` en Storage
- Verifica que el nombre sea exactamente `muebles-imagenes`

### Error: "permission denied"
- Verifica que el bucket sea público
- Revisa las políticas de RLS en la tabla `muebles`
- Asegúrate de estar iniciado sesión como administrador

### Las imágenes no se muestran
- Verifica que el bucket sea público
- Revisa la consola del navegador para ver errores de CORS
- Asegúrate de que las URLs de las imágenes sean accesibles públicamente


