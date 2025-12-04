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
import DashboardVendedor from './DashboardVendedor';
import type { UserProfile, Cotizacion, Material, Servicio } from '../types/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  usuario: UserProfile;
}

export default function Dashboard({ usuario }: DashboardProps) {
  const esAdmin = usuario.role === 'admin';
  const esVendedor = usuario.role === 'vendedor';
  
  // Si es vendedor, mostrar dashboard específico
  if (esVendedor) {
    return <DashboardVendedor usuario={usuario} />;
  }
  const [estadisticasRentabilidad, setEstadisticasRentabilidad] = useState<any>(null);
  const [cargandoRentabilidad, setCargandoRentabilidad] = useState(false);
  const [estadisticasDashboard, setEstadisticasDashboard] = useState<any>(null);
  const [cargandoDashboard, setCargandoDashboard] = useState(false);

  // Estados para datos
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(true);

  // Estado para mes/año seleccionado
  const ahora = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(ahora.getMonth());
  const [añoSeleccionado, setAñoSeleccionado] = useState<number>(ahora.getFullYear());

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
          console.log('📊 Cargando estadísticas del dashboard...', { mes: mesSeleccionado, año: añoSeleccionado });
          const stats = await obtenerEstadisticasDashboard(mesSeleccionado, añoSeleccionado);
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
  }, [esAdmin, mesSeleccionado, añoSeleccionado]);

  // Función auxiliar para obtener el total de la cotización
  // IMPORTANTE: Usa siempre el total guardado para evitar inconsistencias
  const calcularTotalDesdeItems = (cotizacion: any): number => {
    // Siempre usar el total guardado (precio cotizado original)
    // No recalcular desde items porque pueden tener materiales modificados
    return cotizacion.total || 0;
    
    /* Código anterior comentado - no recalcular desde items
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
    */
  };

  // Calcular estadísticas del mes seleccionado (fallback si no hay estadisticasDashboard)
  const inicioMes = new Date(añoSeleccionado, mesSeleccionado, 1);
  inicioMes.setHours(0, 0, 0, 0);
  const finMes = new Date(añoSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);
  
  const cotizacionesMes = cotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= inicioMes && fecha <= finMes;
  });

  const totalCotizaciones = cotizaciones.length;
  const totalCotizacionesMes = cotizacionesMes.length;
  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada').length;
  const cotizacionesAceptadasMes = cotizacionesMes.filter(c => c.estado === 'aceptada');
  const cotizacionesPendientesMes = cotizacionesMes.filter(c => c.estado === 'pendiente');
  
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
        <>
          {/* Selector de mes/año */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">📅 Seleccionar período:</label>
                <div className="flex items-center gap-2">
                  <select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={0}>Enero</option>
                    <option value={1}>Febrero</option>
                    <option value={2}>Marzo</option>
                    <option value={3}>Abril</option>
                    <option value={4}>Mayo</option>
                    <option value={5}>Junio</option>
                    <option value={6}>Julio</option>
                    <option value={7}>Agosto</option>
                    <option value={8}>Septiembre</option>
                    <option value={9}>Octubre</option>
                    <option value={10}>Noviembre</option>
                    <option value={11}>Diciembre</option>
                  </select>
                  <select
                    value={añoSeleccionado}
                    onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const año = ahora.getFullYear() - 2 + i;
                      return (
                        <option key={año} value={año}>
                          {año}
                        </option>
                      );
                    })}
                  </select>
                  {(mesSeleccionado !== ahora.getMonth() || añoSeleccionado !== ahora.getFullYear()) && (
                    <button
                      onClick={() => {
                        setMesSeleccionado(ahora.getMonth());
                        setAñoSeleccionado(ahora.getFullYear());
                      }}
                      className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      📍 Mes actual
                    </button>
                  )}
                </div>
              </div>
              {cargandoDashboard && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  Cargando...
                </div>
              )}
            </div>
          </div>


          {/* Primera fila: Cotizaciones, Ventas, Costos Totales, Ganancia */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Cotizaciones */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-indigo-500">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg font-bold">📋</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <dt className="text-sm font-medium text-gray-500">Cotizaciones Creadas</dt>
                      <dd className="text-2xl font-bold text-gray-900 mt-1">
                        {estadisticasDashboard?.totalCotizaciones ?? totalCotizacionesMes}
                      </dd>
                      <p className="text-xs text-gray-400 mt-1">Este mes</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">✅ Aceptadas:</span>
                    <span className="font-semibold text-green-600">
                      {estadisticasDashboard?.cotizacionesAceptadas ?? cotizacionesAceptadasMes.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">⏳ Pendientes:</span>
                    <span className="font-semibold text-yellow-600">
                      {estadisticasDashboard?.cotizacionesPendientes ?? cotizacionesPendientesMes.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ventas del Mes */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg font-bold">💰</span>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Ventas del Mes</dt>
                      <dd className="text-2xl font-bold text-blue-600">
                        ${(estadisticasDashboard?.ventasTotalesMes ?? ventasTotalesMes).toLocaleString('es-CO')}
                      </dd>
                      <p className="text-xs text-gray-400 mt-1">Total de cotizaciones aceptadas</p>
                      {estadisticasDashboard?.variacionVentas !== undefined && estadisticasDashboard.variacionVentas !== 0 && (
                        <dd className={`text-xs mt-1 font-medium ${estadisticasDashboard.variacionVentas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {estadisticasDashboard.variacionVentas >= 0 ? '↑' : '↓'} {Math.abs(estadisticasDashboard.variacionVentas).toFixed(1)}% vs mes anterior
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Costos Totales del Mes - Dividido en 2 partes */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Costos Reales</dt>
                      <dd className="text-2xl font-bold text-red-600">
                        ${(estadisticasDashboard?.costosTotalesMes ?? 0).toLocaleString('es-CO')}
                      </dd>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">Materiales + Mano Obra</p>
                          <p className="text-sm font-semibold text-orange-600">
                            ${((estadisticasDashboard?.gastosMaterialesMes ?? 0) + (estadisticasDashboard?.gastosManoObraMes ?? 0)).toLocaleString('es-CO')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">IVA (Utilidades)</p>
                          <p className="text-sm font-semibold text-indigo-600">
                            ${(estadisticasDashboard?.ivaRealMes ?? 0).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Ganancia Real del Mes */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      (estadisticasDashboard?.gananciaMes ?? 0) >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <span className="text-white text-lg font-bold">📈</span>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Ganancia Neta</dt>
                      <dd className={`text-2xl font-bold ${
                        (estadisticasDashboard?.gananciaMes ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${(estadisticasDashboard?.gananciaMes ?? 0).toLocaleString('es-CO')}
                      </dd>
                      <p className="text-xs text-gray-400 mt-1">
                        Ventas - Costos | Margen: {(estadisticasDashboard?.margenGananciaMes ?? 0).toFixed(1)}%
                      </p>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segunda fila: Desglose de Costos */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">💸 Desglose de Costos Reales del Mes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium">🛒 Materiales</p>
                <p className="text-xl font-bold text-orange-600">
                  ${(estadisticasDashboard?.gastosMaterialesMes ?? 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-orange-600 mt-1">Compras de materiales</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800 font-medium">👷 Mano de Obra</p>
                <p className="text-xl font-bold text-purple-600">
                  ${(estadisticasDashboard?.gastosManoObraMes ?? 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-purple-600 mt-1">Pagos a trabajadores</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium">🐜 Gastos Hormiga</p>
                <p className="text-xl font-bold text-yellow-600">
                  ${(estadisticasDashboard?.gastosHormigaMes ?? 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Gastos menores</p>
              </div>
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <p className="text-sm text-cyan-800 font-medium">🚚 Transporte</p>
                <p className="text-xl font-bold text-cyan-600">
                  ${(estadisticasDashboard?.gastosTransporteMes ?? 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-cyan-600 mt-1">Fletes y envíos</p>
              </div>
            </div>
          </div>

          {/* Tercera fila: Histórico */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">📊 Totales Históricos (Desde el inicio)</h3>
                <p className="text-xs text-gray-600 mt-1">Suma de todas las cotizaciones aceptadas y costos registrados históricamente</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total de cotizaciones:</p>
                <p className="text-sm font-bold text-gray-700">{cotizaciones.length}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-1">💰 Ventas Totales</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(estadisticasDashboard?.ventasTotalesHistorico ?? ventasTotales).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Todas las cotizaciones aceptadas</p>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  {cotizaciones.filter(c => c.estado === 'aceptada').length} aceptadas
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-1">📊 Costos Totales</p>
                <p className="text-2xl font-bold text-red-600">
                  ${(estadisticasDashboard?.costosTotalesHistorico ?? 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Todos los gastos reales registrados</p>
                <p className="text-xs text-red-600 mt-2 font-medium">
                  Materiales + M.Obra + Otros
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-1">📈 Ganancia Acumulada</p>
                <p className={`text-2xl font-bold ${(estadisticasDashboard?.gananciaHistorica ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(estadisticasDashboard?.gananciaHistorica ?? 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ventas - Costos (histórico)</p>
                {estadisticasDashboard?.ventasTotalesHistorico && estadisticasDashboard.ventasTotalesHistorico > 0 && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    Margen: {((estadisticasDashboard.gananciaHistorica / estadisticasDashboard.ventasTotalesHistorico) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
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

      {/* Estadísticas adicionales para admin - Catálogo */}
      {esAdmin && (
        <div className="bg-white overflow-hidden shadow rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Catálogo de Productos</h3>
          <p className="text-sm text-gray-600 mb-4">
            Estos son los materiales y servicios disponibles en tu catálogo para usar en las cotizaciones.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Materiales en Catálogo</p>
                  <p className="text-3xl font-bold text-orange-600">{materiales.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Materiales disponibles para cotizar (madera, MDF, tornillos, etc.)</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Servicios de Mano de Obra</p>
                  <p className="text-3xl font-bold text-purple-600">{servicios.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Tipos de trabajo disponibles (corte, armado, instalación, etc.)</p>
                </div>
              </div>
            </div>
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


