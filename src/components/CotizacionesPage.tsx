/**
 * Página de listado de cotizaciones
 * Muestra todas las cotizaciones (admin) o solo las del usuario (técnico)
 * Layout ya verifica la autenticación antes de renderizar este componente
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerCotizaciones, cambiarEstadoCotizacion } from '../services/cotizaciones.service';
import { obtenerUsuarios } from '../services/usuarios.service';
import { downloadQuotePDF } from '../utils/pdf';
import { convertirCotizacionAPDF } from '../utils/convertirCotizacionAPDF';
import { useUser } from '../contexts/UserContext';
import type { Cotizacion } from '../types/database';

export default function CotizacionesPage() {
  // SIMPLIFICADO: Usar directamente el usuario del contexto
  const { usuario, esAdmin } = useUser();
  const queryClient = useQueryClient();
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<Cotizacion | null>(null);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<string[]>([]);
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [cotizacionDetalles, setCotizacionDetalles] = useState<Cotizacion | null>(null);

  // Debug: Log del estado antes de la query
  console.log('🔍 [CotizacionesPage] Estado antes de query:', {
    tieneUsuario: !!usuario,
    usuarioId: usuario?.id,
    esAdmin,
    email: usuario?.email
  });

  // Obtener cotizaciones
  const { data: cotizaciones = [], isLoading, error: errorCotizaciones, isFetching, status } = useQuery({
    queryKey: ['cotizaciones', esAdmin ? 'all' : usuario?.id || 'none'],
    queryFn: async () => {
      console.log('🚀 [CotizacionesPage] queryFn ejecutándose...', {
        usuarioId: usuario?.id,
        esAdmin
      });
      if (!usuario?.id) {
        console.error('❌ [CotizacionesPage] Usuario no disponible en queryFn');
        throw new Error('Usuario no disponible');
      }
      try {
        const result = await obtenerCotizaciones(esAdmin ? undefined : usuario.id);
        console.log('✅ [CotizacionesPage] Cotizaciones obtenidas:', result.length);
        return result;
      } catch (error: any) {
        console.error('❌ [CotizacionesPage] Error en obtenerCotizaciones:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
    },
    enabled: !!usuario?.id,
    retry: 2,
    staleTime: 30000
  });

  // Debug: Log del estado de la query
  console.log('📊 [CotizacionesPage] Estado de query:', {
    status,
    isLoading,
    isFetching,
    hasError: !!errorCotizaciones,
    error: errorCotizaciones,
    dataLength: cotizaciones.length,
    enabled: !!usuario?.id
  });
  
  // Si no hay usuario, mostrar loading
  if (!usuario) {
    console.log('⏳ [CotizacionesPage] No hay usuario, mostrando loading...');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }


  // Obtener usuarios/empleados (solo para admin)
  const { data: empleados = [] } = useQuery({
    queryKey: ['empleados'],
    queryFn: obtenerUsuarios,
    enabled: esAdmin
  });

  // Mutación para cambiar estado
  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, estado, empleadosAsignados }: { id: string; estado: any; empleadosAsignados?: string[] }) => 
      cambiarEstadoCotizacion(id, estado, empleadosAsignados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      setMostrarModalAsignacion(false);
      setCotizacionSeleccionada(null);
      setEmpleadosSeleccionados([]);
    }
  });

  /**
   * Genera el PDF profesional de una cotización
   */
  const generarPDF = async (cotizacion: Cotizacion) => {
    try {
      // Convertir cotización al formato del PDF profesional
      const datosPDF = convertirCotizacionAPDF(cotizacion);
      
      // Descargar PDF
      await downloadQuotePDF(datosPDF);
    } catch (error: any) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar PDF: ' + (error.message || 'Error desconocido'));
    }
  };

  /**
   * Maneja el cambio de estado de una cotización
   */
  const handleCambiarEstado = async (cotizacion: Cotizacion, nuevoEstado: string) => {
    // Si se acepta, mostrar modal para asignar empleados
    if (nuevoEstado === 'aceptada') {
      setCotizacionSeleccionada(cotizacion);
      setEmpleadosSeleccionados([]);
      setMostrarModalAsignacion(true);
    } else {
      // Para rechazada o pendiente, cambiar directamente
      await cambiarEstadoMutation.mutateAsync({
        id: cotizacion.id,
        estado: nuevoEstado as any
      });
    }
  };

  /**
   * Confirma la aceptación con empleados asignados
   */
  const handleConfirmarAceptacion = async () => {
    if (!cotizacionSeleccionada) return;

    await cambiarEstadoMutation.mutateAsync({
      id: cotizacionSeleccionada.id,
      estado: 'aceptada' as any,
      empleadosAsignados: empleadosSeleccionados
    });
  };

  // Mostrar error si hay uno
  if (errorCotizaciones) {
    console.error('❌ [CotizacionesPage] Error al cargar cotizaciones:', {
      error: errorCotizaciones,
      message: errorCotizaciones instanceof Error ? errorCotizaciones.message : String(errorCotizaciones),
      code: (errorCotizaciones as any)?.code,
      details: (errorCotizaciones as any)?.details,
      hint: (errorCotizaciones as any)?.hint
    });
    
    const errorMessage = errorCotizaciones instanceof Error 
      ? errorCotizaciones.message 
      : (errorCotizaciones as any)?.message || 'Error desconocido';
    const errorCode = (errorCotizaciones as any)?.code;
    const errorDetails = (errorCotizaciones as any)?.details || (errorCotizaciones as any)?.hint;
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-2xl">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Error al cargar cotizaciones</p>
          <p className="text-sm text-gray-600 mb-2">{errorMessage}</p>
          {errorCode && (
            <p className="text-xs text-gray-500 mb-2">Código: {errorCode}</p>
          )}
          {errorDetails && (
            <details className="text-xs text-gray-500 mb-4 text-left bg-gray-50 p-3 rounded mt-4">
              <summary className="cursor-pointer font-semibold mb-2">Detalles del error</summary>
              <pre className="whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(errorDetails, null, 2)}</pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  // Mostrar error si hay uno
  if (errorCotizaciones) {
    console.error('❌ [CotizacionesPage] Error al cargar cotizaciones:', errorCotizaciones);
    const errorMessage = errorCotizaciones instanceof Error 
      ? errorCotizaciones.message 
      : (errorCotizaciones as any)?.message || 'Error desconocido';
    const errorCode = (errorCotizaciones as any)?.code;
    const errorDetails = (errorCotizaciones as any)?.details || (errorCotizaciones as any)?.hint;
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-2xl">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Error al cargar cotizaciones</p>
          <p className="text-sm text-gray-600 mb-2">{errorMessage}</p>
          {errorCode && <p className="text-xs text-gray-500 mb-2">Código: {errorCode}</p>}
          {errorDetails && (
            <details className="text-xs text-gray-500 mb-4 text-left bg-gray-50 p-3 rounded mt-4">
              <summary className="cursor-pointer font-semibold mb-2">Detalles del error</summary>
              <pre className="whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(errorDetails, null, 2)}</pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || isFetching) {
    console.log('⏳ [CotizacionesPage] Mostrando loading...', { isLoading, isFetching, status });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cotizaciones...</p>
          <p className="text-xs text-gray-500 mt-2">
            {esAdmin ? 'Buscando todas las cotizaciones...' : `Buscando cotizaciones de ${usuario.email}...`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Estado: {status} | Usuario ID: {usuario.id}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header mejorado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {esAdmin ? 'Historial de Cotizaciones' : 'Mis Cotizaciones'}
        </h1>
            <p className="text-gray-600 mt-1">
              {esAdmin 
                ? 'Gestiona todas las cotizaciones del sistema' 
                : 'Revisa y gestiona tus cotizaciones'}
            </p>
            {/* Debug info */}
            <p className="text-xs text-gray-400 mt-1">
              Usuario: {usuario.email} | Rol: {usuario.role} | {esAdmin ? 'Viendo todas' : 'Viendo solo mías'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total de cotizaciones</div>
            <div className="text-2xl font-bold text-indigo-600">{cotizaciones.length}</div>
          </div>
        </div>

        {/* Tabla de cotizaciones */}
        {cotizaciones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No hay cotizaciones disponibles</p>
            <p className="text-gray-400 text-sm mb-4">
              {esAdmin 
                ? 'Aún no se han creado cotizaciones en el sistema' 
                : 'Aún no has creado ninguna cotización'}
            </p>
            <a
              href="/cotizacion"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Crear Nueva Cotización
            </a>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left max-w-2xl mx-auto">
              <p className="text-sm font-semibold text-yellow-800 mb-2">💡 Información de Debug:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Usuario ID: {usuario.id}</li>
                <li>• Rol: {usuario.role}</li>
                <li>• Es Admin: {esAdmin ? 'Sí' : 'No'}</li>
                <li>• Query Key: ['cotizaciones', {esAdmin ? "'all'" : `'${usuario.id}'`}]</li>
                <li>• Estado de carga: {isLoading ? 'Cargando...' : 'Completado'}</li>
                <li>• Error: {errorCotizaciones ? (errorCotizaciones instanceof Error ? errorCotizaciones.message : 'Error desconocido') : 'Ninguno'}</li>
              </ul>
            </div>
          </div>
        ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                {esAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Creado por
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cotizaciones.map((cotizacion: Cotizacion) => (
                <tr key={cotizacion.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cotizacion.numero}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{cotizacion.cliente_nombre}</div>
                    {cotizacion.cliente_email && (
                      <div className="text-xs text-gray-500">{cotizacion.cliente_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${cotizacion.total.toLocaleString('es-CO')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={cotizacion.estado}
                      onChange={(e) => handleCambiarEstado(cotizacion, e.target.value)}
                      className={`text-xs leading-5 font-semibold rounded-full px-3 py-1 border-0 ${
                        cotizacion.estado === 'aceptada' ? 'bg-green-100 text-green-800' :
                        cotizacion.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aceptada">Aceptada</option>
                      <option value="rechazada">Rechazada</option>
                    </select>
                  </td>
                  {esAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(cotizacion.usuario as any)?.nombre || 'Sin nombre'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(cotizacion.usuario as any)?.email || 'N/A'}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(cotizacion.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(cotizacion.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCotizacionDetalles(cotizacion);
                          setMostrarModalDetalles(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow"
                        title="Ver detalles completos"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Detalles
                      </button>
                    <button
                        onClick={() => generarPDF(cotizacion)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow"
                        title="Descargar PDF profesional"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      PDF
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Modal para asignar empleados al aceptar cotización */}
      {mostrarModalAsignacion && cotizacionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Aceptar Cotización</h2>
              <button
                onClick={() => {
                  setMostrarModalAsignacion(false);
                  setCotizacionSeleccionada(null);
                  setEmpleadosSeleccionados([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Al aceptar esta cotización, se creará un nuevo cliente y un nuevo trabajo.
                  Puedes asignar empleados al trabajo:
                </p>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Cotización: {cotizacionSeleccionada.numero}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Cliente: {cotizacionSeleccionada.cliente_nombre}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignar Empleados (opcional)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {empleados.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay empleados disponibles</p>
                  ) : (
                    empleados.map((empleado) => (
                      <label key={empleado.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={empleadosSeleccionados.includes(empleado.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEmpleadosSeleccionados([...empleadosSeleccionados, empleado.id]);
                            } else {
                              setEmpleadosSeleccionados(empleadosSeleccionados.filter(id => id !== empleado.id));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                          {empleado.nombre || empleado.email}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleConfirmarAceptacion}
                  disabled={cambiarEstadoMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {cambiarEstadoMutation.isPending ? 'Guardando...' : 'Aceptar y Crear Trabajo'}
                </button>
                <button
                  onClick={() => {
                    setMostrarModalAsignacion(false);
                    setCotizacionSeleccionada(null);
                    setEmpleadosSeleccionados([]);
                  }}
                  disabled={cambiarEstadoMutation.isPending}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles Completos */}
      {mostrarModalDetalles && cotizacionDetalles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Detalles Completos de la Cotización</h2>
              <button
                onClick={() => {
                  setMostrarModalDetalles(false);
                  setCotizacionDetalles(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Información General */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información General</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Número de Cotización:</span>
                    <span className="ml-2 text-gray-900">{cotizacionDetalles.numero}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      cotizacionDetalles.estado === 'aceptada' ? 'bg-green-100 text-green-800' :
                      cotizacionDetalles.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {cotizacionDetalles.estado}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fecha:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(cotizacionDetalles.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Total:</span>
                    <span className="ml-2 text-gray-900 font-semibold">
                      ${cotizacionDetalles.total.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nombre:</span>
                    <span className="ml-2 text-gray-900">{cotizacionDetalles.cliente_nombre}</span>
                  </div>
                  {cotizacionDetalles.cliente_email && (
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">{cotizacionDetalles.cliente_email}</span>
                    </div>
                  )}
                  {cotizacionDetalles.cliente_telefono && (
                    <div>
                      <span className="font-medium text-gray-700">Teléfono:</span>
                      <span className="ml-2 text-gray-900">{cotizacionDetalles.cliente_telefono}</span>
                    </div>
                  )}
                  {cotizacionDetalles.cliente_direccion && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Dirección:</span>
                      <span className="ml-2 text-gray-900">{cotizacionDetalles.cliente_direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de la Persona que Cotizó */}
              {cotizacionDetalles.usuario && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Persona que Cotizó</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Nombre:</span>
                      <span className="ml-2 text-gray-900">{(cotizacionDetalles.usuario as any)?.nombre || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">{(cotizacionDetalles.usuario as any)?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Rol:</span>
                      <span className="ml-2 text-gray-900">{(cotizacionDetalles.usuario as any)?.role || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Completos */}
              {cotizacionDetalles.items && Array.isArray(cotizacionDetalles.items) && cotizacionDetalles.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Items de la Cotización</h3>
                  <div className="space-y-4">
                    {cotizacionDetalles.items.map((item: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.nombre || `Item ${index + 1}`}
                              {item.cantidad > 1 && ` (x${item.cantidad})`}
                            </h4>
                            {item.descripcion && (
                              <p className="text-sm text-gray-600 mt-1">{item.descripcion}</p>
                            )}
                            {item.medidas && (
                              <p className="text-xs text-gray-500 mt-1">
                                Medidas: {item.medidas.ancho} x {item.medidas.alto} x {item.medidas.profundidad} {item.medidas.unidad || 'cm'}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ${(item.precio_total || item.precio_unitario || 0).toLocaleString('es-CO')}
                            </p>
                            {item.precio_unitario && (
                              <p className="text-xs text-gray-500">
                                ${item.precio_unitario.toLocaleString('es-CO')} c/u
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Materiales del Item */}
                        {item.materiales && Array.isArray(item.materiales) && item.materiales.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Materiales:</h5>
                            <div className="space-y-1">
                              {item.materiales.map((mat: any, matIndex: number) => (
                                <div key={matIndex} className="text-xs text-gray-600 flex justify-between">
                                  <span>
                                    {mat.material_nombre || mat.nombre || 'Material'} 
                                    {mat.material_tipo && ` (${mat.material_tipo})`}
                                    {mat.cantidad && ` - ${mat.cantidad} ${mat.unidad || 'un'}`}
                                  </span>
                                  {mat.precio_unitario && (
                                    <span className="ml-2 font-medium">
                                      ${(mat.precio_unitario * (mat.cantidad || 1)).toLocaleString('es-CO')}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Servicios del Item */}
                        {item.servicios && Array.isArray(item.servicios) && item.servicios.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Servicios / Mano de Obra:</h5>
                            <div className="space-y-1">
                              {item.servicios.map((serv: any, servIndex: number) => (
                                <div key={servIndex} className="text-xs text-gray-600 flex justify-between">
                                  <span>
                                    {serv.servicio_nombre || serv.nombre || 'Servicio'}
                                    {serv.horas && ` - ${serv.horas} horas`}
                                  </span>
                                  {serv.precio_por_hora && serv.horas && (
                                    <span className="ml-2 font-medium">
                                      ${(serv.precio_por_hora * serv.horas).toLocaleString('es-CO')}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Costos y Utilidades */}
                        {(item.margen_ganancia || item.gastos_extras || item.costos_indirectos) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Costos y Utilidades:</h5>
                            <div className="space-y-1 text-xs text-gray-600">
                              {item.margen_ganancia && (
                                <div className="flex justify-between">
                                  <span>Margen de Ganancia:</span>
                                  <span className="font-medium">{item.margen_ganancia}%</span>
                                </div>
                              )}
                              {item.gastos_extras && (
                                <div className="flex justify-between">
                                  <span>Gastos Extras:</span>
                                  <span className="font-medium">{item.gastos_extras}%</span>
                                </div>
                              )}
                              {item.costos_indirectos && (
                                <div className="flex justify-between">
                                  <span>Costos Indirectos:</span>
                                  <span className="font-medium">${item.costos_indirectos.toLocaleString('es-CO')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen de Materiales y Servicios (si no hay items detallados) */}
              {(!cotizacionDetalles.items || !Array.isArray(cotizacionDetalles.items) || cotizacionDetalles.items.length === 0) && (
                <>
                  {/* Materiales */}
                  {cotizacionDetalles.materiales && Array.isArray(cotizacionDetalles.materiales) && cotizacionDetalles.materiales.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Materiales</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unitario</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cotizacionDetalles.materiales.map((mat: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {mat.material?.nombre || mat.material_nombre || 'Material'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">{mat.cantidad}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  ${mat.precio_unitario.toLocaleString('es-CO')}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  ${(mat.cantidad * mat.precio_unitario).toLocaleString('es-CO')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Servicios */}
                  {cotizacionDetalles.servicios && Array.isArray(cotizacionDetalles.servicios) && cotizacionDetalles.servicios.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Servicios / Mano de Obra</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio por Hora</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cotizacionDetalles.servicios.map((serv: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {serv.servicio?.nombre || serv.servicio_nombre || 'Servicio'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">{serv.horas}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  ${serv.precio_por_hora.toLocaleString('es-CO')}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  ${(serv.horas * serv.precio_por_hora).toLocaleString('es-CO')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Resumen Financiero */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumen Financiero</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal Materiales:</span>
                    <span className="font-medium text-gray-900">
                      ${cotizacionDetalles.subtotal_materiales.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal Servicios:</span>
                    <span className="font-medium text-gray-900">
                      ${cotizacionDetalles.subtotal_servicios.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-medium text-gray-900">
                      ${cotizacionDetalles.subtotal.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">IVA (19%):</span>
                    <span className="font-medium text-gray-900">
                      ${cotizacionDetalles.iva.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Margen de Ganancia:</span>
                    <span className="font-medium text-gray-900">
                      {cotizacionDetalles.margen_ganancia}%
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-indigo-600">
                      ${cotizacionDetalles.total.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón Cerrar */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setMostrarModalDetalles(false);
                    setCotizacionDetalles(null);
                  }}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
