/**
 * Contenido del Dashboard que obtiene el usuario y renderiza Dashboard
 * Este componente debe estar dentro de QueryProvider
 */
import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import Dashboard from './Dashboard';
import type { UserProfile } from '../types/database';

export default function DashboardContent() {
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
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <svg className="w-12 h-12 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 text-lg font-semibold mb-2">Error al cargar perfil de usuario</p>
            <p className="text-gray-700 text-sm mb-4">
              Tu sesión está activa, pero no se encontró tu perfil en la base de datos.
            </p>
            <div className="text-left bg-white rounded p-4 mb-4 text-xs text-gray-600">
              <p className="font-semibold mb-2">Posibles causas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El perfil no fue creado después del registro</li>
                <li>Problemas con las políticas de seguridad (RLS)</li>
                <li>El usuario fue eliminado de la tabla perfiles</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Recargar página
              </button>
              <button
                onClick={() => {
                  const { supabase } = require('../utils/supabase');
                  supabase.auth.signOut().then(() => {
                    window.location.href = '/';
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard usuario={usuario} />;
}

