# 🎯 PROMPT PARA CURSOR - Integrar Catálogo de Closets

## 📋 Copia y Pega Este Prompt en Cursor:

```
Necesito integrar el catálogo de closets en mi página web Astro. El catálogo está disponible en:

URL: https://cotizador-app-two.vercel.app/closets-publico

Requisitos:
1. Crear un componente React en src/components/CatalogoClosetsEmbebido.tsx
2. El componente debe mostrar el catálogo usando un iframe
3. Props configurables:
   - urlCotizador (string, opcional, default: https://cotizador-app-two.vercel.app/closets-publico)
   - altura (string, opcional, default: "800px")
   - className (string, opcional)

4. El iframe debe:
   - Ser responsive (width: 100%)
   - Tener la altura configurable
   - Tener frameBorder="0"
   - Tener allowFullScreen
   - Tener un título descriptivo: "Catálogo de Closets"

5. Diseño del contenedor:
   - Contenedor con bordes redondeados (rounded-xl)
   - Sombra suave (shadow-lg)
   - Overflow hidden para bordes limpios
   - Responsive

6. El componente debe funcionar con Astro usando client:load

Ejemplo de uso en Astro:
```astro
---
import CatalogoClosetsEmbebido from '../components/CatalogoClosetsEmbebido';
---

<CatalogoClosetsEmbebido 
  client:load
  urlCotizador="https://cotizador-app-two.vercel.app/closets-publico"
  altura="900px"
/>
```

Crea el componente completo con TypeScript types. Si uso Tailwind CSS, usa Tailwind. Si no, CSS inline.
```

---

## 🚀 Versión Simple:

```
Crea un componente React que muestre un iframe con el catálogo de closets.

URL: https://cotizador-app-two.vercel.app/closets-publico

El componente debe:
- Recibir props para url y altura
- Mostrar iframe responsive
- Tener diseño moderno
- Funcionar con Astro usando client:load

Dame el código completo con TypeScript.
```

---

## 📦 Opciones de Integración:

### Opción 1: Iframe Embebido (Recomendado)
```astro
---
import CatalogoClosetsEmbebido from '../components/CatalogoClosetsEmbebido';
---

<CatalogoClosetsEmbebido 
  client:load
  urlCotizador="https://cotizador-app-two.vercel.app/closets-publico"
  altura="900px"
/>
```

### Opción 2: Botón que abre en nueva pestaña
```astro
---
import CotizadorClosets from '../components/CotizadorClosets';
---

<CotizadorClosets 
  client:load
  urlCotizador="https://cotizador-app-two.vercel.app/closets-publico"
  estilo="boton"
/>
```

### Opción 3: Banner con enlace
```astro
---
import CotizadorClosets from '../components/CotizadorClosets';
---

<CotizadorClosets 
  client:load
  urlCotizador="https://cotizador-app-two.vercel.app/closets-publico"
  estilo="banner"
  titulo="Diseña tu Closet Ideal"
  descripcion="Explora nuestro catálogo y cotiza tu closet personalizado"
/>
```

### Opción 4: Card con enlace
```astro
---
import CotizadorClosets from '../components/CotizadorClosets';
---

<CotizadorClosets 
  client:load
  urlCotizador="https://cotizador-app-two.vercel.app/closets-publico"
  estilo="card"
/>
```

### Opción 5: Botón flotante
```astro
---
import CotizadorClosets from '../components/CotizadorClosets';
---

<CotizadorClosets 
  client:load
  urlCotizador="https://cotizador-app-two.vercel.app/closets-publico"
  estilo="flotante"
/>
```

---

## 🔗 URLs Disponibles:

- **Catálogo de Closets**: https://cotizador-app-two.vercel.app/closets-publico
- **Iframe directo**: Usa la URL en un iframe con altura mínima de 800px

---

## ✅ Checklist de Integración:

- [ ] Componente creado en `src/components/CatalogoClosetsEmbebido.tsx`
- [ ] Props configuradas correctamente
- [ ] Iframe responsive
- [ ] Funciona con `client:load` en Astro
- [ ] Diseño moderno y limpio
- [ ] URL correcta configurada

gity