# 🔧 Solución: Error Runtime Invalid en Vercel

## ❌ Error

```
Error: The following Serverless Functions contain an invalid "runtime":
  - _render (nodejs18.x)
```

## ✅ Solución Aplicada

Se actualizó la configuración para usar Node.js 20.x:

### 1. `package.json` - Agregar `engines`
```json
{
  "engines": {
    "node": "20.x"
  }
}
```

### 2. `astro.config.mjs` - Configurar adapter
```js
adapter: vercel({
  runtime: 'nodejs20.x'
})
```

### 3. `vercel.json` - Simplificado (sin runtime)
```json
{
  "framework": "astro"
}
```

**⚠️ IMPORTANTE**: NO especifiques el runtime en `vercel.json` usando el formato `functions`. Usa `engines` en `package.json` en su lugar.

## 📋 Pasos para Aplicar

1. **Haz commit y push de los cambios**:
   ```bash
   git add astro.config.mjs vercel.json
   git commit -m "Actualizar runtime a Node.js 20.x para Vercel"
   git push
   ```

2. **En Vercel**:
   - El deployment se iniciará automáticamente
   - O ve a **Deployments** → **Redeploy**

3. **Verifica**:
   - El build debería completar sin el error de runtime
   - La aplicación debería funcionar correctamente

## ⚠️ Nota

El warning local sobre Node.js 18 es normal. Vercel usará Node.js 20.x en producción según la configuración.

## 🔍 Si el Problema Persiste

1. Verifica que `@astrojs/vercel` esté actualizado:
   ```bash
   npm install @astrojs/vercel@latest
   ```

2. Verifica la versión de Node.js en Vercel:
   - Settings → **Node.js Version**
   - Debe estar en 20.x

3. Limpia el build:
   ```bash
   rm -rf .vercel dist
   npm run build
   ```

