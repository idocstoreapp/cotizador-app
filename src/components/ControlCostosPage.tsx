/**
 * Página de Control de Costos Reales y Rentabilidad
 * Muestra pestañas para gestionar todos los costos reales de un proyecto
 */
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import { obtenerCotizacionPorId } from '../services/cotizaciones.service';
import { obtenerResumenCostosReales, obtenerComparacionPresupuestoReal } from '../services/rentabilidad.service';
import MaterialesRealesTab from './ui/MaterialesRealesTab';
import ManoObraRealTab from './ui/ManoObraRealTab';
import GastosHormigaTab from './ui/GastosHormigaTab';
import TransporteRealTab from './ui/TransporteRealTab';
import ResumenCostosTab from './ui/ResumenCostosTab';
import FacturasTab from './ui/FacturasTab';
import type { Cotizacion, UserProfile } from '../types/database';
import type { ResumenCostosReales, ComparacionPresupuestoReal } from '../services/rentabilidad.service';

type TabType = 'materiales' | 'mano-obra' | 'gastos-hormiga' | 'transporte' | 'resumen' | 'facturas';

interface ControlCostosPageProps {
  cotizacionId: string;
}

export default function ControlCostosPage({ cotizacionId }: ControlCostosPageProps) {
  const contextoUsuario = useUser();
  const [usuarioLocal, setUsuarioLocal] = useState<UserProfile | null>(null);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [resumenCostos, setResumenCostos] = useState<ResumenCostosReales | null>(null);
  const [comparacion, setComparacion] = useState<ComparacionPresupuestoReal | null>(null);
  const [tabActual, setTabActual] = useState<TabType>('resumen');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar usuario del contexto o cargar directamente
  const usuario = contextoUsuario.usuario || usuarioLocal;
  const esAdmin = usuario?.role === 'admin' || false;

  // Cargar usuario directamente si no está en contexto
  useEffect(() => {
    const cargarUsuario = async () => {
      if (contextoUsuario.usuario?.id) {
        setUsuarioLocal(null);
        return;
      }
      try {
        const usuarioDirecto = await obtenerUsuarioActual();
        if (usuarioDirecto) {
          setUsuarioLocal(usuarioDirecto);
        }
      } catch (err: any) {
        console.error('Error al cargar usuario:', err);
      }
    };
    cargarUsuario();
  }, [contextoUsuario.usuario?.id]);

  // Cargar datos de la cotización y costos
  useEffect(() => {
    const cargarDatos = async () => {
      if (!cotizacionId) return;

      try {
        setCargando(true);
        setError(null);

        const [cotizacionData, resumen, comparacionData] = await Promise.all([
          obtenerCotizacionPorId(cotizacionId),
          obtenerResumenCostosReales(cotizacionId),
          obtenerComparacionPresupuestoReal(cotizacionId).catch(() => null)
        ]);

        if (!cotizacionData) {
          throw new Error('Cotización no encontrada');
        }

        setCotizacion(cotizacionData);
        setResumenCostos(resumen);
        setComparacion(comparacionData);
      } catch (err: any) {
        console.error('Error al cargar datos:', err);
        setError(err.message || 'Error al cargar datos del proyecto');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [cotizacionId]);

  // Función para recargar datos después de cambios
  const recargarDatos = async () => {
    if (!cotizacionId) return;

    try {
      const [resumen, comparacionData] = await Promise.all([
        obtenerResumenCostosReales(cotizacionId),
        obtenerComparacionPresupuestoReal(cotizacionId).catch(() => null)
      ]);

      setResumenCostos(resumen);
      setComparacion(comparacionData);
    } catch (err: any) {
      console.error('Error al recargar datos:', err);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando control de costos...</p>
        </div>
      </div>
    );
  }

  if (error || !cotizacion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold mb-2">Error</p>
          <p className="text-gray-600">{error || 'Cotización no encontrada'}</p>
        </div>
      </div>
    );
  }

  // Solo admins pueden gestionar costos
  if (!esAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Acceso denegado</p>
          <p className="text-gray-600 mt-2">Solo los administradores pueden gestionar costos reales</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'resumen' as TabType, label: '📊 Resumen', icon: '📊' },
    { id: 'materiales' as TabType, label: '🧱 Materiales', icon: '🧱' },
    { id: 'mano-obra' as TabType, label: '👷 Mano de Obra', icon: '👷' },
    { id: 'gastos-hormiga' as TabType, label: '🐜 Gastos Hormiga', icon: '🐜' },
    { id: 'transporte' as TabType, label: '🚚 Transporte', icon: '🚚' },
    { id: 'facturas' as TabType, label: '📄 Facturas', icon: '📄' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Control de Costos - {cotizacion.numero}
            </h1>
            <p className="text-gray-600 mt-1">
              Cliente: {cotizacion.cliente_nombre}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Total Cotizado: ${comparacion?.totalPresupuestado.toLocaleString('es-CO') || cotizacion.total?.toLocaleString('es-CO') || '0'}
            </p>
          </div>
          {resumenCostos && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Real Gastado</p>
              <p className="text-2xl font-bold text-indigo-600">
                ${resumenCostos.totalReal.toLocaleString('es-CO')}
              </p>
              {comparacion && (
                <p className={`text-sm mt-1 ${comparacion.utilidadReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Utilidad: ${comparacion.utilidadReal.toLocaleString('es-CO')}
                </p>
              )}
            </div>
          )}
        </div>
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

        {/* Tab Content */}
        <div className="p-6">
          {tabActual === 'resumen' && comparacion && (
            <ResumenCostosTab comparacion={comparacion} />
          )}
          {tabActual === 'materiales' && (
            <MaterialesRealesTab
              cotizacionId={cotizacionId}
              cotizacion={cotizacion}
              onUpdate={recargarDatos}
            />
          )}
          {tabActual === 'mano-obra' && (
            <ManoObraRealTab
              cotizacionId={cotizacionId}
              cotizacion={cotizacion}
              onUpdate={recargarDatos}
            />
          )}
          {tabActual === 'gastos-hormiga' && (
            <GastosHormigaTab
              cotizacionId={cotizacionId}
              cotizacion={cotizacion}
              onUpdate={recargarDatos}
            />
          )}
          {tabActual === 'transporte' && (
            <TransporteRealTab
              cotizacionId={cotizacionId}
              cotizacion={cotizacion}
              onUpdate={recargarDatos}
            />
          )}
          {tabActual === 'facturas' && (
            <FacturasTab
              cotizacionId={cotizacionId}
              onUpdate={recargarDatos}
            />
          )}
        </div>
      </div>
    </div>
  );
}

