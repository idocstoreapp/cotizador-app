# Debug del Problema de Login

## 🔍 Pasos para Diagnosticar

### 1. Abre la Consola del Navegador

1. Presiona **F12** en tu navegador
2. Ve a la pestaña **"Console"**
3. Intenta iniciar sesión
4. Revisa los mensajes que aparecen

### 2. Verifica en Supabase

1. Ve a: https://tnlkdtslqgoezfecvcbj.supabase.co
2. Ve a **"Authentication"** > **"Users"**
3. Verifica que el usuario existe
4. Verifica que el email esté confirmado (debe tener un check verde)

### 3. Verifica la Tabla de Perfiles

1. En Supabase, ve a **"SQL Editor"**
2. Ejecuta este query:

```sql
SELECT * FROM perfiles;
```

3. Verifica que existe un perfil con el email que estás usando

### 4. Verifica las Políticas RLS

1. En Supabase, ve a **"Authentication"** > **"Policies"**
2. Verifica que las políticas de la tabla `perfiles` estén activas

## ❌ Errores Comunes y Soluciones

### Error: "Invalid login credentials"

**Causa**: Email o contraseña incorrectos

**Solución**:
1. Verifica que el email sea exactamente el mismo (mayúsculas/minúsculas)
2. Verifica que la contraseña sea correcta
3. Si olvidaste la contraseña, puedes resetearla desde Supabase

### Error: "Email not confirmed"

**Causa**: El email no ha sido confirmado

**Solución**:
1. Revisa tu correo (incluida la carpeta de spam)
2. Haz clic en el enlace de confirmación
3. O crea el usuario con "Auto Confirm User" marcado en Supabase

### Error: "User not found"

**Causa**: El usuario no existe en Supabase Auth

**Solución**:
1. Crea el usuario desde la aplicación (registro)
2. O créalo manualmente en Supabase Dashboard

### La página se recarga pero no muestra error

**Causa**: Puede ser un problema de redirección o de sesión

**Solución**:
1. Abre la consola del navegador (F12)
2. Revisa si hay errores en la consola
3. Verifica en la pestaña "Network" si hay requests fallidos
4. Intenta limpiar las cookies del sitio

## 🧪 Test Rápido

Ejecuta esto en la consola del navegador (F12 > Console) después de intentar login:

```javascript
// Verificar si hay sesión
localStorage.getItem('sb-tnlkdtslqgoezfecvcbj-auth-token')

// Ver todas las variables de localStorage
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key));
});
```

## 📝 Crear Usuario de Prueba Directamente

Si nada funciona, crea un usuario directamente en Supabase:

1. Ve a: https://tnlkdtslqgoezfecvcbj.supabase.co
2. **Authentication** > **Users** > **Add User** > **Create new user**
3. Completa:
   - Email: `test@test.com`
   - Password: `test123456`
   - **Auto Confirm User**: ✅ (MUY IMPORTANTE)
4. Click en **"Create user"**
5. Copia el **User ID** (UUID)
6. Ve a **SQL Editor** y ejecuta:

```sql
INSERT INTO perfiles (id, email, role, nombre)
VALUES (
  'PEGA_EL_USER_ID_AQUI',
  'test@test.com',
  'admin',
  'Usuario de Prueba'
);
```

7. Intenta iniciar sesión con:
   - Email: `test@test.com`
   - Contraseña: `test123456`

## 🔧 Si Nada Funciona

1. **Limpia el caché del navegador**: Ctrl+Shift+Delete
2. **Limpia las cookies del sitio**
3. **Reinicia el servidor**: Detén y vuelve a ejecutar `npm run dev`
4. **Verifica que las tablas existan**: Ejecuta el script `supabase-setup.sql` nuevamente

---

**Comparte los mensajes de la consola del navegador** si el problema persiste.


