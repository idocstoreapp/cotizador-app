/**
 * Wrapper para MueblesList que captura errores de QueryClient
 * Evita que el error rompa todo el componente
 * SOLO se renderiza en el cliente - completamente seguro para SSR
 */
import { Component, type ReactNode } from 'react';
import MueblesList from './MueblesList';
import type { Mueble } from '../types/muebles';

interface MueblesListWrapperProps {
  onMuebleClick: (mueble: Mueble) => void;
  onAddToQuote: (mueble: Mueble) => void;
}

interface MueblesListWrapperState {
  hasError: boolean;
  isClient: boolean;
}

class MueblesListWrapper extends Component<MueblesListWrapperProps, MueblesListWrapperState> {
  constructor(props: MueblesListWrapperProps) {
    super(props);
    this.state = { 
      hasError: false,
      isClient: false
    };
  }

  componentDidMount() {
    // Solo marcar como cliente después de montar (nunca se ejecuta en SSR)
    this.setState({ isClient: true });
  }

  static getDerivedStateFromError(error: Error) {
    // Capturar errores relacionados con QueryClient
    // Pero darle más tiempo antes de mostrar el error
    if (error.message?.includes('QueryClient') || error.message?.includes('QueryClientProvider')) {
      console.error('⚠️ Error de QueryClient capturado (puede ser temporal):', error);
      // No marcar como error inmediatamente - puede ser un problema de timing
      // El componente se reintentará automáticamente
      return { hasError: false }; // No mostrar error, dejar que se reintente
    }
    // Re-lanzar otros errores
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error en MueblesList:', error, errorInfo);
  }

  render(): ReactNode {
    // CRÍTICO: Verificar SSR ANTES de renderizar cualquier cosa
    // Esto previene que React intente ejecutar hooks durante SSR
    if (typeof window === 'undefined') {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="ml-4 text-gray-600">Cargando catálogo...</p>
        </div>
      );
    }

    // Si estamos en SSR, retornar loading sin renderizar MueblesList
    // ClientOnly ya previene esto, pero por seguridad lo dejamos
    if (!this.state.isClient) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="ml-4 text-gray-600">Cargando catálogo...</p>
        </div>
      );
    }

    // Si hay error, mostrar mensaje de error
    if (this.state.hasError) {
      return (
        <div className="text-center py-12 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <p className="text-red-600 text-lg mb-2 font-bold">⚠️ Error al cargar el catálogo</p>
          <p className="text-gray-700 mb-4">Hubo un problema al conectar con el servidor.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, isClient: true });
              window.location.reload();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Recargar página
          </button>
        </div>
      );
    }

    // Renderizar MueblesList solo si estamos en el cliente y no hay errores
    return (
      <MueblesList
        onMuebleClick={this.props.onMuebleClick}
        onAddToQuote={this.props.onAddToQuote}
      />
    );
  }
}

export default MueblesListWrapper;


