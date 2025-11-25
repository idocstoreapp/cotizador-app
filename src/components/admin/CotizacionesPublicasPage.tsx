/**
 * Página de administración para ver cotizaciones públicas
 * Solo accesible para administradores
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerCotizacionesPublicas, actualizarEstadoCotizacionPublica } from '../../services/cotizaciones-publicas.service';
import type { CotizacionPublica } from '../../services/cotizaciones-publicas.service';

export default function CotizacionesPublicasPage() {
  const queryClient = useQueryClient();
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'contactado' | 'cerrado'>('todos');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<CotizacionPublica | null>(null);

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones-publicas'],
    queryFn: obtenerCotizacionesPublicas
  });

  const actualizarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'pendiente' | 'contactado' | 'cerrado' }) =>
      actualizarEstadoCotizacionPublica(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-publicas'] });
    }
  });

  const cotizacionesFiltradas = filtroEstado === 'todos'
    ? cotizaciones
    : cotizaciones.filter(c => c.estado === filtroEstado);

  const estadisticas = {
    total: cotizaciones.length,
    pendientes: cotizaciones.filter(c => c.estado === 'pendiente').length,
    contactados: cotizaciones.filter(c => c.estado === 'contactado').length,
    cerrados: cotizaciones.filter(c => c.estado === 'cerrado').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cotizaciones Públicas</h1>
        <p className="text-gray-600 mt-2">Historial de cotizaciones desde el catálogo público</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
          <div className="text-sm text-yellow-700">Pendientes</div>
          <div className="text-2xl font-bold text-yellow-900">{estadisticas.pendientes}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <div className="text-sm text-blue-700">Contactados</div>
          <div className="text-2xl font-bold text-blue-900">{estadisticas.contactados}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <div className="text-sm text-green-700">Cerrados</div>
          <div className="text-2xl font-bold text-green-900">{estadisticas.cerrados}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filtroEstado === 'todos'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroEstado('pendiente')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filtroEstado === 'pendiente'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFiltroEstado('contactado')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filtroEstado === 'contactado'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Contactados
          </button>
          <button
            onClick={() => setFiltroEstado('cerrado')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filtroEstado === 'cerrado'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cerrados
          </button>
        </div>
      </div>

      {/* Lista de cotizaciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cotizacionesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No hay cotizaciones {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : ''}
                </td>
              </tr>
            ) : (
              cotizacionesFiltradas.map((cotizacion) => (
                <tr key={cotizacion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(cotizacion.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cotizacion.nombre_cliente}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{cotizacion.email_cliente || '-'}</div>
                    <div className="text-xs">{cotizacion.telefono_cliente || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${cotizacion.total.toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      cotizacion.metodo_contacto === 'whatsapp'
                        ? 'bg-green-100 text-green-800'
                        : cotizacion.metodo_contacto === 'email'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {cotizacion.metodo_contacto === 'whatsapp' ? '💬 WhatsApp' :
                       cotizacion.metodo_contacto === 'email' ? '📧 Email' :
                       '📝 Formulario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={cotizacion.estado}
                      onChange={(e) => {
                        actualizarEstadoMutation.mutate({
                          id: cotizacion.id,
                          estado: e.target.value as 'pendiente' | 'contactado' | 'cerrado'
                        });
                      }}
                      className={`text-xs font-medium rounded px-2 py-1 border ${
                        cotizacion.estado === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          : cotizacion.estado === 'contactado'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-green-100 text-green-800 border-green-300'
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="contactado">Contactado</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setCotizacionSeleccionada(cotizacion)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de detalles */}
      {cotizacionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Detalles de la Cotización</h2>
                <button
                  onClick={() => setCotizacionSeleccionada(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Información del Cliente</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Nombre:</span> {cotizacionSeleccionada.nombre_cliente}</p>
                    {cotizacionSeleccionada.email_cliente && (
                      <p><span className="font-medium">Email:</span> {cotizacionSeleccionada.email_cliente}</p>
                    )}
                    {cotizacionSeleccionada.telefono_cliente && (
                      <p><span className="font-medium">Teléfono:</span> {cotizacionSeleccionada.telefono_cliente}</p>
                    )}
                    {cotizacionSeleccionada.mensaje_cliente && (
                      <p><span className="font-medium">Mensaje:</span> {cotizacionSeleccionada.mensaje_cliente}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Items Cotizados</h3>
                  <div className="space-y-2">
                    {Array.isArray(cotizacionSeleccionada.items) && cotizacionSeleccionada.items.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">{item.mueble?.nombre || 'Item'}</p>
                        {item.opciones && (
                          <div className="text-sm text-gray-600 mt-1">
                            {item.opciones.material_puertas && (
                              <p>Material de Puertas: {item.opciones.material_puertas}</p>
                            )}
                            {item.opciones.tipo_topes && (
                              <p>Tipo de Topes: {item.opciones.tipo_topes}</p>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                        <p className="text-sm font-medium">Total: ${item.precio_total?.toLocaleString('es-CO')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Totales</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">${cotizacionSeleccionada.subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA ({cotizacionSeleccionada.iva}%):</span>
                      <span className="font-medium">
                        ${((cotizacionSeleccionada.total - cotizacionSeleccionada.subtotal)).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-indigo-600">${cotizacionSeleccionada.total.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Fecha: {new Date(cotizacionSeleccionada.created_at).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

