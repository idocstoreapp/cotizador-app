# Solución Definitiva - Problema de Login

## 🔍 Diagnóstico

Si el login no funciona y la página se recarga, puede ser por varias razones:

### 1. Verificar que las Tablas Existen

**Ejecuta en Supabase SQL Editor:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('perfiles', 'materiales', 'servicios', 'cotizaciones');
```

Deberías ver 4 filas. Si no, ejecuta `supabase-setup.sql` completo.

### 2. Verificar que el Usuario Existe

**En Supabase Dashboard:**
1. Ve a **Authentication** > **Users**
2. Verifica que existe un usuario con el email que estás usando
3. Verifica que el email esté **confirmado** (debe tener un check verde)

### 3. Verificar que el Perfil Existe

**Ejecuta en Supabase SQL Editor:**

```sql
SELECT * FROM perfiles;
```

Deberías ver al menos un perfil. Si no hay ninguno, créalo:

```sql
-- Primero obtén el User ID del usuario en Authentication > Users
-- Luego ejecuta esto (reemplaza el USER_ID):

INSERT INTO perfiles (id, email, role, nombre)
VALUES (
  'USER_ID_AQUI',  -- Pega el UUID del usuario
  'tu_email@ejemplo.com',
  'admin',
  'Administrador'
);
```

### 4. Probar Login Directamente desde Supabase

1. Ve a **Authentication** > **Users**
2. Click en el usuario
3. Click en **"Send magic link"** o **"Reset password"**
4. Esto verifica que el usuario puede autenticarse

## 🛠️ Solución Paso a Paso

### Paso 1: Crear Usuario Correctamente

**Opción A: Desde Supabase (Recomendado)**

1. Ve a: https://tnlkdtslqgoezfecvcbj.supabase.co
2. **Authentication** > **Users** > **Add User** > **Create new user**
3. Completa:
   - Email: `admin@test.com`
   - Password: `admin123456`
   - **Auto Confirm User**: ✅ (MUY IMPORTANTE - marca esto)
4. Click **"Create user"**
5. **Copia el User ID** (UUID) que aparece

### Paso 2: Crear Perfil

1. Ve a **SQL Editor** en Supabase
2. Ejecuta (reemplaza USER_ID con el que copiaste):

```sql
INSERT INTO perfiles (id, email, role, nombre)
VALUES (
  'USER_ID_AQUI',
  'admin@test.com',
  'admin',
  'Administrador'
);
```

### Paso 3: Probar Login

1. Ve a: http://localhost:4321
2. Usa:
   - Email: `admin@test.com`
   - Password: `admin123456`
3. Abre la consola (F12) y verifica los mensajes

## 🔧 Debug en la Consola del Navegador

Abre la consola (F12) y ejecuta:

```javascript
// Verificar variables de entorno
console.log('Supabase URL:', import.meta.env.PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'Faltante');

// Verificar sesión actual
import { supabase } from './src/utils/supabase';
const { data: { session } } = await supabase.auth.getSession();
console.log('Sesión actual:', session);
```

## ❌ Errores Comunes

### "Invalid login credentials"
- El usuario no existe O
- La contraseña es incorrecta O
- El email no está confirmado

**Solución**: Crea el usuario con "Auto Confirm User" marcado

### "relation 'perfiles' does not exist"
- Las tablas no están creadas

**Solución**: Ejecuta `supabase-setup.sql` completo

### La página se recarga pero no muestra error
- El componente React no se está montando correctamente
- El preventDefault no está funcionando

**Solución**: Ya corregido en LoginSimple.tsx (sin formulario)

## ✅ Verificación Final

Después de seguir los pasos:

1. ✅ Usuario existe en Authentication > Users
2. ✅ Email está confirmado (check verde)
3. ✅ Perfil existe en la tabla `perfiles`
4. ✅ Tablas creadas (perfiles, materiales, servicios, cotizaciones)
5. ✅ Puedes iniciar sesión sin que la página se recargue
6. ✅ Aparecen mensajes en la consola
7. ✅ Redirige a /dashboard después del login

---

**Si nada funciona**, comparte:
1. Los mensajes exactos de la consola (F12)
2. Si el usuario existe en Supabase
3. Si el perfil existe en la tabla perfiles
4. Qué error específico aparece (si hay alguno)


