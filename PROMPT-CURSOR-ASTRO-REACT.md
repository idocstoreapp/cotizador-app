# 🎯 Prompt para Cursor - Integración Astro + React

## PROMPT COMPLETO (Copia y Pega):

```
Necesito crear un componente React reutilizable en mi proyecto Astro para integrar un catálogo de cocinas.

El catálogo está en: https://tu-dominio-cotizador.com/cocinas-publico

Requisitos:
1. Crear un componente React llamado `CotizadorCocinas.tsx`
2. El componente debe tener 3 variantes de estilo:
   - "boton": Botón simple con link
   - "banner": Banner completo con título, descripción y botón
   - "card": Card con imagen/icono, título, descripción y botón
3. Props configurables:
   - urlCotizador (string, opcional, default: URL del catálogo)
   - titulo (string, opcional)
   - descripcion (string, opcional)
   - estilo ('boton' | 'banner' | 'card', opcional, default: 'banner')
   - className (string, opcional, para estilos adicionales)
4. El link debe abrir en nueva pestaña (target="_blank" rel="noopener noreferrer")
5. Diseño moderno y responsive
6. Si uso Tailwind CSS, usar clases de Tailwind
7. Si NO uso Tailwind, usar CSS inline o styled-components

El componente debe ser fácil de usar en cualquier página Astro así:
```astro
---
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<CotizadorCocinas client:load estilo="banner" />
```

Crea el componente completo y funcional.
```

---

## PROMPT ALTERNATIVO (Más Simple):

```
Crea un componente React en mi proyecto Astro que muestre un botón o banner para redirigir a un catálogo de cocinas.

URL: https://tu-dominio-cotizador.com/cocinas-publico

El componente debe:
- Ser reutilizable
- Tener diseño moderno
- Abrir en nueva pestaña
- Ser responsive
- Funcionar con Astro usando client:load

Si uso Tailwind, usa Tailwind. Si no, usa CSS inline.

Dame el código completo del componente.
```

---

## PROMPT PARA IFRAME:

```
Crea un componente React en mi proyecto Astro que muestre un iframe embebido con un catálogo de cocinas.

URL: https://tu-dominio-cotizador.com/cocinas-publico

El componente debe:
- Ser responsive
- Tener altura configurable
- Funcionar con Astro usando client:load
- Tener diseño moderno con bordes redondeados y sombra

Crea el componente completo.
```

---

## PROMPT PARA BOTÓN FLOTANTE:

```
Crea un componente React para un botón flotante que redirija a un catálogo de cocinas.

URL: https://tu-dominio-cotizador.com/cocinas-publico

El botón debe:
- Estar fijo en la esquina inferior derecha
- Tener diseño moderno (puede ser circular o con forma de píldora)
- Mostrar icono de cocina (🍳) y texto
- Ocultar texto en móvil, solo mostrar icono
- Abrir en nueva pestaña
- Tener z-index alto para estar siempre visible
- Funcionar con Astro usando client:load

Crea el componente completo.
```

