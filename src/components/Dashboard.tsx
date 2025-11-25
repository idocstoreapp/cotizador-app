/**
 * Componente Dashboard
 * Muestra diferentes vistas según el rol del usuario
 */
import { useQuery } from '@tanstack/react-query';
import { obtenerCotizaciones } from '../services/cotizaciones.service';
import { obtenerMateriales } from '../services/materiales.service';
import { obtenerServicios } from '../services/servicios.service';
import type { UserProfile } from '../types/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  usuario: UserProfile;
}

export default function Dashboard({ usuario }: DashboardProps) {
  const esAdmin = usuario.role === 'admin';

  // Obtener datos según el rol
  const { data: cotizaciones = [], isLoading: loadingCotizaciones } = useQuery({
    queryKey: ['cotizaciones', esAdmin ? 'all' : usuario.id],
    queryFn: () => obtenerCotizaciones(esAdmin ? undefined : usuario.id)
  });

  const { data: materiales = [] } = useQuery({
    queryKey: ['materiales'],
    queryFn: obtenerMateriales,
    enabled: esAdmin // Solo cargar si es admin
  });

  const { data: servicios = [] } = useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios,
    enabled: esAdmin // Solo cargar si es admin
  });

  // Calcular estadísticas
  const totalCotizaciones = cotizaciones.length;
  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada').length;
  const ventasTotales = cotizaciones
    .filter(c => c.estado === 'aceptada')
    .reduce((sum, c) => sum + c.total, 0);
  const promedioCotizacion = totalCotizaciones > 0
    ? cotizaciones.reduce((sum, c) => sum + c.total, 0) / totalCotizaciones
    : 0;

  // Datos para gráfico de cotizaciones por estado
  const datosEstados = [
    { name: 'Pendiente', cantidad: cotizaciones.filter(c => c.estado === 'pendiente').length },
    { name: 'Aceptada', cantidad: cotizaciones.filter(c => c.estado === 'aceptada').length },
    { name: 'Rechazada', cantidad: cotizaciones.filter(c => c.estado === 'rechazada').length }
  ];

  if (loadingCotizaciones) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {esAdmin ? 'Dashboard Administrador' : 'Mis Cotizaciones'}
      </h1>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Cotizaciones
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalCotizaciones}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aceptadas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {cotizacionesAceptadas}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ventas Totales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${ventasTotales.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Ø</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Promedio
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${promedioCotizacion.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales para admin */}
      {esAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Materiales</h3>
            <p className="text-3xl font-bold text-indigo-600">{materiales.length}</p>
            <p className="text-sm text-gray-500">Materiales registrados</p>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Servicios</h3>
            <p className="text-3xl font-bold text-indigo-600">{servicios.length}</p>
            <p className="text-sm text-gray-500">Servicios registrados</p>
          </div>
        </div>
      )}

      {/* Gráfico de cotizaciones por estado */}
      <div className="bg-white overflow-hidden shadow rounded-lg p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Cotizaciones por Estado
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosEstados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lista reciente de cotizaciones */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cotizaciones Recientes
          </h3>
          <div className="overflow-x-auto">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cotizaciones.slice(0, 10).map((cotizacion) => (
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cotizacion.estado === 'aceptada' ? 'bg-green-100 text-green-800' :
                        cotizacion.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cotizacion.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cotizacion.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


