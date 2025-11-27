/**
 * Dashboard de métricas de gastos fijos
 */
import { useState, useEffect } from 'react';
import { obtenerEstadisticasGastosFijos } from '../../services/fixed-expenses.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardGastosFijos() {
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  });

  useEffect(() => {
    cargarEstadisticas();
  }, [filtros]);

  const cargarEstadisticas = async () => {
    try {
      setCargando(true);
      const stats = await obtenerEstadisticasGastosFijos({
        mes: filtros.mes,
        anio: filtros.anio
      });
      setEstadisticas(stats);
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
      // No mostrar alert si es un error de autenticación (se manejará en el componente padre)
      const esErrorAuth = error?.message?.includes('JWT') || 
                         error?.message?.includes('authentication') || 
                         error?.message?.includes('session') ||
                         error?.code === 'PGRST301';
      
      if (esErrorAuth) {
        console.log('Error de autenticación, esperando carga de usuario...');
        setCargando(false);
        return;
      }
      
      // Solo mostrar error si no es un problema de autenticación
      alert('Error al cargar estadísticas: ' + (error.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  };

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const anios = Array.from({ length: 5 }, (_, i) => {
    const anio = new Date().getFullYear() - i;
    return { value: anio, label: anio.toString() };
  });

  // Colores para gráfico de torta
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16', '#F97316'];

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  // Preparar datos para gráfico de barras por meses
  const datosMeses = estadisticas.totalPorMes.map((item: any) => {
    const [anio, mes] = item.mes.split('-');
    const nombreMes = meses[parseInt(mes) - 1]?.label || mes;
    return {
      mes: nombreMes,
      total: item.total
    };
  });

  // Preparar datos para gráfico de torta por categoría
  const datosCategorias = estadisticas.totalPorCategoria.map((item: any) => ({
    name: item.categoria,
    value: item.total
  }));

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select
              value={filtros.mes}
              onChange={(e) => setFiltros({ ...filtros, mes: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {meses.map((mes) => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              value={filtros.anio}
              onChange={(e) => setFiltros({ ...filtros, anio: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {anios.map((anio) => (
                <option key={anio.value} value={anio.value}>{anio.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total del Mes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${estadisticas.totalMes.toLocaleString('es-CO')}
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
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Categorías
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.totalPorCategoria.length}
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
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Promedio Mensual
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${estadisticas.totalPorMes.length > 0
                      ? (estadisticas.totalPorMes.reduce((sum: number, m: any) => sum + m.total, 0) / estadisticas.totalPorMes.length).toLocaleString('es-CO', { maximumFractionDigits: 0 })
                      : '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras por meses */}
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Gastos por Mes (Últimos 12 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosMeses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-CO')}`} />
              <Legend />
              <Bar dataKey="total" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de torta por categoría */}
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Distribución por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosCategorias}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {datosCategorias.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-CO')}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de total por categoría */}
      {estadisticas.totalPorCategoria.length > 0 && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Total por Categoría
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% del Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estadisticas.totalPorCategoria.map((item: any, index: number) => {
                    const porcentaje = estadisticas.totalMes > 0
                      ? (item.total / estadisticas.totalMes * 100).toFixed(1)
                      : '0';
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium text-gray-900">{item.categoria}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          ${item.total.toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${porcentaje}%`,
                                  backgroundColor: COLORS[index % COLORS.length]
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-500">{porcentaje}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Top 5 gastos más altos */}
      {estadisticas.top5Gastos.length > 0 && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Top 5 Gastos Más Altos
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estadisticas.top5Gastos.map((gasto: any) => (
                    <tr key={gasto.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(gasto.date).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {gasto.category ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                            {gasto.category.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Sin categoría</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{gasto.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">
                        ${gasto.amount.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {gasto.provider || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

