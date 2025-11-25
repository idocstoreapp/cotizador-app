# Configuración de Supabase - Guía Rápida

## ✅ Paso 1: Archivo .env (YA CREADO)

El archivo `.env` ya está creado con tus credenciales. No necesitas hacer nada más aquí.

## 🗄️ Paso 2: Crear las Tablas en Supabase

### Instrucciones:

1. **Abre tu proyecto de Supabase**
   - Ve a: https://tnlkdtslqgoezfecvcbj.supabase.co
   - Inicia sesión si es necesario

2. **Abre el SQL Editor**
   - En el menú lateral izquierdo, haz clic en **"SQL Editor"**
   - Haz clic en **"New Query"** (botón verde)

3. **Copia el Script SQL**
   - Abre el archivo `supabase-setup.sql` en este proyecto
   - Copia **TODO** el contenido (Ctrl+A, Ctrl+C)

4. **Pega y Ejecuta**
   - Pega el script en el editor de SQL de Supabase
   - Haz clic en **"Run"** o presiona **Ctrl+Enter**
   - Espera a que termine (debería tomar 5-10 segundos)

5. **Verifica que se crearon las tablas**
   - En el menú lateral, ve a **"Table Editor"**
   - Deberías ver 4 tablas:
     - ✅ `perfiles`
     - ✅ `materiales`
     - ✅ `servicios`
     - ✅ `cotizaciones`

## 👤 Paso 3: Crear tu Primer Usuario Administrador

### Opción A: Desde la Aplicación (Recomendado)

1. **Reinicia el servidor** (si está corriendo):
   ```bash
   # Detén el servidor con Ctrl+C
   # Luego reinícialo:
   npm run dev
   ```

2. **Abre la aplicación**:
   - Ve a: http://localhost:4321
   - Haz clic en "¿No tienes cuenta? Regístrate"
   - Completa el formulario:
     - Email: tu_email@ejemplo.com
     - Contraseña: (mínimo 6 caracteres)
     - Nombre: Tu Nombre
     - Rol: **Administrador**
   - Haz clic en "Registrar"

3. **Confirma tu email**:
   - Revisa tu correo (incluida la carpeta de spam)
   - Haz clic en el enlace de confirmación de Supabase

4. **Inicia sesión**:
   - Vuelve a http://localhost:4321
   - Inicia sesión con tu email y contraseña

### Opción B: Desde Supabase Dashboard

1. **Crear usuario en Supabase**:
   - Ve a **"Authentication"** > **"Users"**
   - Haz clic en **"Add User"** > **"Create new user"**
   - Completa el formulario y crea el usuario
   - Copia el **User ID** (UUID)

2. **Crear perfil de administrador**:
   - Ve a **"SQL Editor"**
   - Ejecuta este SQL (reemplaza los valores):
   ```sql
   INSERT INTO perfiles (id, email, role, nombre)
   VALUES (
     'TU_USER_ID_AQUI',  -- Pega el UUID del usuario
     'tu_email@ejemplo.com',
     'admin',
     'Tu Nombre'
   );
   ```

## ✅ Paso 4: Verificar que Todo Funciona

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Abre la aplicación**:
   - http://localhost:4321

3. **Prueba las funcionalidades**:
   - ✅ Deberías poder iniciar sesión
   - ✅ Si eres admin, deberías ver el menú completo
   - ✅ Deberías poder ver el catálogo de muebles
   - ✅ Deberías poder crear cotizaciones

## 🔧 Solución de Problemas

### Error: "Faltan las variables de entorno"

**Solución**: 
- Verifica que el archivo `.env` existe en la raíz del proyecto
- Reinicia el servidor después de crear/modificar `.env`

### Error: "relation does not exist"

**Solución**:
- Las tablas no se crearon correctamente
- Vuelve a ejecutar el script SQL en Supabase
- Verifica que no haya errores en la consola de Supabase

### Error: "permission denied"

**Solución**:
- Las políticas RLS pueden estar bloqueando el acceso
- Verifica que ejecutaste TODO el script SQL
- Asegúrate de estar autenticado en la aplicación

### No puedo crear usuarios

**Solución**:
- Verifica que el email no esté ya registrado
- Revisa la configuración de autenticación en Supabase
- Asegúrate de confirmar el email si es necesario

## 📝 Notas Importantes

- **Secret Key**: La secret key que proporcionaste es para uso del servidor. No la uses en el frontend.
- **Anon Key**: Esta es la que está en el `.env` y es segura para usar en el frontend.
- **RLS**: Row Level Security está habilitado. Las políticas controlan quién puede ver/modificar qué datos.

## 🎯 Próximos Pasos

Una vez que todo esté configurado:

1. ✅ Crea tu primer usuario administrador
2. ✅ Explora el catálogo de muebles
3. ✅ Crea algunos materiales y servicios (solo admin)
4. ✅ Crea tu primera cotización
5. ✅ Genera un PDF de prueba

---

**¿Necesitas ayuda?** Revisa los mensajes de error en la consola del navegador (F12) y en la terminal del servidor.


