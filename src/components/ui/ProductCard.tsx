/**
 * Componente de tarjeta de producto para el catálogo
 * Diseño moderno con imagen grande, precio destacado y botón de acción
 */
import React from 'react';
import type { Mueble } from '../../types/muebles';

interface ProductCardProps {
  mueble: Mueble;
  onAddToQuote: (mueble: Mueble) => void;
}

// Memoizar para evitar re-renders innecesarios
const ProductCard = React.memo(function ProductCard({ mueble, onAddToQuote }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer">
      {/* Imagen del producto */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={mueble.imagen}
          alt={mueble.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback si la imagen no carga
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(mueble.nombre);
          }}
        />
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-6">
        {/* Nombre del producto */}
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {mueble.nombre}
        </h3>

        {/* Precio base */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Precio desde</p>
          <p className="text-2xl font-bold text-indigo-600">
            ${mueble.precio_base.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            * Precio base, puede variar según opciones
          </p>
        </div>

        {/* Botón de acción */}
        <button
          onClick={() => onAddToQuote(mueble)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 group/btn"
        >
          <svg
            className="w-5 h-5 group-hover/btn:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Agregar a la Cotización</span>
        </button>
      </div>
    </div>
  );
});

export default ProductCard;
