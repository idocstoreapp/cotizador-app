/**
 * Wrapper para el componente Dashboard
 * Obtiene el usuario del contexto y lo pasa al Dashboard
 * IMPORTANTE: Este componente debe estar dentro de QueryProvider
 */
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import Dashboard from './Dashboard';
import type { UserProfile } from '../types/database';

export default function DashboardWrapper() {
  // Verificar que QueryClient esté disponible
  let queryClient = null;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    console.error('QueryClient no disponible:', error);
  }

  const contextoUsuario = useUser();
  const [usuarioLocal, setUsuarioLocal] = useState<UserProfile | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  // Usar usuario del contexto o cargar directamente
  const usuario = contextoUsuario.usuario || usuarioLocal;

  // Cargar usuario directamente si no está en contexto
  useEffect(() => {
    const cargarUsuario = async () => {
      // Si ya tenemos usuario del contexto, usarlo
      if (contextoUsuario.usuario?.id) {
        setUsuarioLocal(null);
        setCargandoUsuario(false);
        return;
      }

      // Si no, cargar directamente desde Supabase
      try {
        setCargandoUsuario(true);
        const usuarioDirecto = await obtenerUsuarioActual();
        if (usuarioDirecto) {
          setUsuarioLocal(usuarioDirecto);
        }
      } catch (err: any) {
        console.error('Error al cargar usuario:', err);
      } finally {
        setCargandoUsuario(false);
      }
    };

    cargarUsuario();
  }, [contextoUsuario.usuario?.id]);

  // Verificar que QueryClient esté disponible antes de renderizar Dashboard
  if (!queryClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Inicializando...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se carga el usuario
  if (cargandoUsuario) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar mensaje
  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Error al cargar usuario</p>
          <p className="text-gray-600 mt-2">Por favor, recarga la página</p>
        </div>
      </div>
    );
  }

  return <Dashboard usuario={usuario} />;
}

