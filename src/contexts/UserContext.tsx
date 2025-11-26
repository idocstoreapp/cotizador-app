/**
 * Contexto para compartir el usuario entre componentes
 * Evita múltiples consultas a la BD
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { UserProfile } from '../types/database';

interface UserContextType {
  usuario: UserProfile | null;
  esAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  usuario: null,
  esAdmin: false
});

export function UserProvider({ 
  children, 
  usuario 
}: { 
  children: ReactNode; 
  usuario: UserProfile | null;
}) {
  // Debug: Log cuando el provider se actualiza
  console.log('🔄 UserProvider actualizado:', {
    tieneUsuario: !!usuario,
    email: usuario?.email,
    role: usuario?.role,
    id: usuario?.id
  });
  
  // Usar useMemo para asegurar que el valor del contexto cambie cuando el usuario cambie
  const contextValue = useMemo(() => ({
    usuario,
    esAdmin: usuario?.role === 'admin' || false
  }), [usuario, usuario?.id, usuario?.role]); // Dependencias específicas para detectar cambios
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}


