/**
 * Componente wrapper que solo renderiza su contenido en el cliente
 * Útil para componentes que usan React Query u otras librerías que solo funcionan en el cliente
 * CRÍTICO: Retorna null durante SSR para evitar que los hooks se ejecuten
 */
import { useState, useEffect, type ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  // CRÍTICO: Verificar SSR ANTES de cualquier hook
  const isSSR = typeof window === 'undefined';
  
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (!isSSR) {
      setHasMounted(true);
    }
  }, [isSSR]);

  // Si estamos en SSR, retornar fallback inmediatamente (sin ejecutar hooks de children)
  if (isSSR || !hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}


