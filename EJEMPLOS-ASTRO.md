# 📝 Ejemplos de Uso en Astro

## Ejemplo 1: Página Principal con Banner

```astro
---
// src/pages/index.astro
import Layout from '../components/Layout.astro';
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<Layout title="Inicio">
  <main>
    <section>
      <h1>Bienvenido</h1>
      <p>Contenido de tu página...</p>
    </section>

    <!-- Banner de Cotizador -->
    <CotizadorCocinas 
      client:load
      urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
      estilo="banner"
      titulo="Diseña tu Cocina Ideal"
      descripcion="Explora nuestro catálogo y cotiza tu cocina personalizada"
    />
  </main>
</Layout>
```

## Ejemplo 2: Página de Servicios con Card

```astro
---
// src/pages/servicios.astro
import Layout from '../components/Layout.astro';
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<Layout title="Servicios">
  <main>
    <h1>Nuestros Servicios</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Otros servicios -->
      
      <CotizadorCocinas 
        client:load
        urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
        estilo="card"
        titulo="Cocinas Personalizadas"
        descripcion="Diseña tu cocina ideal con nuestro cotizador interactivo"
      />
    </div>
  </main>
</Layout>
```

## Ejemplo 3: Botón Simple en Cualquier Lugar

```astro
---
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<div class="text-center my-8">
  <p>¿Listo para comenzar?</p>
  <CotizadorCocinas 
    client:load
    estilo="boton"
  />
</div>
```

## Ejemplo 4: Iframe Embebido

```astro
---
import { CotizadorCocinasIframe } from '../components/CotizadorCocinas';
---

<section>
  <h2>Catálogo de Cocinas</h2>
  <CotizadorCocinasIframe 
    client:load
    urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
    altura="900px"
  />
</section>
```

## Ejemplo 5: Botón Flotante en Layout

```astro
---
// src/components/Layout.astro
import CotizadorCocinas from './CotizadorCocinas';
---

<html>
  <head>
    <title>{title}</title>
  </head>
  <body>
    <slot />
    
    <!-- Botón flotante siempre visible -->
    <CotizadorCocinas 
      client:load
      estilo="flotante"
      urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
    />
  </body>
</html>
```

## Ejemplo 6: Múltiples Estilos en una Página

```astro
---
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<main>
  <!-- Banner al inicio -->
  <CotizadorCocinas 
    client:load
    estilo="banner"
  />

  <!-- Contenido -->
  <section>
    <h2>Nuestras Cocinas</h2>
    <p>Contenido...</p>
  </section>

  <!-- Card en el medio -->
  <CotizadorCocinas 
    client:load
    estilo="card"
    className="mx-auto my-12"
  />

  <!-- Botón al final -->
  <div class="text-center my-8">
    <CotizadorCocinas 
      client:load
      estilo="boton"
    />
  </div>
</main>
```

## Ejemplo 7: Con Variables de Entorno

```astro
---
// src/pages/cocinas.astro
import CotizadorCocinas from '../components/CotizadorCocinas';

const URL_COTIZADOR = import.meta.env.PUBLIC_URL_COTIZADOR || 'https://tu-dominio-cotizador.com/cocinas-publico';
---

<CotizadorCocinas 
  client:load
  urlCotizador={URL_COTIZADOR}
  estilo="banner"
/>
```

## Configuración de Variables de Entorno

En `.env`:

```env
PUBLIC_URL_COTIZADOR=https://tu-dominio-cotizador.com/cocinas-publico
```

