# 🎯 PROMPT LISTO PARA COPIAR Y PEGAR EN CURSOR

## 📋 Copia Todo Este Texto y Pégalo en Cursor:

```
Necesito crear un componente React reutilizable en mi proyecto Astro para integrar un catálogo de cocinas desde otra aplicación.

URL del catálogo: https://cotizador-app-two.vercel.app/cocinas-publico

Requisitos del componente:
1. Nombre: CotizadorCocinas.tsx
2. Ubicación: src/components/CotizadorCocinas.tsx
3. Props configurables:
   - urlCotizador (string, opcional, default: https://cotizador-app-two.vercel.app/cocinas-publico)
   - titulo (string, opcional, default: "Diseña tu Cocina Ideal")
   - descripcion (string, opcional)
   - estilo ('boton' | 'banner' | 'card' | 'flotante', opcional, default: 'banner')
   - className (string, opcional)

4. Estilos disponibles:
   - "boton": Botón simple con link que abre en nueva pestaña
   - "banner": Banner completo con gradiente, título, descripción y botón CTA
   - "card": Card con imagen/icono, título, descripción y botón
   - "flotante": Botón fijo en esquina inferior derecha (solo icono en móvil, icono+texto en desktop)

5. El link debe:
   - Abrir en nueva pestaña (target="_blank")
   - Tener rel="noopener noreferrer" por seguridad
   - Ser responsive

6. Diseño:
   - Moderno y atractivo
   - Usar gradientes y sombras
   - Efectos hover suaves
   - Si uso Tailwind CSS, usar clases de Tailwind
   - Si NO uso Tailwind, usar CSS inline con estilos en objetos

7. El componente debe funcionar con Astro usando client:load

Ejemplo de uso en Astro:
```astro
---
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<CotizadorCocinas 
  client:load
  urlCotizador="https://cotizador-app-two.vercel.app/cocinas-publico"
  estilo="banner"
  titulo="Diseña tu Cocina Ideal"
/>
```

Crea el componente completo, funcional y listo para usar. Incluye TypeScript types si es posible.
```

---

## 🚀 Versión Ultra Simple (Si Prefieres):

```
Crea un componente React en src/components/CotizadorCocinas.tsx que muestre un botón o banner para redirigir a un catálogo de cocinas.

URL: https://cotizador-app-two.vercel.app/cocinas-publico

El componente debe:
- Tener props para personalizar (url, título, estilo)
- Abrir en nueva pestaña
- Ser responsive
- Funcionar con Astro usando client:load
- Tener diseño moderno

Si uso Tailwind, usa Tailwind. Si no, CSS inline.

Dame el código completo.
```

---

## ✅ Después de Pegar el Prompt:

1. Cursor generará el componente automáticamente
2. Verifica que esté en `src/components/CotizadorCocinas.tsx`
3. Úsalo en cualquier página Astro con `client:load`
4. ¡Listo! 🎉

