/**
 * Página principal de Gastos Fijos
 * Muestra tabs para: Registrar, Lista, Dashboard
 */
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import RegistrarGastoFijoModal from './ui/RegistrarGastoFijoModal';
import ListaGastosFijos from './ui/ListaGastosFijos';
import DashboardGastosFijos from './ui/DashboardGastosFijos';
import type { UserProfile } from '../types/database';

type TabType = 'registrar' | 'lista' | 'dashboard';

export default function GastosFijosPage() {
  const contextoUsuario = useUser();
  const [usuarioLocal, setUsuarioLocal] = useState<UserProfile | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [tabActual, setTabActual] = useState<TabType>('lista');
  const [recargarLista, setRecargarLista] = useState(0);

  // Usar usuario del contexto o cargar directamente
  const usuario = contextoUsuario.usuario || usuarioLocal;
  const esAdmin = usuario?.role === 'admin' || false;

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  // Solo admins pueden gestionar gastos fijos (solo después de que el usuario esté cargado)
  if (!usuario || !esAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Acceso denegado</p>
          <p className="text-gray-600 mt-2">Solo los administradores pueden gestionar gastos fijos</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'lista' as TabType, label: '📋 Lista de Gastos', icon: '📋' },
    { id: 'registrar' as TabType, label: '➕ Registrar Gasto', icon: '➕' },
    { id: 'dashboard' as TabType, label: '📊 Dashboard', icon: '📊' }
  ];

  const handleGastoRegistrado = () => {
    setRecargarLista(prev => prev + 1);
    setTabActual('lista'); // Cambiar a lista después de registrar
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          💰 Gastos Fijos
        </h1>
        <p className="text-gray-600 mt-1">
          Gestión de gastos fijos de la empresa (alquiler, servicios, etc.)
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActual(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tabActual === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Solo renderizar cuando el usuario esté cargado y sea admin */}
        {usuario && esAdmin && (
          <div className="p-6">
            {tabActual === 'registrar' && (
              <div>
                <RegistrarGastoFijoModal
                  gastoEditar={null}
                  onSuccess={handleGastoRegistrado}
                  onCancel={() => setTabActual('lista')}
                />
              </div>
            )}
            {tabActual === 'lista' && (
              <ListaGastosFijos key={recargarLista} />
            )}
            {tabActual === 'dashboard' && (
              <DashboardGastosFijos />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

