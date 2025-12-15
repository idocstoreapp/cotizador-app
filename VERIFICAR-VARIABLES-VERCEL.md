# 🔍 Verificar Variables de Entorno en Vercel

## Problema
Error 500: "Configuración del servidor incorrecta" al crear vendedores/trabajadores en producción.

## Solución

### 1. Verificar Variables en Vercel Dashboard

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com)
2. Navega a **Settings** → **Environment Variables**
3. Verifica que estas variables estén configuradas:

```
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_public
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_secreta
```

### 2. Importante: Nombres Exactos

- ✅ `PUBLIC_SUPABASE_URL` (con `PUBLIC_`)
- ✅ `PUBLIC_SUPABASE_ANON_KEY` (con `PUBLIC_`)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (SIN `PUBLIC_` - es privada)

### 3. Verificar Ambientes

Asegúrate de que las variables estén configuradas para:
- ✅ **Production**
- ✅ **Preview** (opcional pero recomendado)
- ✅ **Development** (opcional)

### 4. Rebuild Después de Cambios

**IMPORTANTE**: Después de agregar o modificar variables de entorno en Vercel:

1. Ve a **Deployments**
2. Haz clic en los **3 puntos** del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo push al repositorio

### 5. Verificar en Logs

Si el error persiste, revisa los logs del servidor:

1. Ve a **Deployments**
2. Haz clic en el último deployment
3. Ve a la pestaña **Functions**
4. Busca errores relacionados con variables de entorno

### 6. Obtener Service Role Key

La `SUPABASE_SERVICE_ROLE_KEY` es una clave secreta:

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Navega a **Settings** → **API**
3. Busca **service_role** key (NO la anon key)
4. **⚠️ ADVERTENCIA**: Esta clave es SECRETA, nunca la expongas en el cliente

### 7. Verificar que la Variable se Está Leyendo

El código ahora incluye logging mejorado. Si el error persiste, los logs mostrarán:
- Qué variables están disponibles
- Qué variables faltan
- Desde dónde se están leyendo (process.env vs import.meta.env)

### 8. Solución Alternativa (Si Nada Funciona)

Si después de verificar todo lo anterior el problema persiste, puedes:

1. Verificar que el nombre de la variable en Vercel sea exactamente `SUPABASE_SERVICE_ROLE_KEY`
2. Intentar agregar también `PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (aunque no es recomendado por seguridad)
3. Contactar soporte de Vercel con los logs del servidor

## Checklist

- [ ] Variables configuradas en Vercel Dashboard
- [ ] Nombres exactos (sin espacios, sin typos)
- [ ] Variables configuradas para Production
- [ ] Rebuild/Redeploy después de cambios
- [ ] Service Role Key es la correcta (no la anon key)
- [ ] Revisar logs del servidor para más detalles

