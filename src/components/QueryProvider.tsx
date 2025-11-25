/**
 * Provider de React Query
 * Envuelve la aplicación para proporcionar React Query a todos los componentes
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Crear el QueryClient dentro del componente usando useState con función inicializadora
  // Esto asegura que se cree solo una vez y persista entre renders
  // IMPORTANTE: Crear el QueryClient siempre, incluso en SSR (será reemplazado en el cliente)
  const [queryClient] = useState(() => {
    console.log('[QueryProvider] Creando QueryClient...');
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000 // 5 minutos
        }
      }
    });
    console.log('[QueryProvider] QueryClient creado:', !!client);
    return client;
  });

  console.log('[QueryProvider] Renderizando con QueryClient:', !!queryClient);

  // Renderizar QueryClientProvider inmediatamente
  // No esperar a isClient porque los componentes hijos necesitan el contexto
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}


