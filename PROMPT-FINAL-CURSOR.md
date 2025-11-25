# 🎯 PROMPT FINAL PARA CURSOR - Astro + React

## Copia y Pega Este Prompt en Cursor:

```
Necesito crear un componente React reutilizable en mi proyecto Astro para integrar un catálogo de cocinas desde otra aplicación.

URL del catálogo: https://tu-dominio-cotizador.com/cocinas-publico

Requisitos del componente:
1. Nombre: CotizadorCocinas.tsx
2. Ubicación: src/components/CotizadorCocinas.tsx
3. Props configurables:
   - urlCotizador (string, opcional, default: URL del catálogo)
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
  urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
  estilo="banner"
  titulo="Diseña tu Cocina Ideal"
/>
```

Crea el componente completo, funcional y listo para usar. Incluye TypeScript types si es posible.
```

---

## 🚀 Versión Ultra Simple:

```
Crea un componente React en src/components/CotizadorCocinas.tsx que muestre un botón o banner para redirigir a un catálogo de cocinas.

URL: https://tu-dominio-cotizador.com/cocinas-publico

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

## 📋 Checklist de Integración

Después de que Cursor cree el componente:

1. ✅ Verifica que el componente esté en `src/components/CotizadorCocinas.tsx`
2. ✅ Reemplaza la URL por defecto con tu URL real del cotizador
3. ✅ Prueba en una página Astro:
   ```astro
   ---
   import CotizadorCocinas from '../components/CotizadorCocinas';
   ---
   
   <CotizadorCocinas client:load estilo="banner" />
   ```
4. ✅ Verifica que funcione correctamente
5. ✅ Personaliza colores y textos según tu marca

---

## 🎨 Personalización Rápida

Si quieres cambiar colores, edita estos valores en el componente:

- **Color principal**: `#4F46E5` (indigo) → Cambia por tu color
- **Gradiente banner**: `#667eea` a `#764ba2` → Cambia por tus colores
- **Texto**: Personaliza los textos por defecto

