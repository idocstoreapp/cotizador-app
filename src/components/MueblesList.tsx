/**
 * Componente que lista los muebles usando React Query
 * SOLO se renderiza en el cliente - completamente seguro para SSR
 * Tiene su propio QueryClientProvider como fallback
 */
import React, { useState, useEffect } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { obtenerMuebles } from '../services/muebles.service';
import ProductCard from './ui/ProductCard';
import type { Mueble } from '../types/muebles';

interface MueblesListProps {
  onMuebleClick: (mueble: Mueble) => void;
  onAddToQuote: (mueble: Mueble) => void;
}

// QueryClient local como fallback (similar a GestionarCatalogo)
let localQueryClientMuebles: QueryClient | null = null;

function getOrCreateQueryClientMuebles(): QueryClient {
  if (typeof window === 'undefined') {
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000
        }
      }
    });
  }
  if (!localQueryClientMuebles) {
    localQueryClientMuebles = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000
        }
      }
    });
  }
  return localQueryClientMuebles;
}

// Componente interno que usa useQuery
// Memoizar el componente para evitar re-renders innecesarios
const MueblesListContent = React.memo(function MueblesListContent({ onMuebleClick, onAddToQuote }: MueblesListProps) {
  const { data: muebles = [], isLoading, error } = useQuery({
    queryKey: ['muebles'],
    queryFn: obtenerMuebles,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  if (error) {
    console.error('Error al cargar muebles:', error);
    return (
      <div className="text-center py-12 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
        <p className="text-red-600 text-lg mb-2 font-bold">⚠️ Error al cargar el catálogo</p>
        <p className="text-gray-700 mb-2">
          {error instanceof Error ? error.message : 'Error desconocido al cargar los muebles'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Cargando muebles...</p>
      </div>
    );
  }

  if (muebles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg mb-4">No hay muebles en el catálogo</p>
        <p className="text-gray-500 text-sm">Usa el botón "Gestionar Catálogo" para agregar muebles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {muebles.map((mueble) => (
        <div
          key={mueble.id}
          onClick={() => onMuebleClick(mueble)}
          className="cursor-pointer"
        >
          <ProductCard
            mueble={mueble}
            onAddToQuote={onAddToQuote}
          />
        </div>
      ))}
    </div>
  );
});

// Componente wrapper que proporciona QueryClient
export default function MueblesList({ onMuebleClick, onAddToQuote }: MueblesListProps) {
  // Verificar que estamos en el cliente
  if (typeof window === 'undefined') {
    return null;
  }

  // Crear QueryClient local como fallback
  const [queryClient] = useState(() => getOrCreateQueryClientMuebles());

  // Envolver en QueryClientProvider para asegurar que siempre tenga acceso
  return (
    <QueryClientProvider client={queryClient}>
      <MueblesListContent
        onMuebleClick={onMuebleClick}
        onAddToQuote={onAddToQuote}
      />
    </QueryClientProvider>
  );
}
