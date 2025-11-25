# 🚀 Resumen Rápido: Integrar Catálogo de Cocinas en tu Otra Web

## 📋 Pasos Rápidos (5 minutos)

### 1. Obtén la URL del Catálogo Público

Tu catálogo público está en:
```
https://tu-dominio-cotizador.vercel.app/cocinas-publico
```
(Reemplaza con tu URL real de Vercel)

### 2. Crea el Componente en tu Otra Web

Crea el archivo: `src/components/CotizadorCocinas.tsx`

```tsx
import { useState } from 'react';

interface CotizadorCocinasProps {
  urlCotizador?: string;
  titulo?: string;
  descripcion?: string;
  estilo?: 'boton' | 'banner' | 'card' | 'flotante';
  className?: string;
}

export default function CotizadorCocinas({
  urlCotizador = 'https://tu-dominio-cotizador.vercel.app/cocinas-publico',
  titulo = 'Diseña tu Cocina Ideal',
  descripcion = 'Explora nuestro catálogo y cotiza tu cocina personalizada',
  estilo = 'banner',
  className = ''
}: CotizadorCocinasProps) {
  
  // Botón simple
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

  // Card con imagen
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

  // Botón flotante
  if (estilo === 'flotante') {
    return (
      <a
        href={urlCotizador}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 ${className}`}
      >
        <span className="text-2xl">🍳</span>
        <span className="hidden sm:inline">Cotizar Cocina</span>
      </a>
    );
  }

  // Banner (por defecto)
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

### 3. Úsalo en Cualquier Página Astro

```astro
---
// src/pages/cualquier-pagina.astro
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<CotizadorCocinas 
  client:load
  urlCotizador="https://tu-dominio-cotizador.vercel.app/cocinas-publico"
  estilo="banner"
/>
```

## 🎨 Estilos Disponibles

- `estilo="boton"` - Botón simple
- `estilo="banner"` - Banner completo (recomendado)
- `estilo="card"` - Card con imagen
- `estilo="flotante"` - Botón flotante en esquina

## 📝 Ejemplos de Uso

### En la Página Principal:
```astro
---
import Layout from '../components/Layout.astro';
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<Layout title="Inicio">
  <main>
    <!-- Tu contenido -->
    
    <CotizadorCocinas 
      client:load
      urlCotizador="https://tu-dominio-cotizador.vercel.app/cocinas-publico"
      estilo="banner"
    />
  </main>
</Layout>
```

### Botón Simple:
```astro
---
import CotizadorCocinas from '../components/CotizadorCocinas';
---

<div class="text-center">
  <CotizadorCocinas 
    client:load
    estilo="boton"
  />
</div>
```

### Botón Flotante (en Layout):
```astro
---
// src/components/Layout.astro
import CotizadorCocinas from './CotizadorCocinas';
---

<html>
  <body>
    <slot />
    
    <CotizadorCocinas 
      client:load
      estilo="flotante"
      urlCotizador="https://tu-dominio-cotizador.vercel.app/cocinas-publico"
    />
  </body>
</html>
```

## ✅ Checklist

- [ ] Componente creado en `src/components/CotizadorCocinas.tsx`
- [ ] URL actualizada con tu dominio real de Vercel
- [ ] Probado en una página Astro
- [ ] Funciona correctamente
- [ ] Responsive en móvil y desktop

## 🔗 URL a Configurar

Reemplaza en el componente:
```
https://tu-dominio-cotizador.vercel.app/cocinas-publico
```

Por tu URL real del cotizador en Vercel.

## 🆘 Si No Funciona

1. Verifica que React esté configurado en Astro
2. Verifica que uses `client:load` en el componente
3. Revisa la consola del navegador por errores
4. Verifica que la URL del catálogo sea correcta y accesible

## 📚 Documentación Completa

Para más detalles, revisa:
- `INSTRUCCIONES-RAPIDAS-ASTRO.md` - Guía rápida
- `INTEGRACION-ASTRO-REACT.md` - Guía completa
- `EJEMPLOS-ASTRO.md` - Más ejemplos

