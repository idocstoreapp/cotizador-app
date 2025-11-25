# 🔗 Integrar Catálogo de Cocinas en Otra Página Web

## 📋 Opciones de Integración

Tienes 3 opciones para integrar el catálogo de cocinas en tu otra página web:

### Opción 1: Link Directo (Más Simple) ⭐ RECOMENDADO
Simplemente agrega un botón o link que redirija a tu catálogo público.

### Opción 2: Iframe (Embebido)
Muestra el catálogo dentro de tu página web usando un iframe.

### Opción 3: Código Embebido (Avanzado)
Integra los componentes directamente en tu otra web (requiere más configuración).

---

## 🚀 Opción 1: Link Directo (RECOMENDADO)

### HTML Simple

```html
<!-- Botón para ir al catálogo -->
<a href="https://tu-dominio-cotizador.com/cocinas-publico" 
   target="_blank"
   class="btn-cotizar-cocina">
  🍳 Cotizar Cocina
</a>
```

### Ejemplo con Estilos

```html
<a href="https://tu-dominio-cotizador.com/cocinas-publico" 
   target="_blank"
   style="display: inline-block; 
          padding: 12px 24px; 
          background: #4F46E5; 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: bold;
          transition: background 0.3s;">
  🍳 Cotizar tu Cocina
</a>
```

### Botón con Imagen

```html
<a href="https://tu-dominio-cotizador.com/cocinas-publico" target="_blank">
  <img src="boton-cotizar-cocina.png" alt="Cotizar Cocina" />
</a>
```

---

## 🖼️ Opción 2: Iframe (Embebido)

### HTML Básico

```html
<iframe 
  src="https://tu-dominio-cotizador.com/cocinas-publico" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</iframe>
```

### Iframe Responsive

```html
<div style="position: relative; padding-bottom: 100%; height: 0; overflow: hidden;">
  <iframe 
    src="https://tu-dominio-cotizador.com/cocinas-publico" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    allowfullscreen>
  </iframe>
</div>
```

### Con CSS Moderno

```html
<div class="cotizador-container">
  <iframe 
    src="https://tu-dominio-cotizador.com/cocinas-publico" 
    class="cotizador-iframe"
    title="Catálogo de Cocinas">
  </iframe>
</div>

<style>
.cotizador-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.cotizador-iframe {
  width: 100%;
  height: 800px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}
</style>
```

---

## 💻 Opción 3: Código Embebido (Avanzado)

Si tu otra web también usa React, puedes importar los componentes directamente.

### Instalación de Dependencias

```bash
npm install @tanstack/react-query zustand
```

### Uso del Componente

```tsx
import CatalogoCocinasPublico from 'ruta-al-cotizador/src/components/public/CatalogoCocinasPublico';

function MiPaginaWeb() {
  return (
    <div>
      <h1>Mi Página Web</h1>
      <CatalogoCocinasPublico />
    </div>
  );
}
```

---

## 🎨 Ejemplos de Integración Visual

### Banner con Botón

```html
<section class="banner-cocinas">
  <div class="container">
    <h2>Diseña tu Cocina Ideal</h2>
    <p>Explora nuestro catálogo y cotiza tu cocina personalizada</p>
    <a href="https://tu-dominio-cotizador.com/cocinas-publico" 
       target="_blank"
       class="btn-primary">
      Ver Catálogo de Cocinas →
    </a>
  </div>
</section>

<style>
.banner-cocinas {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 20px;
  text-align: center;
}

.btn-primary {
  display: inline-block;
  padding: 15px 30px;
  background: white;
  color: #667eea;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  margin-top: 20px;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: scale(1.05);
}
</style>
```

### Sección en Página de Servicios

```html
<section id="cotizar-cocina">
  <div class="container">
    <h2>Cotiza tu Cocina</h2>
    <p>Selecciona el diseño, materiales y acabados que más te gusten</p>
    
    <!-- Iframe embebido -->
    <div class="cotizador-wrapper">
      <iframe 
        src="https://tu-dominio-cotizador.com/cocinas-publico" 
        width="100%" 
        height="900px" 
        frameborder="0">
      </iframe>
    </div>
  </div>
</section>
```

---

## 🔧 Configuración del Dominio

### 1. Configurar CORS (Si es necesario)

Si tu otra web está en un dominio diferente, asegúrate de que Supabase permita las peticiones:

1. Ve a Supabase Dashboard
2. Settings > API
3. Agrega tu dominio a "Allowed Origins" si es necesario

### 2. Variables de Entorno

Si usas iframe o código embebido, asegúrate de que las variables de entorno estén configuradas en el servidor del cotizador.

---

## 📱 Ejemplo para WordPress

### Shortcode Simple

```php
function cotizador_cocinas_shortcode() {
    return '<a href="https://tu-dominio-cotizador.com/cocinas-publico" target="_blank" class="btn-cotizar">Cotizar Cocina</a>';
}
add_shortcode('cotizar_cocina', 'cotizador_cocinas_shortcode');
```

Uso: `[cotizar_cocina]`

### Widget HTML

```html
<div class="widget-cotizador">
  <h3>Cotiza tu Cocina</h3>
  <iframe src="https://tu-dominio-cotizador.com/cocinas-publico" width="100%" height="600"></iframe>
</div>
```

---

## 🎯 Recomendación

**Usa la Opción 1 (Link Directo)** porque:
- ✅ Más simple de implementar
- ✅ No requiere configuración adicional
- ✅ Mejor experiencia de usuario (página completa)
- ✅ Más fácil de mantener
- ✅ No hay problemas de CORS o iframe

Solo agrega un botón llamativo en tu página web que redirija a `/cocinas-publico`.

