# 🚀 Guía de Despliegue en Vercel

## ✅ Configuración Completada

El proyecto ya está configurado para Vercel con:
- ✅ Adapter de Vercel instalado (`@astrojs/vercel`)
- ✅ Configuración de Astro actualizada
- ✅ Archivo `vercel.json` creado

## 📋 Pasos para Desplegar

### 1. Conectar Repositorio a Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New Project"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `cotizador-app`

### 2. Configurar Variables de Entorno

**⚠️ IMPORTANTE**: Debes agregar las variables de entorno en Vercel:

1. En la configuración del proyecto en Vercel, ve a **Settings** → **Environment Variables**
2. Agrega las siguientes variables:

```
PUBLIC_SUPABASE_URL=tu_url_de_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_public
```

3. Asegúrate de que estén disponibles para:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### 3. Configuración del Proyecto

Vercel debería detectar automáticamente:
- **Framework Preset**: Astro
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Si no se detecta automáticamente, configura manualmente:
- **Framework**: Astro
- **Root Directory**: `./` (raíz del proyecto)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que termine el build
3. Tu aplicación estará disponible en `https://tu-proyecto.vercel.app`

## 🔧 Solución de Problemas

### Error 404 Not Found

Si obtienes un error 404 después del despliegue:

1. **Verifica las variables de entorno**:
   - Asegúrate de que `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` estén configuradas
   - Verifica que los valores sean correctos (sin espacios extra)

2. **Verifica los logs de build**:
   - Ve a **Deployments** → Selecciona el deployment → **Logs**
   - Busca errores durante el build

3. **Verifica la configuración**:
   - Asegúrate de que `astro.config.mjs` use `@astrojs/vercel/serverless`
   - Verifica que `vercel.json` existe en la raíz

### Error: "Cannot find module"

Si ves errores de módulos no encontrados:

1. Verifica que todas las dependencias estén en `package.json`
2. Asegúrate de que `node_modules` no esté en `.gitignore` (no debería estar)
3. Vercel instalará las dependencias automáticamente

### Error: "Adapter not found"

Si ves errores sobre el adapter:

1. Verifica que `@astrojs/vercel` esté en `package.json`
2. Verifica que `astro.config.mjs` importe correctamente el adapter:
   ```js
   import vercel from '@astrojs/vercel/serverless';
   ```

## 📝 Archivos Importantes

### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "astro",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

### `astro.config.mjs`
```js
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // ...
});
```

## 🔄 Actualizaciones Futuras

Cada vez que hagas push a la rama principal:
- Vercel detectará los cambios automáticamente
- Creará un nuevo deployment
- Si el build es exitoso, actualizará la URL de producción

## 🌐 URLs

Después del despliegue tendrás:
- **Producción**: `https://tu-proyecto.vercel.app`
- **Preview**: `https://tu-proyecto-git-rama.vercel.app` (para cada PR)
- **Development**: `https://tu-proyecto-git-dev.vercel.app` (si tienes rama dev)

## ✅ Checklist de Despliegue

Antes de desplegar, verifica:

- [ ] Variables de entorno configuradas en Vercel
- [ ] `@astrojs/vercel` instalado
- [ ] `astro.config.mjs` usa el adapter de Vercel
- [ ] `vercel.json` existe en la raíz
- [ ] El proyecto se construye localmente (`npm run build`)
- [ ] No hay errores en los logs de build

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs de build en Vercel
2. Verifica la [documentación de Astro + Vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/)
3. Revisa los [foros de Vercel](https://github.com/vercel/vercel/discussions)

