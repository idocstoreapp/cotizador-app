# 🔧 Solución Error 404 en Vercel

## 📋 Diagnóstico

Si el build log se corta después de `astro build`, puede ser que:
1. El build esté completando pero no muestre todo el output
2. Haya un error que no se está mostrando
3. Falten variables de entorno

## ✅ Pasos para Resolver

### 1. Verificar Variables de Entorno en Vercel

**CRÍTICO**: Las variables de entorno deben estar configuradas:

1. Ve a tu proyecto en Vercel
2. Settings → **Environment Variables**
3. Agrega estas variables (si no están):
   ```
   PUBLIC_SUPABASE_URL=tu_url_completa
   PUBLIC_SUPABASE_ANON_KEY=tu_clave_completa
   ```
4. Asegúrate de que estén marcadas para:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

### 2. Verificar el Build Completo

En Vercel:
1. Ve a **Deployments**
2. Haz clic en el deployment más reciente
3. Revisa la pestaña **Logs** completa (no solo el resumen)
4. Busca errores en rojo

### 3. Verificar la Configuración del Proyecto

En Vercel → Settings → General:
- **Framework Preset**: Astro (o Auto-detect)
- **Build Command**: `npm run build`
- **Output Directory**: `dist` (o `.vercel/output` si usas adapter)
- **Install Command**: `npm install`
- **Root Directory**: `./` (raíz del proyecto)

### 4. Verificar Node.js Version

Vercel usa Node.js 18.x por defecto. Si tu proyecto requiere otra versión:

1. Ve a Settings → **Node.js Version**
2. Selecciona la versión (18.x, 20.x, etc.)
3. O crea un archivo `.nvmrc` en la raíz:
   ```
   18
   ```

### 5. Verificar Rutas

El error 404 puede ser porque:
- La ruta `/` no existe o no está configurada
- Hay un problema con el adapter de Vercel

**Verifica que `src/pages/index.astro` existe**

### 6. Re-desplegar

Después de hacer cambios:
1. Haz un nuevo commit y push
2. O en Vercel: **Deployments** → **Redeploy**

## 🔍 Errores Comunes

### Error: "Cannot find module"
**Solución**: Verifica que todas las dependencias estén en `package.json`

### Error: "PUBLIC_SUPABASE_URL is not defined"
**Solución**: Agrega las variables de entorno en Vercel (paso 1)

### Error: "404 Not Found" en todas las rutas
**Solución**: 
1. Verifica que `astro.config.mjs` use `@astrojs/vercel/serverless`
2. Verifica que `vercel.json` existe
3. Verifica que el build se completó exitosamente

### Build se corta sin mostrar errores
**Solución**:
1. Revisa los logs completos (no solo el resumen)
2. Verifica que el build local funciona: `npm run build`
3. Verifica que no hay errores de TypeScript: `npm run build` localmente

## 📝 Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] Variables de entorno configuradas en Vercel
- [ ] Build local funciona: `npm run build`
- [ ] `astro.config.mjs` usa `@astrojs/vercel/serverless`
- [ ] `vercel.json` existe en la raíz
- [ ] `src/pages/index.astro` existe
- [ ] No hay errores en los logs completos de Vercel
- [ ] Node.js version configurada correctamente

## 🆘 Si el Problema Persiste

1. **Comparte el log completo de build** (no solo el resumen)
2. **Comparte la URL de tu deployment** en Vercel
3. **Verifica que el build local funciona**:
   ```bash
   npm run build
   npm run preview
   ```

## 🔄 Alternativa: Usar Output Static

Si el problema persiste con serverless, puedes intentar con output estático:

1. Cambia `astro.config.mjs`:
   ```js
   export default defineConfig({
     output: 'static', // En lugar de 'server'
     // adapter: vercel(), // Comentar o eliminar
   });
   ```

2. Esto generará un sitio estático (sin SSR)
3. Las rutas API no funcionarán, pero el sitio básico sí

**Nota**: Esto es solo una solución temporal. Para funcionalidad completa, necesitas el adapter de Vercel.

