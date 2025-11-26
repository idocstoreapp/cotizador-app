/**
 * Wrapper para CotizacionesPage que asegura que QueryProvider esté disponible
 */
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import CotizacionesPage from './CotizacionesPage';

export default function CotizacionesPageWrapper() {
  // Crear QueryClient aquí para asegurar que esté disponible
  const [queryClient] = useState(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000
        }
      }
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <CotizacionesPage />
    </QueryClientProvider>
  );
}

