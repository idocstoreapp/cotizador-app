/**
 * Catálogo público de closets
 * No requiere autenticación - acceso público
 */
import { useState, useMemo } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { obtenerMueblesPorCategoria } from '../../services/muebles.service';
import ProductDetailPublico from './ProductDetailPublico';
import type { Mueble } from '../../types/muebles';

// Crear QueryClient para el componente público (singleton)
let queryClientInstance: QueryClient | null = null;

function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000
        }
      }
    });
  }
  return queryClientInstance;
}

// Componente de tarjeta de producto con variantes
function ProductCard({ mueble, onClick }: { mueble: Mueble; onClick: () => void }) {
  const [imagenActual, setImagenActual] = useState(mueble.imagen);

  // Procesar imagenes_por_variante
  const imagenesPorVariante = useMemo(() => {
    if (!mueble.imagenes_por_variante || !Array.isArray(mueble.imagenes_por_variante)) {
      return [];
    }
    return mueble.imagenes_por_variante
      .filter((v: any) => v && (v.imagen_url || v.url))
      .map((v: any) => ({
        color: v.color || undefined,
        material: v.material || undefined,
        encimera: v.encimera || undefined,
        imagen_url: v.imagen_url || v.url || ''
      }));
  }, [mueble.imagenes_por_variante]);

  // Incluir la imagen principal como primera variante si hay variantes
  const todasLasImagenes = useMemo(() => {
    if (imagenesPorVariante.length === 0) {
      return [];
    }
    return [
      { imagen_url: mueble.imagen, color: 'Principal', esPrincipal: true },
      ...imagenesPorVariante
    ];
  }, [mueble.imagen, imagenesPorVariante]);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square bg-gray-100 relative group">
        <img
          src={imagenActual}
          alt={mueble.nombre}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(mueble.nombre);
          }}
        />
        {/* Indicador de variantes */}
        {todasLasImagenes.length > 1 && (
          <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {todasLasImagenes.length} variantes
          </div>
        )}
      </div>
      
      {/* Thumbnails de variantes (solo si hay variantes) */}
      {todasLasImagenes.length > 1 && (
        <div className="px-4 pt-2 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {todasLasImagenes.map((variante, index) => {
              const isActive = variante.imagen_url === imagenActual;
              return (
                <button
                  key={`${variante.imagen_url}-${index}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar que se active el onClick del card
                    setImagenActual(variante.imagen_url);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    isActive 
                      ? 'border-indigo-600 ring-2 ring-indigo-200' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  title={variante.esPrincipal ? 'Imagen principal' : variante.color || `Variante ${index + 1}`}
                >
                  <img
                    src={variante.imagen_url}
                    alt={variante.esPrincipal ? 'Principal' : variante.color || `Variante ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64?text=V';
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

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
  );
}

function CatalogoClosetsPublicoContent() {
  const [muebleSeleccionado, setMuebleSeleccionado] = useState<Mueble | null>(null);

  // Obtener solo closets
  const { data: closets = [], isLoading } = useQuery({
    queryKey: ['closets-publico'],
    queryFn: () => obtenerMueblesPorCategoria('closet')
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando catálogo de closets...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Closets</h1>
          <p className="text-gray-600 mt-2">Explora nuestras opciones de closets y cotiza el tuyo</p>
        </div>
      </header>

      {/* Grid de closets */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {closets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay closets disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {closets.map((closet) => (
              <ProductCard
                key={closet.id}
                mueble={closet}
                onClick={() => setMuebleSeleccionado(closet)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Componente wrapper con QueryProvider
export default function CatalogoClosetsPublico() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <CatalogoClosetsPublicoContent />
    </QueryClientProvider>
  );
}

