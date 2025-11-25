/**
 * Componente React para integrar en otra página web Astro
 * 
 * USO EN ASTRO:
 * ---
 * import CotizadorCocinas from '../components/CotizadorCocinas';
 * ---
 * 
 * <CotizadorCocinas client:load urlCotizador="https://..." estilo="banner" />
 */

import { useState } from 'react';

export interface CotizadorCocinasProps {
  /** URL del catálogo de cocinas */
  urlCotizador?: string;
  /** Título del banner/card */
  titulo?: string;
  /** Descripción del banner/card */
  descripcion?: string;
  /** Estilo del componente */
  estilo?: 'boton' | 'banner' | 'card' | 'flotante';
  /** Clases CSS adicionales */
  className?: string;
  /** Altura para iframe (solo si estilo es 'iframe') */
  altura?: string;
}

export default function CotizadorCocinas({
  urlCotizador = 'https://tu-dominio-cotizador.com/cocinas-publico',
  titulo = 'Diseña tu Cocina Ideal',
  descripcion = 'Explora nuestro catálogo y cotiza tu cocina personalizada con materiales y acabados de alta calidad',
  estilo = 'banner',
  className = '',
  altura = '800px'
}: CotizadorCocinasProps) {
  
  // Estilo: Botón Simple
  if (estilo === 'boton') {
    return (
      <a
        href={urlCotizador}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg ${className}`}
        style={{
          textDecoration: 'none'
        }}
      >
        🍳 Cotizar Cocina
      </a>
    );
  }

  // Estilo: Card
  if (estilo === 'card') {
    return (
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden max-w-md transition-transform hover:scale-105 ${className}`}>
        <div 
          className="h-48 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
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
            style={{
              textDecoration: 'none'
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
      <a
        href={urlCotizador}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
        style={{
          textDecoration: 'none'
        }}
      >
        <span className="text-2xl">🍳</span>
        <span className="hidden sm:inline">Cotizar Cocina</span>
      </a>
    );
  }

  // Estilo: Banner (por defecto)
  return (
    <section 
      className={`text-white py-16 px-4 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{titulo}</h2>
        <p className="text-xl mb-8 opacity-90">{descripcion}</p>
        <a
          href={urlCotizador}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition-colors text-lg shadow-lg"
          style={{
            textDecoration: 'none'
          }}
        >
          Ver Catálogo de Cocinas →
        </a>
      </div>
    </section>
  );
}

/**
 * Componente adicional: Iframe Embebido
 */
export function CotizadorCocinasIframe({
  urlCotizador = 'https://tu-dominio-cotizador.com/cocinas-publico',
  altura = '800px',
  className = ''
}: {
  urlCotizador?: string;
  altura?: string;
  className?: string;
}) {
  return (
    <div 
      className={`w-full rounded-xl overflow-hidden shadow-lg ${className}`}
      style={{
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}
    >
      <iframe
        src={urlCotizador}
        width="100%"
        height={altura}
        frameBorder="0"
        style={{ border: 'none' }}
        title="Catálogo de Cocinas"
        allowFullScreen
      />
    </div>
  );
}

