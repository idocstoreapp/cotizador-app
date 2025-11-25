/**
 * Catálogo público de muebles
 * No requiere autenticación - acceso público
 */
import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { obtenerMueblesPorCategoria } from '../../services/muebles.service';
import ProductDetailPublico from './ProductDetailPublico';
import type { Mueble } from '../../types/muebles';

// Crear QueryClient para el componente público
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
});

function CatalogoMueblesPublicoContent() {
  const [muebleSeleccionado, setMuebleSeleccionado] = useState<Mueble | null>(null);

  // Obtener muebles (categoría "otros" o todos excepto cocina y closet)
  const { data: muebles = [], isLoading } = useQuery({
    queryKey: ['muebles-publico'],
    queryFn: async () => {
      const todos = await obtenerMueblesPorCategoria('otros');
      // También incluir otros tipos si existen
      return todos;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando catálogo de muebles...</p>
        </div>
      </div>
    );
  }

  // Si hay un mueble seleccionado, mostrar el detalle
  if (muebleSeleccionado) {
    return (
      <ProductDetailPublico
        mueble={muebleSeleccionado}
        onBack={() => setMuebleSeleccionado(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Muebles</h1>
          <p className="text-gray-600 mt-2">Explora nuestras opciones de muebles y cotiza el tuyo</p>
        </div>
      </header>

      {/* Grid de muebles */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {muebles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay muebles disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {muebles.map((mueble) => (
              <div
                key={mueble.id}
                onClick={() => setMuebleSeleccionado(mueble)}
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-100">
                  <img
                    src={mueble.imagen}
                    alt={mueble.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(mueble.nombre);
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{mueble.nombre}</h3>
                  {mueble.descripcion && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{mueble.descripcion}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-indigo-600">
                      ${mueble.precio_base.toLocaleString('es-CO')}
                    </span>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Componente wrapper con QueryProvider
export default function CatalogoMueblesPublico() {
  return (
    <QueryClientProvider client={queryClient}>
      <CatalogoMueblesPublicoContent />
    </QueryClientProvider>
  );
}

