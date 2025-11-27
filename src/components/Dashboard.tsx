/**
 * Componente Dashboard
 * Muestra diferentes vistas según el rol del usuario
 * Carga datos directamente sin usar React Query para evitar problemas de timing
 */
import { useState, useEffect } from 'react';
import { obtenerCotizaciones } from '../services/cotizaciones.service';
import { obtenerMateriales } from '../services/materiales.service';
import { obtenerServicios } from '../services/servicios.service';
import { obtenerEstadisticasRentabilidad } from '../services/rentabilidad.service';
import { obtenerEstadisticasDashboard } from '../services/dashboard-stats.service';
import type { UserProfile, Cotizacion, Material, Servicio } from '../types/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  usuario: UserProfile;
}

export default function Dashboard({ usuario }: DashboardProps) {
  const esAdmin = usuario.role === 'admin';
  const [estadisticasRentabilidad, setEstadisticasRentabilidad] = useState<any>(null);
  const [cargandoRentabilidad, setCargandoRentabilidad] = useState(false);
  const [estadisticasDashboard, setEstadisticasDashboard] = useState<any>(null);
  const [cargandoDashboard, setCargandoDashboard] = useState(false);

  // Estados para datos
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(true);

  // Cargar cotizaciones
  useEffect(() => {
    const cargarCotizaciones = async () => {
      try {
        setLoadingCotizaciones(true);
        const datos = await obtenerCotizaciones(esAdmin ? undefined : usuario.id);
        setCotizaciones(datos);
      } catch (error) {
        console.error('Error al cargar cotizaciones:', error);
      } finally {
        setLoadingCotizaciones(false);
      }
    };
    cargarCotizaciones();
  }, [esAdmin, usuario.id]);

  // Cargar materiales (solo admin)
  useEffect(() => {
    if (esAdmin) {
      const cargarMateriales = async () => {
        try {
          const datos = await obtenerMateriales();
          setMateriales(datos);
        } catch (error) {
          console.error('Error al cargar materiales:', error);
        }
      };
      cargarMateriales();
    }
  }, [esAdmin]);

  // Cargar servicios (solo admin)
  useEffect(() => {
    if (esAdmin) {
      const cargarServicios = async () => {
        try {
          const datos = await obtenerServicios();
          setServicios(datos);
        } catch (error) {
          console.error('Error al cargar servicios:', error);
        }
      };
      cargarServicios();
    }
  }, [esAdmin]);

  // Cargar estadísticas de rentabilidad (solo admin)
  useEffect(() => {
    if (esAdmin) {
      const cargarRentabilidad = async () => {
        try {
          setCargandoRentabilidad(true);
          const stats = await obtenerEstadisticasRentabilidad();
          setEstadisticasRentabilidad(stats);
        } catch (error) {
          console.error('Error al cargar estadísticas de rentabilidad:', error);
        } finally {
          setCargandoRentabilidad(false);
        }
      };
      cargarRentabilidad();
    }
  }, [esAdmin]);

  // Cargar estadísticas del dashboard (solo admin)
  useEffect(() => {
    if (esAdmin) {
      const cargarDashboard = async () => {
        try {
          setCargandoDashboard(true);
          console.log('📊 Cargando estadísticas del dashboard...');
          const stats = await obtenerEstadisticasDashboard();
          console.log('✅ Estadísticas del dashboard cargadas:', stats);
          setEstadisticasDashboard(stats);
        } catch (error: any) {
          console.error('❌ Error al cargar estadísticas del dashboard:', error);
          console.error('Error completo:', error.message, error.stack);
          // No mostrar alert, solo loguear el error
        } finally {
          setCargandoDashboard(false);
        }
      };
      cargarDashboard();
    }
  }, [esAdmin, cotizaciones.length]);

  // Función auxiliar para calcular total desde items
  const calcularTotalDesdeItems = (cotizacion: any): number => {
    if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
      const subtotal = cotizacion.items.reduce((sum: number, item: any) => {
        return sum + (item.precio_total || 0);
      }, 0);
      const descuento = cotizacion.descuento || 0;
      const descuentoMonto = subtotal * (descuento / 100);
      const subtotalConDescuento = subtotal - descuentoMonto;
      const ivaPorcentaje = cotizacion.iva_porcentaje || 19;
      const iva = subtotalConDescuento * (ivaPorcentaje / 100);
      return subtotalConDescuento + iva;
    }
    return cotizacion.total || 0;
  };

  // Calcular estadísticas del mes actual (fallback si no hay estadisticasDashboard)
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  inicioMes.setHours(0, 0, 0, 0);
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
  
  const cotizacionesMes = cotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= inicioMes && fecha <= finMes;
  });

  const totalCotizaciones = cotizaciones.length;
  const totalCotizacionesMes = cotizacionesMes.length;
  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada').length;
  const cotizacionesAceptadasMes = cotizacionesMes.filter(c => c.estado === 'aceptada');
  const cotizacionesPendientesMes = cotizacionesMes.filter(c => c.estado === 'pendiente' || c.estado === 'borrador');
  
  const ventasTotales = cotizaciones
    .filter(c => c.estado === 'aceptada')
    .reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);
  
  const ventasTotalesMes = cotizacionesAceptadasMes.reduce((sum, c) => {
    const total = calcularTotalDesdeItems(c);
    return sum + total;
  }, 0);
  
  const promedioCotizacion = totalCotizaciones > 0
    ? cotizaciones.reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0) / totalCotizaciones
    : 0;


  // Calcular utilidad real si hay estadísticas
  const utilidadReal = estadisticasRentabilidad?.utilidadTotal || 0;
  const proyectosRentables = estadisticasRentabilidad?.proyectosRentables || 0;
  const proyectosConPerdidas = estadisticasRentabilidad?.proyectosConPerdidas || 0;

  // Datos para gráfico de cotizaciones por estado
  const datosEstados = [
    { name: 'Pendiente', cantidad: cotizaciones.filter(c => c.estado === 'pendiente').length },
    { name: 'Aceptada', cantidad: cotizaciones.filter(c => c.estado === 'aceptada').length },
    { name: 'Rechazada', cantidad: cotizaciones.filter(c => c.estado === 'rechazada').length }
  ];

  if (loadingCotizaciones || (esAdmin && cargandoDashboard)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {esAdmin ? 'Dashboard Administrador' : 'Mis Cotizaciones'}
      </h1>


      {/* Tarjetas de resumen - Métricas del mes actual (SIEMPRE mostrar para admin) */}
      {esAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cotizaciones con detalle de aceptadas */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-indigo-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg font-bold">📋</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Cotizaciones del Mes
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">
                      {estadisticasDashboard?.totalCotizaciones ?? totalCotizacionesMes}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Aceptadas:</span>
                  <span className="font-semibold text-green-600">
                    {estadisticasDashboard?.cotizacionesAceptadas ?? cotizacionesAceptadasMes.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-500">Pendientes:</span>
                  <span className="font-semibold text-yellow-600">
                    {estadisticasDashboard?.cotizacionesPendientes ?? cotizacionesPendientesMes.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ventas Totales del Mes */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ventas del Mes
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      ${(estadisticasDashboard?.ventasTotalesMes ?? ventasTotalesMes).toLocaleString('es-CO')}
                    </dd>
                    {estadisticasDashboard?.variacionVentas !== undefined && estadisticasDashboard.variacionVentas !== 0 && (
                      <dd className={`text-xs mt-1 ${estadisticasDashboard.variacionVentas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {estadisticasDashboard.variacionVentas >= 0 ? '↑' : '↓'} {Math.abs(estadisticasDashboard.variacionVentas).toFixed(1)}% vs mes anterior
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Gastos en Materiales del Mes */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg font-bold">🛒</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Gastos en Materiales
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      ${(estadisticasDashboard?.gastosMaterialesMes ?? 0).toLocaleString('es-CO')}
                    </dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      Mes actual
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Ganancia del Mes */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    (estadisticasDashboard?.gananciaMes ?? (ventasTotalesMes - (estadisticasDashboard?.gastosMaterialesMes ?? 0))) >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    <span className="text-white text-lg font-bold">📈</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ganancia del Mes
                    </dt>
                    <dd className={`text-2xl font-bold ${
                      (estadisticasDashboard?.gananciaMes ?? (ventasTotalesMes - (estadisticasDashboard?.gastosMaterialesMes ?? 0))) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${(estadisticasDashboard?.gananciaMes ?? (ventasTotalesMes - (estadisticasDashboard?.gastosMaterialesMes ?? 0))).toLocaleString('es-CO')}
                    </dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      Ventas - Gastos
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de resumen - Solo para no-admin */}
      {!esAdmin && (
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
      )}

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

      {/* Sección de Rentabilidad (solo admin) */}
      {esAdmin && !cargandoRentabilidad && estadisticasRentabilidad && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">📊 Control de Rentabilidad</h2>

          {/* Tarjetas de rentabilidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">💰</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Utilidad Total
                      </dt>
                      <dd className={`text-lg font-medium ${utilidadReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${utilidadReal.toLocaleString('es-CO')}
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
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Proyectos Rentables
                      </dt>
                      <dd className="text-lg font-medium text-green-600">
                        {proyectosRentables}
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
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">⚠</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Proyectos con Pérdidas
                      </dt>
                      <dd className="text-lg font-medium text-red-600">
                        {proyectosConPerdidas}
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
                      <span className="text-white text-sm font-bold">🐜</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Gastos Hormiga
                      </dt>
                      <dd className="text-lg font-medium text-yellow-600">
                        ${estadisticasRentabilidad.totalGastosHormiga.toLocaleString('es-CO')}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top proyectos más rentables */}
          {estadisticasRentabilidad.proyectos.length > 0 && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Top Proyectos Más Rentables
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proyecto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cotizado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Real</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {estadisticasRentabilidad.proyectos.slice(0, 10).map((proyecto: any) => (
                        <tr key={proyecto.cotizacion_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {proyecto.numero}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {proyecto.cliente_nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${proyecto.total_cotizado.toLocaleString('es-CO')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${proyecto.total_real.toLocaleString('es-CO')}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            proyecto.utilidad >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${proyecto.utilidad.toLocaleString('es-CO')}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            proyecto.porcentaje_utilidad >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {proyecto.porcentaje_utilidad.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={`/cotizaciones/${proyecto.cotizacion_id}/costos`}
                              className="text-indigo-600 hover:text-indigo-800 text-sm"
                            >
                              Ver Costos
                            </a>
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
      )}
    </div>
  );
}


