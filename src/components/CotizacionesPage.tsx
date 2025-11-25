/**
 * Página de listado de cotizaciones
 * Muestra todas las cotizaciones (admin) o solo las del usuario (técnico)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerCotizaciones, cambiarEstadoCotizacion } from '../services/cotizaciones.service';
import { obtenerUsuarios } from '../services/usuarios.service';
import type { UserProfile } from '../types/database';
import type { Cotizacion } from '../types/database';

interface CotizacionesPageProps {
  usuario: UserProfile;
}

export default function CotizacionesPage({ usuario }: CotizacionesPageProps) {
  const esAdmin = usuario.role === 'admin';
  const queryClient = useQueryClient();
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<Cotizacion | null>(null);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<string[]>([]);
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);

  // Obtener cotizaciones
  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones', esAdmin ? 'all' : usuario.id],
    queryFn: () => obtenerCotizaciones(esAdmin ? undefined : usuario.id)
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
   * Genera el PDF de una cotización
   */
  const generarPDF = (cotizacionId: string) => {
    window.open(`/api/generar-pdf?id=${cotizacionId}`, '_blank');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {esAdmin ? 'Todas las Cotizaciones' : 'Mis Cotizaciones'}
        </h1>

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
                <tr key={cotizacion.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cotizacion.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cotizacion.cliente_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${cotizacion.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={cotizacion.estado}
                      onChange={(e) => handleCambiarEstado(cotizacion, e.target.value)}
                      className={`text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(cotizacion.usuario as any)?.nombre || (cotizacion.usuario as any)?.email || 'N/A'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cotizacion.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => generarPDF(cotizacion.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
