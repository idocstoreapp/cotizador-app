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
import { obtenerEstadisticasDashboard, type EstadisticasDashboard }  from '../services/dashboard-stats.service';
import { obtenerLiquidacionesPorFecha } from '../services/liquidaciones.service';
import DashboardVendedor from './DashboardVendedor';

import { obtenerSaldoDisponible } from '../services/saldo-disponible.service';
import type { UserProfile, Cotizacion, Material, Servicio, Liquidacion } from '../types/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  const [saldo, setSaldo] = useState<any>(null);
  const [estadisticasDashboard, setEstadisticasDashboard] = useState<EstadisticasDashboard | null>(null);
  const [cargandoDashboard, setCargandoDashboard] = useState(false);
  const [liquidacionesMes, setLiquidacionesMes] = useState<Liquidacion[]>([]);
  const [cargandoLiquidaciones, setCargandoLiquidaciones] = useState(false);

  // Estados para datos
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(true);

  // Estado para filtros de fecha
  const ahora = new Date();
  const [tipoFiltro, setTipoFiltro] = useState<'mes' | 'semana' | 'rango'>('mes');
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(ahora.getMonth());
  const [añoSeleccionado, setAñoSeleccionado] = useState<number>(ahora.getFullYear());
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [semanasAtras, setSemanasAtras] = useState<number>(1);
  const [mesesAtras, setMesesAtras] = useState<number>(1);

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

  useEffect(() => {
  const cargarSaldo = async () => {
    const s = await obtenerSaldoDisponible();
    console.log('SALDO REAL:', s);
    setSaldo(s);
  };
  cargarSaldo();
}, []);

  // Calcular fechas según el tipo de filtro
  const calcularFechasFiltro = () => {
    let inicio: Date;
    let fin: Date = new Date();
    fin.setHours(23, 59, 59, 999);

    switch (tipoFiltro) {
      case 'semana':
        // Últimas N semanas desde hoy
        inicio = new Date();
        inicio.setDate(inicio.getDate() - (semanasAtras * 7));
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'rango':
        // Rango personalizado
        if (fechaInicio && fechaFin) {
          inicio = new Date(fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
        } else {
          // Si no hay fechas, usar mes actual como fallback
          inicio = new Date(añoSeleccionado, mesSeleccionado, 1);
          inicio.setHours(0, 0, 0, 0);
          fin = new Date(añoSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);
        }
        break;
      case 'mes':
      default:
        // Mes seleccionado
        inicio = new Date(añoSeleccionado, mesSeleccionado, 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(añoSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);
        break;
    }

    return { inicio, fin };
  };

  // Cargar liquidaciones según el filtro seleccionado (solo admin)
  useEffect(() => {
    if (esAdmin) {
      const cargarLiquidaciones = async () => {
        try {
          setCargandoLiquidaciones(true);
          const { inicio, fin } = calcularFechasFiltro();
          const fechaInicioStr = inicio.toISOString().split('T')[0];
          const fechaFinStr = fin.toISOString().split('T')[0];
          const datos = await obtenerLiquidacionesPorFecha(fechaInicioStr, fechaFinStr);
          setLiquidacionesMes(datos);
        } catch (error) {
          console.error('Error al cargar liquidaciones:', error);
        } finally {
          setCargandoLiquidaciones(false);
        }
      };
      cargarLiquidaciones();
    }
  }, [esAdmin, tipoFiltro, mesSeleccionado, añoSeleccionado, fechaInicio, fechaFin, semanasAtras, mesesAtras]);


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
          const { inicio, fin } = calcularFechasFiltro();
          const fechaInicioStr = inicio.toISOString().split('T')[0];
          const fechaFinStr = fin.toISOString().split('T')[0];
          console.log('📊 Cargando estadísticas del dashboard...', { tipoFiltro, fechaInicioStr, fechaFinStr, mes: mesSeleccionado, año: añoSeleccionado });
          const stats = await obtenerEstadisticasDashboard(fechaInicioStr, fechaFinStr, mesSeleccionado, añoSeleccionado);
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
  }, [esAdmin, tipoFiltro, mesSeleccionado, añoSeleccionado, fechaInicio, fechaFin, semanasAtras, mesesAtras]);

  
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

  // Calcular estadísticas del período seleccionado (fallback si no hay estadisticasDashboard)
  const { inicio: inicioPeriodo, fin: finPeriodo } = calcularFechasFiltro();
  
  const cotizacionesPeriodo = cotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    return fecha >= inicioPeriodo && fecha <= finPeriodo;
  });

  const totalCotizaciones = cotizaciones.length;
  const totalCotizacionesPeriodo = cotizacionesPeriodo.length;
  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada').length;
  const cotizacionesAceptadasPeriodo = cotizacionesPeriodo.filter(c => c.estado === 'aceptada');
  const cotizacionesPendientesPeriodo = cotizacionesPeriodo.filter(c => c.estado === 'pendiente');
  
  const ventasTotales = cotizaciones
    .filter(c => c.estado === 'aceptada')
    .reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);
  
  const ventasTotalesPeriodo = cotizacionesAceptadasPeriodo.reduce((sum, c) => {
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

  const COLORS_ESTADOS = ['#F59E0B', '#10B981', '#EF4444'];

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
          {/* Selector de período */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="text-sm font-medium text-gray-700">📅 Filtrar por:</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Selector de tipo de filtro */}
                  <select
                    value={tipoFiltro}
                    onChange={(e) => {
                      setTipoFiltro(e.target.value as 'mes' | 'semana' | 'rango');
                      // Resetear fechas cuando cambia el tipo
                      if (e.target.value === 'rango') {
                        setFechaInicio('');
                        setFechaFin('');
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="mes">Mes</option>
                    <option value="semana">Semanas</option>
                    <option value="rango">Rango personalizado</option>
                  </select>

                  {/* Campos según el tipo de filtro */}
                  {tipoFiltro === 'mes' && (
                    <>
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
                    </>
                  )}

                  {tipoFiltro === 'semana' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Últimas</label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={semanasAtras}
                        onChange={(e) => setSemanasAtras(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <label className="text-xs text-gray-600">semanas</label>
                    </div>
                  )}

                  {tipoFiltro === 'rango' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Desde:</label>
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <label className="text-xs text-gray-600">Hasta:</label>
                      <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        min={fechaInicio}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
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
            {/* Mostrar rango de fechas seleccionado */}
            {(() => {
              const { inicio, fin } = calcularFechasFiltro();
              return (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    📆 Período: {inicio.toLocaleDateString('es-CO')} - {fin.toLocaleDateString('es-CO')}
                  </p>
                </div>
              );
            })()}
          </div>


          {/* Primera fila: Cotizaciones, Ventas, Cotizaciones en Proceso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Total Cotizaciones */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-indigo-500 min-h-0 flex flex-col">
              <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm sm:text-lg font-bold">📋</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <dt className="text-[clamp(0.625rem,0.5rem+0.5vw,0.875rem)] font-medium text-gray-500 leading-tight">Cotizaciones creadas</dt>
                    <dd className="text-[clamp(1.25rem,1rem+1vw,1.5rem)] font-bold text-gray-900 mt-0.5 sm:mt-1 leading-tight">
                      {estadisticasDashboard?.totalCotizaciones ?? totalCotizacionesPeriodo}
                    </dd>
                    <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-400 mt-0.5 leading-tight">Cantidad en el período seleccionado</p>
                  </div>
                </div>
                <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-200 space-y-1">
                  <div className="flex items-center justify-between text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)]">
                    <span className="text-gray-500 truncate">✅ Aceptadas:</span>
                    <span className="font-semibold text-green-600 ml-1 flex-shrink-0">
                      {estadisticasDashboard?.cotizacionesAceptadas ?? cotizacionesAceptadasPeriodo.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)]">
                    <span className="text-gray-500 truncate">⏳ Pendientes:</span>
                    <span className="font-semibold text-yellow-600 ml-1 flex-shrink-0">
                      {estadisticasDashboard?.cotizacionesPendientes ?? cotizacionesPendientesPeriodo.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cobros del período (DINERO ENTRADO) */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500 min-h-0 flex flex-col">
              <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm sm:text-lg font-bold">💰</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <dl>
                      <dt className="text-[clamp(0.625rem,0.5rem+0.5vw,0.875rem)] font-medium text-gray-500 truncate leading-tight">Cobros del período</dt>
                      <dd className="text-[clamp(0.875rem,0.75rem+0.6vw,1.5rem)] font-bold text-blue-600 leading-tight mt-0.5 sm:mt-1 break-all">
                        ${(estadisticasDashboard?.cobrosTotalesPeriodo ?? 0).toLocaleString('es-CO')}
                      </dd>
                      <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-400 mt-1 leading-tight">
                        Dinero realmente entrado en el rango (según fecha de pago). No incluye lo “por cobrar”.
                      </p>
                      <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-500 mt-1 leading-tight">
                        Ventas “pagadas completas” (total de cotización): ${(estadisticasDashboard?.ventasTotalesMes ?? 0).toLocaleString('es-CO')}
                      </p>
                      {estadisticasDashboard?.variacionVentas !== undefined && estadisticasDashboard.variacionVentas !== 0 && (
                        <dd className={`text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] mt-1 font-medium leading-tight ${estadisticasDashboard.variacionVentas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {estadisticasDashboard.variacionVentas >= 0 ? '↑' : '↓'} {Math.abs(estadisticasDashboard.variacionVentas).toFixed(1)}% vs mes anterior
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Cotizaciones Aceptadas en Proceso */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-orange-500 min-h-0 flex flex-col">
              <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                <div className="flex items-start gap-2 sm:gap-3 mb-2 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm sm:text-lg font-bold">⏳</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <dl>
                      <dt className="text-[clamp(0.625rem,0.5rem+0.5vw,0.875rem)] font-medium text-gray-500 truncate leading-tight">Por cobrar</dt>
                      <dd className="text-[clamp(1.25rem,1rem+1vw,1.5rem)] font-bold text-orange-600 leading-tight mt-0.5 sm:mt-1 break-all">
                        ${(estadisticasDashboard?.totalPendiente ?? 0).toLocaleString('es-CO')}
                      </dd>
                      <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-400 mt-0.5 sm:mt-1 leading-tight">
                        {(estadisticasDashboard?.cotizacionesAceptadasEnProceso ?? 0)} cotizaciones aceptadas sin cobrar total
                      </p>
                    </dl>
                  </div>
                </div>
                <div className="mt-auto pt-2 border-t border-gray-200 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <div className="min-w-0">
                      <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-500 leading-tight truncate">📋 En proceso:</p>
                      <p className="text-[clamp(0.75rem,0.625rem+0.4vw,0.875rem)] font-semibold text-orange-600 leading-tight truncate">
                        {estadisticasDashboard?.cotizacionesAceptadasEnProceso ?? 0}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-500 leading-tight truncate">💰 Abonado (en el período):</p>
                      <p className="text-[clamp(0.625rem,0.5rem+0.4vw,0.875rem)] font-semibold text-blue-600 leading-tight break-all">
                        ${(estadisticasDashboard?.cobrosTotalesPeriodo ?? 0).toLocaleString('es-CO')}
                      </p>
                      <p className="text-[0.65rem] text-gray-400 mt-0.5 leading-tight">
                        Mismo dato que “Cobros del período” (dinero físico entrado en el rango)
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-500 leading-tight truncate">✅ Cobradas (total):</p>
                    <p className="text-[clamp(0.625rem,0.5rem+0.4vw,0.875rem)] font-semibold text-green-600 leading-tight break-all">
                      {estadisticasDashboard?.cotizacionesPagadasCompletamente ?? 0} cotizaciones
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segunda fila: Costos Totales, Ganancia, Pagos a Personal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Costos Totales del Mes - Dividido en 2 partes */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-500 min-h-0 flex flex-col">
              <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                <div className="flex items-start gap-2 sm:gap-3 mb-2 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm sm:text-lg font-bold">📊</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <dl>
                      <dt className="text-[clamp(0.625rem,0.5rem+0.5vw,0.875rem)] font-medium text-gray-500 truncate leading-tight">Costos Reales</dt>
                      <dd className="text-[clamp(0.875rem,0.75rem+0.6vw,1.5rem)] font-bold text-red-600 leading-tight mt-0.5 sm:mt-1 break-all">
                        ${(estadisticasDashboard?.costosTotalesMes ?? 0).toLocaleString('es-CO')}
                      </dd>
                      <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-400 mt-0.5 leading-tight">Total = costos operativos + IVA (el IVA no es ganancia)</p>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 pt-2 border-t border-gray-200">
                        <div className="min-w-0">
                          <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-500 leading-tight truncate">Costos operativos</p>
                          <p className="text-[clamp(0.625rem,0.5rem+0.4vw,0.875rem)] font-semibold text-orange-600 leading-tight break-all">
                            ${((estadisticasDashboard?.gastosMaterialesMes ?? 0) + (estadisticasDashboard?.gastosManoObraMes ?? 0) + (estadisticasDashboard?.gastosHormigaMes ?? 0) + (estadisticasDashboard?.gastosTransporteMes ?? 0)).toLocaleString('es-CO')}
                          </p>
                          <p className="text-[0.65rem] text-gray-400">Mat.+M.Obra+Hormiga+Transp.</p>
                        </div>
                        <div className="min-w-0">
  <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-500 leading-tight truncate">
    Gastos fijos del mes
  </p>
  <p className="text-[clamp(0.625rem,0.5rem+0.4vw,0.875rem)] font-semibold text-orange-600 leading-tight break-all">
    ${(estadisticasDashboard?.gastosFijosMes ?? 0).toLocaleString('es-CO')}
  </p>
</div>
                        <div className="min-w-0">
                          <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-500 leading-tight truncate">IVA (impuesto)</p>
                          <p className="text-[clamp(0.625rem,0.5rem+0.4vw,0.875rem)] font-semibold text-indigo-600 leading-tight break-all">
                            ${(estadisticasDashboard?.ivaRealMes ?? 0).toLocaleString('es-CO')}
                          </p>
                          <p className="text-[0.65rem] text-gray-400">No es ganancia</p>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Ganancia Neta Real del Mes (después de pagos) */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500 min-h-0 flex flex-col">
              <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center ${
                      (estadisticasDashboard?.gananciaNetaMes ?? 0) >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <span className="text-white text-sm sm:text-lg font-bold">📈</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <dl>
                      <dt className="text-[clamp(0.625rem,0.5rem+0.5vw,0.875rem)] font-medium text-gray-500 truncate leading-tight">Ganancia Neta</dt>
                      <dd className={`text-[clamp(0.875rem,0.75rem+0.6vw,1.5rem)] font-bold leading-tight mt-0.5 sm:mt-1 break-all ${
                        (estadisticasDashboard?.gananciaNetaMes ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${(estadisticasDashboard?.gananciaNetaMes ?? 0).toLocaleString('es-CO')}
                      </dd>
                      <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-400 mt-1 leading-tight" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        Dinero real del mes después de pagar todo · Margen: {(estadisticasDashboard?.margenGananciaNetaMes ?? 0).toFixed(1)}%
                      </p>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagos a Personal del Mes */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-purple-500 min-h-0 flex flex-col">
              <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm sm:text-lg font-bold">👥</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <dl>
                      <dt className="text-[clamp(0.625rem,0.5rem+0.5vw,0.875rem)] font-medium text-gray-500 truncate leading-tight">Pagos a Personal</dt>
                      <dd className="text-[clamp(0.875rem,0.75rem+0.6vw,1.5rem)] font-bold text-purple-600 leading-tight mt-0.5 sm:mt-1 break-all">
                        {cargandoLiquidaciones ? (
                          <span className="text-[clamp(0.75rem,0.625rem+0.4vw,0.875rem)] text-gray-400">Cargando...</span>
                        ) : (
                          `$${liquidacionesMes.reduce((sum, l) => sum + l.monto, 0).toLocaleString('es-CO')}`
                        )}
                      </dd>
                      <p className="text-[clamp(0.625rem,0.5rem+0.3vw,0.75rem)] text-gray-400 mt-1 leading-tight">
                        {liquidacionesMes.length} pago{liquidacionesMes.length !== 1 ? 's' : ''} registrado{liquidacionesMes.length !== 1 ? 's' : ''}
                      </p>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de Pagos a Personal */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💼 Resumen de Pagos a Personal</h3>
            {cargandoLiquidaciones ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Cargando pagos...</p>
              </div>
            ) : liquidacionesMes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Persona</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liquidacionesMes.map((liquidacion) => (
                      <tr key={liquidacion.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(liquidacion.fecha_liquidacion).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {liquidacion.persona ? `${liquidacion.persona.nombre} ${liquidacion.persona.apellido}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {liquidacion.tipo_persona === 'vendedor' ? 'Vendedor' : 'Trabajador'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {liquidacion.metodo_pago || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          ${liquidacion.monto.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                        ${liquidacionesMes.reduce((sum, l) => sum + l.monto, 0).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay pagos registrados para este período</p>
                <p className="text-sm text-gray-400 mt-2">Los pagos se registran desde la página de Gestión de Personal</p>
              </div>
            )}
          </div>

          {/* Segunda fila: Desglose de Costos y Pagos */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">💸 Desglose de Costos Reales del Mes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800 font-medium">🛒 Materiales</p>
                  <p className="text-xl font-bold text-orange-600">
                    ${(estadisticasDashboard?.gastosMaterialesMes ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Costos asociados a cotizaciones aceptadas</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800 font-medium">👷 Mano de Obra</p>
                  <p className="text-xl font-bold text-purple-600">
                    ${(estadisticasDashboard?.gastosManoObraMes ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Costos asociados a cotizaciones aceptadas</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium">🐜 Gastos Hormiga</p>
                  <p className="text-xl font-bold text-yellow-600">
                    ${(estadisticasDashboard?.gastosHormigaMes ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">Costos asociados a cotizaciones aceptadas</p>
                </div>
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <p className="text-sm text-cyan-800 font-medium">🚚 Transporte</p>
                  <p className="text-xl font-bold text-cyan-600">
                    ${(estadisticasDashboard?.gastosTransporteMes ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-cyan-600 mt-1">Costos asociados a cotizaciones aceptadas</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🏦 Pagos reales del mes (salidas)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800 font-medium">👥 Personal</p>
                  <p className="text-xl font-bold text-purple-600">
                    ${(estadisticasDashboard?.pagosPersonalMes ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Liquidaciones pagadas en el período</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-800 font-medium">🧾 Gastos fijos</p>
                  <p className="text-xl font-bold text-slate-700">
                    ${(estadisticasDashboard?.pagosGastosFijosMes ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Pagos registrados por fecha</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-indigo-800 font-medium">📌 IVA del período (obligación)</p>
                  <p className="text-xl font-bold text-indigo-700">
                    ${(estadisticasDashboard?.ivaRealMes ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">Es el mismo IVA que aparece en “Costos Reales”</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-indigo-800 font-medium">🧾 IVA / impuestos pagados</p>
                  <p className="text-xl font-bold text-indigo-600">
                    ${(estadisticasDashboard?.pagosIVAMes ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">Detectado en gastos fijos (texto o categoría)</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">📤 Total salidas</p>
                  <p className="text-xl font-bold text-green-700">
                    ${(estadisticasDashboard?.pagosTotalesMes ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Suma de pagos del mes</p>
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-1">💰 Ventas cotizadas (aceptadas)</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(estadisticasDashboard?.ventasTotalesHistorico ?? ventasTotales).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Valor total cotizado de cotizaciones aceptadas (no necesariamente cobrado)</p>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  {cotizaciones.filter(c => c.estado === 'aceptada').length} aceptadas
                </p>
                <p className="text-xs text-emerald-700 mt-2 font-semibold">
                  Cobrado real (histórico): ${(
                    estadisticasDashboard?.totalCobradoHistorico ??
                    saldo?.totalCobradoHistorico ??
                    0
                  ).toLocaleString('es-CO')}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-1">📊 Costos de proyectos (histórico)</p>
                <p className="text-2xl font-bold text-red-600">
                  ${(estadisticasDashboard?.costosTotalesHistorico ?? 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Costos registrados de proyectos (materiales, M.Obra, otros) + IVA presupuestado</p>
                <p className="text-xs text-slate-700 mt-2 font-semibold">
                  Pagado real (histórico): ${(
                    estadisticasDashboard?.totalPagadoHistorico ??
                    saldo?.totalPagadoHistorico ??
                    0
                  ).toLocaleString('es-CO')}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-1">📋 IVA (histórico)</p>
                <p className="text-2xl font-bold text-indigo-600">
                  ${(estadisticasDashboard?.ivaRealHistorico ?? 0).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">IVA presupuestado en proyectos (no es ganancia)</p>
                <p className="text-xs text-indigo-700 mt-2 font-semibold">
                  IVA reservado (según cobrado): ${(
                    estadisticasDashboard?.ivaReservadoHistorico ??
                    saldo?.ivaReservadoHistorico ??
                    0
                  ).toLocaleString('es-CO')}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                <p className="text-sm text-gray-600 font-medium mb-1">📈 Saldo real disponible</p>
                <p className={`text-2xl font-bold ${(estadisticasDashboard?.saldoRealDisponible ?? saldo?.saldoRealDisponible ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(
                    estadisticasDashboard?.saldoRealDisponible ??
                    saldo?.saldoRealDisponible ??
                    0
                  ).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Cobrado histórico − todos los pagos (incl. IVA y gastos fijos). Es el mismo saldo real que ves en Caja de Ahorros.
                </p>
                {(() => {
                  const disponible =
                    estadisticasDashboard?.disponibleParaGastar ?? saldo?.disponibleParaGastar;
                  if (disponible === undefined) return null;
                  return (
                    <p className="text-xs text-amber-700 mt-2 font-medium">
                      Disponible para gastar (sin tocar ahorros): ${disponible.toLocaleString('es-CO')}
                    </p>
                  );
                })()}
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
          <PieChart>
            <Pie
              data={datosEstados}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={90}
              dataKey="cantidad"
            >
              {datosEstados.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS_ESTADOS[index % COLORS_ESTADOS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value} cot.`} />
            <Legend />
          </PieChart>
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
                      <p className="text-xs text-gray-400 mt-0.5">IVA ya descontado (no es ganancia)</p>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Real (con IVA)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IVA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilidad (IVA descontado)</th>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                            ${(Number(proyecto.iva) || 0).toLocaleString('es-CO')}
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


