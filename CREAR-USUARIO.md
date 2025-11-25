# Cómo Crear tu Primer Usuario

## 🚀 Opción 1: Crear Usuario desde la Aplicación (Más Fácil)

### Paso 1: Asegúrate de que las tablas estén creadas

Antes de crear usuarios, necesitas ejecutar el script SQL en Supabase:

1. Ve a: https://tnlkdtslqgoezfecvcbj.supabase.co
2. Click en **"SQL Editor"** en el menú lateral
3. Click en **"New Query"**
4. Abre el archivo `supabase-setup.sql` en tu proyecto
5. Copia TODO el contenido y pégalo en el editor de SQL
6. Click en **"Run"** o presiona **Ctrl+Enter**
7. Espera a que termine (debería decir "Success")

### Paso 2: Crear usuario desde la aplicación

1. **Abre la aplicación**: http://localhost:4321 o http://localhost:4323

2. **Haz click en "¿No tienes cuenta? Regístrate"**

3. **Completa el formulario**:
   - **Email**: tu_email@ejemplo.com (usa un email real)
   - **Contraseña**: (mínimo 6 caracteres, ej: `admin123`)
   - **Nombre**: Tu Nombre (opcional)
   - **Rol**: Selecciona **"Administrador"**

4. **Click en "Registrar"**

5. **Confirma tu email**:
   - Revisa tu correo (incluida la carpeta de spam)
   - Busca un email de Supabase
   - Click en el enlace de confirmación

6. **Inicia sesión**:
   - Vuelve a http://localhost:4321
   - Usa el email y contraseña que acabas de crear

## 🔧 Opción 2: Crear Usuario desde Supabase Dashboard

### Paso 1: Crear usuario en Supabase

1. Ve a: https://tnlkdtslqgoezfecvcbj.supabase.co
2. Click en **"Authentication"** > **"Users"**
3. Click en **"Add User"** > **"Create new user"**
4. Completa:
   - **Email**: admin@muebleria.com
   - **Password**: admin123 (o la que prefieras)
   - **Auto Confirm User**: ✅ Marca esta opción (importante)
5. Click en **"Create user"**
6. **Copia el User ID** (UUID) que aparece

### Paso 2: Crear perfil de administrador

1. Ve a **"SQL Editor"** en Supabase
2. Ejecuta este SQL (reemplaza los valores):

```sql
INSERT INTO perfiles (id, email, role, nombre)
VALUES (
  'PEGA_AQUI_EL_USER_ID',  -- Pega el UUID que copiaste
  'admin@muebleria.com',
  'admin',
  'Administrador'
);
```

3. Click en **"Run"**

### Paso 3: Iniciar sesión

1. Ve a: http://localhost:4321
2. Usa:
   - **Email**: admin@muebleria.com
   - **Contraseña**: admin123 (o la que pusiste)

## 📝 Credenciales de Ejemplo

Si creas un usuario siguiendo la Opción 2, puedes usar:

**Administrador:**
- Email: `admin@muebleria.com`
- Contraseña: `admin123` (o la que configuraste)

**Técnico/Vendedor:**
- Email: `tecnico@muebleria.com`
- Contraseña: `tecnico123` (o la que configuraste)

## ⚠️ Importante

- **No hay usuarios predefinidos**: Debes crear el primer usuario tú mismo
- **Confirma el email**: Si usas la Opción 1, debes confirmar el email antes de poder iniciar sesión
- **Auto Confirm**: Si usas la Opción 2, marca "Auto Confirm User" para evitar confirmar email

## 🔍 Verificar que Funcionó

Después de crear el usuario:

1. ✅ Deberías poder iniciar sesión
2. ✅ Si eres admin, verás el menú completo (Dashboard, Catálogo, Vendedores, Taller, Reportes)
3. ✅ Si eres técnico, verás un menú más limitado (Dashboard, Catálogo, Cotización)

## ❌ Si No Puedes Iniciar Sesión

### Error: "Invalid login credentials"
- Verifica que el email y contraseña sean correctos
- Si usaste la Opción 1, asegúrate de haber confirmado el email

### Error: "User not found"
- Verifica que el usuario se creó en Supabase (Authentication > Users)
- Verifica que el perfil se creó en la tabla `perfiles`

### Error: "Email not confirmed"
- Revisa tu correo y confirma el email
- O crea el usuario con "Auto Confirm User" marcado

---

**Recomendación**: Usa la **Opción 1** (desde la aplicación) porque es más fácil y automática.


