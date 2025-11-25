# 🔗 Integración en Página Astro + React

## 📦 Opción 1: Componente React Reutilizable (RECOMENDADO)

Crea este componente en tu otra página web Astro:

### Archivo: `src/components/CotizadorCocinas.tsx`

```tsx
import { useState } from 'react';

interface CotizadorCocinasProps {
  urlCotizador?: string;
  titulo?: string;
  descripcion?: string;
  estilo?: 'boton' | 'banner' | 'card';
  className?: string;
}

export default function CotizadorCocinas({
  urlCotizador = 'https://tu-dominio-cotizador.com/cocinas-publico',
  titulo = 'Diseña tu Cocina Ideal',
  descripcion = 'Explora nuestro catálogo y cotiza tu cocina personalizada',
  estilo = 'banner',
  className = ''
}: CotizadorCocinasProps) {
  
  if (estilo === 'boton') {
    return (
      <a
        href={urlCotizador}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors ${className}`}
      >
        🍳 Cotizar Cocina
      </a>
    );
  }

  if (estilo === 'card') {
    return (
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden max-w-md ${className}`}>
        <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-6xl">🍳</span>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{titulo}</h3>
          <p className="text-gray-600 mb-4">{descripcion}</p>
          <a
            href={urlCotizador}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ver Catálogo →
          </a>
        </div>
      </div>
    );
  }

  // Estilo banner (por defecto)
  return (
    <section className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-4 ${className}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{titulo}</h2>
        <p className="text-xl mb-8 opacity-90">{descripcion}</p>
        <a
          href={urlCotizador}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition-colors text-lg"
        >
          Ver Catálogo de Cocinas →
        </a>
      </div>
    </section>
  );
}
```

### Uso en Página Astro:

```astro
---
// src/pages/cocinas.astro
import Layout from '../components/Layout.astro';
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<Layout title="Cocinas">
  <CotizadorCocinas 
    client:load
    urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
    estilo="banner"
  />
</Layout>
```

---

## 📦 Opción 2: Iframe Embebido

### Componente React:

```tsx
// src/components/CotizadorCocinasIframe.tsx
interface CotizadorCocinasIframeProps {
  urlCotizador?: string;
  altura?: string;
  className?: string;
}

export default function CotizadorCocinasIframe({
  urlCotizador = 'https://tu-dominio-cotizador.com/cocinas-publico',
  altura = '800px',
  className = ''
}: CotizadorCocinasIframeProps) {
  return (
    <div className={`w-full rounded-xl overflow-hidden shadow-lg ${className}`}>
      <iframe
        src={urlCotizador}
        width="100%"
        height={altura}
        frameBorder="0"
        className="border-0"
        title="Catálogo de Cocinas"
        allowFullScreen
      />
    </div>
  );
}
```

### Uso:

```astro
---
import CotizadorCocinasIframe from '../components/CotizadorCocinasIframe';
---

<CotizadorCocinasIframe 
  client:load
  urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
  altura="900px"
/>
```

---

## 📦 Opción 3: Botón Flotante

### Componente:

```tsx
// src/components/CotizadorCocinasFlotante.tsx
export default function CotizadorCocinasFlotante({
  urlCotizador = 'https://tu-dominio-cotizador.com/cocinas-publico'
}: { urlCotizador?: string }) {
  return (
    <a
      href={urlCotizador}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
    >
      <span className="text-2xl">🍳</span>
      <span className="hidden sm:inline">Cotizar Cocina</span>
    </a>
  );
}
```

### Uso en Layout:

```astro
---
// src/components/Layout.astro
import CotizadorCocinasFlotante from './CotizadorCocinasFlotante';
---

<html>
  <body>
    <slot />
    <CotizadorCocinasFlotante 
      client:load
      urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
    />
  </body>
</html>
```

---

## 🎨 Con Tailwind CSS (Si lo usas)

Si tu proyecto Astro usa Tailwind, los componentes anteriores ya están listos.

Si NO usas Tailwind, aquí está la versión con CSS inline:

### Versión sin Tailwind:

```tsx
// src/components/CotizadorCocinas.tsx
export default function CotizadorCocinas({
  urlCotizador = 'https://tu-dominio-cotizador.com/cocinas-publico'
}: { urlCotizador?: string }) {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '60px 20px',
      textAlign: 'center'
    }}>
      <h2 style={{ fontSize: '2.5em', marginBottom: '15px' }}>
        Diseña tu Cocina Ideal
      </h2>
      <p style={{ fontSize: '1.2em', marginBottom: '30px', opacity: 0.9 }}>
        Explora nuestro catálogo y cotiza tu cocina personalizada
      </p>
      <a
        href={urlCotizador}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          padding: '15px 30px',
          background: 'white',
          color: '#667eea',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '1.1em'
        }}
      >
        Ver Catálogo de Cocinas →
      </a>
    </section>
  );
}
```

---

## 📝 Instalación de Dependencias (Si es necesario)

Si tu proyecto Astro ya tiene React configurado, no necesitas instalar nada.

Si no, asegúrate de tener:

```bash
npm install react react-dom @astro/react
```

Y en `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import react from '@astro/react';

export default defineConfig({
  integrations: [react()]
});
```

---

## 🚀 Ejemplos de Uso en Diferentes Páginas

### En la Página Principal (Home):

```astro
---
// src/pages/index.astro
import Layout from '../components/Layout.astro';
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<Layout title="Inicio">
  <main>
    <!-- Tu contenido existente -->
    
    <CotizadorCocinas 
      client:load
      urlCotizador="https://tu-dominio-cotizador.com/cocinas-publico"
      estilo="banner"
    />
  </main>
</Layout>
```

### En Página de Servicios:

```astro
---
// src/pages/servicios.astro
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<section>
  <h1>Nuestros Servicios</h1>
  
  <!-- Otros servicios -->
  
  <CotizadorCocinas 
    client:load
    estilo="card"
    titulo="Cocinas Personalizadas"
    descripcion="Diseña tu cocina ideal con nuestro cotizador interactivo"
  />
</section>
```

### Botón Simple en Cualquier Lugar:

```astro
---
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<div>
  <CotizadorCocinas 
    client:load
    estilo="boton"
    className="mt-8"
  />
</div>
```

---

## 🎯 Recomendación

**Usa la Opción 1 (Componente React)** porque:
- ✅ Reutilizable en cualquier página
- ✅ Fácil de personalizar
- ✅ Múltiples estilos (botón, banner, card)
- ✅ Funciona perfectamente con Astro
- ✅ Responsive por defecto

