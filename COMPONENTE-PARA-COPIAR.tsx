/**
 * COMPONENTE LISTO PARA COPIAR A TU OTRA PÁGINA WEB ASTRO
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo a tu otra página web
 * 2. Colócalo en: src/components/CotizadorCocinas.tsx
 * 3. Reemplaza la URL por defecto con tu URL real
 * 4. Úsalo en cualquier página Astro con: <CotizadorCocinas client:load />
 */

import React from 'react';

interface CotizadorCocinasProps {
  /** URL del catálogo de cocinas */
  urlCotizador?: string;
  /** Título del banner/card */
  titulo?: string;
  /** Descripción del banner/card */
  descripcion?: string;
  /** Estilo del componente: 'boton', 'banner', 'card', o 'flotante' */
  estilo?: 'boton' | 'banner' | 'card' | 'flotante';
  /** Clases CSS adicionales (si usas Tailwind) */
  className?: string;
}

export default function CotizadorCocinas({
  urlCotizador = 'https://tu-dominio-cotizador.com/cocinas-publico', // ⚠️ CAMBIAR ESTA URL
  titulo = 'Diseña tu Cocina Ideal',
  descripcion = 'Explora nuestro catálogo y cotiza tu cocina personalizada con materiales y acabados de alta calidad',
  estilo = 'banner',
  className = ''
}: CotizadorCocinasProps) {
  
  // Estilos base (funciona con o sin Tailwind)
  const estilos = {
    boton: {
      display: 'inline-block',
      padding: '12px 24px',
      background: '#4F46E5',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      transition: 'all 0.3s',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    banner: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '60px 20px',
      textAlign: 'center' as const
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden' as const,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxWidth: '400px',
      transition: 'transform 0.3s'
    },
    flotante: {
      position: 'fixed' as const,
      bottom: '24px',
      right: '24px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 24px',
      background: '#4F46E5',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '50px',
      fontWeight: 'bold',
      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
      transition: 'all 0.3s'
    }
  };

  // Estilo: Botón Simple
  if (estilo === 'boton') {
    return (
      <a
        href={urlCotizador}
        target="_blank"
        rel="noopener noreferrer"
        style={estilos.boton}
        className={className}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#4338CA';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#4F46E5';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        🍳 Cotizar Cocina
      </a>
    );
  }

  // Estilo: Card
  if (estilo === 'card') {
    return (
      <div style={estilos.card} className={className}>
        <div 
          style={{
            height: '200px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4em'
          }}
        >
          🍳
        </div>
        <div style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.5em' }}>
            {titulo}
          </h3>
          <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
            {descripcion}
          </p>
          <a
            href={urlCotizador}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              padding: '12px 24px',
              background: '#4F46E5',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4338CA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4F46E5';
            }}
          >
            Ver Catálogo →
          </a>
        </div>
      </div>
    );
  }

  // Estilo: Botón Flotante
  if (estilo === 'flotante') {
    return (
      <>
        <a
          href={urlCotizador}
          target="_blank"
          rel="noopener noreferrer"
          style={estilos.flotante}
          className={className}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4338CA';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4F46E5';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontSize: '1.5em' }}>🍳</span>
          <span style={{ display: 'none' }} className="texto-flotante">Cotizar Cocina</span>
        </a>
        <style>{`
          @media (min-width: 640px) {
            .texto-flotante {
              display: inline !important;
            }
          }
        `}</style>
      </>
    );
  }

  // Estilo: Banner (por defecto)
  return (
    <section style={estilos.banner} className={className}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5em', marginBottom: '15px', fontWeight: 'bold' }}>
          {titulo}
        </h2>
        <p style={{ fontSize: '1.2em', marginBottom: '30px', opacity: 0.9 }}>
          {descripcion}
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
            fontSize: '1.1em',
            transition: 'all 0.3s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Ver Catálogo de Cocinas →
        </a>
      </div>
    </section>
  );
}

