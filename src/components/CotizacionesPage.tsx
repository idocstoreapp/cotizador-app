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
  const { usuario, esAdmin: esAdminContexto } = useUser();
  const [intentos, setIntentos] = useState(0);
  
  // Debug: Log del estado del usuario
  console.log('🔍 CotizacionesPage render:', {
    tieneUsuario: !!usuario,
    email: usuario?.email,
    role: usuario?.role,
    id: usuario?.id,
    intentos
  });
  
  // Esperar a que el usuario esté disponible (máximo 5 intentos)
  useEffect(() => {
    if (!usuario && intentos < 5) {
      const timeout = setTimeout(() => {
        setIntentos(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [usuario, intentos]);
  
  // Si no hay usuario después de varios intentos, mostrar error
  if (!usuario) {
    if (intentos >= 5) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Error al cargar usuario</p>
            <p className="text-gray-600 text-sm mb-4">No se pudo obtener la información del usuario</p>
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
    
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }
  
  console.log('✅ CotizacionesPage: Usuario disponible:', usuario.email, usuario.role);

  const esAdmin = esAdminContexto;
  const queryClient = useQueryClient();
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<Cotizacion | null>(null);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<string[]>([]);
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);

  // Obtener cotizaciones
  const { data: cotizaciones = [], isLoading, error: errorCotizaciones } = useQuery({
    queryKey: ['cotizaciones', esAdmin ? 'all' : usuario.id],
    queryFn: async () => {
      console.log('🔍 Obteniendo cotizaciones...', { esAdmin, usuarioId: usuario.id });
      try {
        const result = await obtenerCotizaciones(esAdmin ? undefined : usuario.id);
        console.log('✓ Cotizaciones obtenidas:', result.length);
        return result;
      } catch (error) {
        console.error('❌ Error al obtener cotizaciones:', error);
        throw error;
      }
    },
    enabled: !!usuario, // Solo ejecutar si hay usuario
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000 // 30 segundos
  });

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
    console.error('❌ Error al cargar cotizaciones:', errorCotizaciones);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Error al cargar cotizaciones</p>
          <p className="text-sm text-gray-600 mb-4">
            {errorCotizaciones instanceof Error ? errorCotizaciones.message : 'Error desconocido'}
          </p>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cotizaciones...</p>
          <p className="text-xs text-gray-500 mt-2">
            {esAdmin ? 'Buscando todas las cotizaciones...' : `Buscando cotizaciones de ${usuario.email}...`}
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
                    <button
                      onClick={() => generarPDF(cotizacion)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow"
                      title="Descargar PDF profesional"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDF
                    </button>
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
    </>
  );
}
