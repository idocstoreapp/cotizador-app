/**
 * Contexto para compartir el usuario entre componentes
 * Evita múltiples consultas a la BD
 */
import { createContext, useContext, type ReactNode } from 'react';
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
    role: usuario?.role
  });
  
  return (
    <UserContext.Provider value={{
      usuario,
      esAdmin: usuario?.role === 'admin' || false
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}


