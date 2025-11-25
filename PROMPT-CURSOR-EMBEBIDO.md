# 🎯 PROMPT PARA CURSOR - Catálogo Embebido

## 📋 Copia y Pega Este Prompt en Cursor:

```
Crea un componente React en src/components/CatalogoCocinasEmbebido.tsx que muestre el catálogo de cocinas directamente embebido en la página usando un iframe.

URL del catálogo: https://cotizador-app-two.vercel.app/cocinas-publico

Requisitos:
1. Nombre: CatalogoCocinasEmbebido.tsx
2. Ubicación: src/components/CatalogoCocinasEmbebido.tsx
3. Props configurables:
   - urlCotizador (string, opcional, default: https://cotizador-app-two.vercel.app/cocinas-publico)
   - altura (string, opcional, default: "800px")
   - className (string, opcional)

4. El iframe debe:
   - Ser responsive (width: 100%)
   - Tener la altura configurable
   - Tener frameBorder="0"
   - Tener allowFullScreen
   - Tener un título descriptivo

5. Diseño del contenedor:
   - Contenedor con bordes redondeados
   - Sombra suave
   - Overflow hidden para bordes limpios
   - Responsive

6. El componente debe funcionar con Astro usando client:load

Ejemplo de uso en Astro:
```astro
---
import CatalogoCocinasEmbebido from '../components/CatalogoCocinasEmbebido';
---

<CatalogoCocinasEmbebido 
  client:load
  urlCotizador="https://cotizador-app-two.vercel.app/cocinas-publico"
  altura="900px"
/>
```

Crea el componente completo con TypeScript types. Si uso Tailwind CSS, usa Tailwind. Si no, CSS inline.
```

---

## 🚀 Versión Simple:

```
Crea un componente React que muestre un iframe con el catálogo de cocinas.

URL: https://cotizador-app-two.vercel.app/cocinas-publico

El componente debe:
- Recibir props para url y altura
- Mostrar iframe responsive
- Tener diseño moderno
- Funcionar con Astro usando client:load

Dame el código completo con TypeScript.
```

