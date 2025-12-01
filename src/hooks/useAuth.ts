/**
 * Hook para obtener el usuario autenticado actual
 */
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import type { UserProfile } from '../types/database';

interface UseAuthReturn {
  usuario: UserProfile | null;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [usuario, setUsuario] = useState<UserProfile | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarUsuario = async () => {
    try {
      setCargando(true);
      setError(null);

      // Obtener sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        setUsuario(null);
        return;
      }

      if (!session?.user) {
        setUsuario(null);
        return;
      }

      // Obtener perfil del usuario
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (perfilError) {
        // Si no hay perfil, crear uno temporal
        setUsuario({
          id: session.user.id,
          email: session.user.email || '',
          nombre: session.user.email?.split('@')[0] || 'Usuario',
          role: 'tecnico',
          created_at: new Date().toISOString()
        });
        return;
      }

      setUsuario(perfil as UserProfile);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuario');
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuario();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUsuario(null);
        } else if (session?.user) {
          await cargarUsuario();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    usuario,
    cargando,
    error,
    recargar: cargarUsuario
  };
}

