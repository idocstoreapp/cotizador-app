/**
 * Dashboard específico para vendedores
 * Muestra estadísticas de sus propias cotizaciones
 */
import { useState, useEffect } from 'react';
import { obtenerCotizaciones } from '../services/cotizaciones.service';
import type { UserProfile, Cotizacion } from '../types/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardVendedorProps {
  usuario: UserProfile;
}

export default function DashboardVendedor({ usuario }: DashboardVendedorProps) {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para mes/año seleccionado
  const ahora = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(ahora.getMonth());
  const [añoSeleccionado, setAñoSeleccionado] = useState<number>(ahora.getFullYear());

  // Cargar cotizaciones del vendedor (solo cuando cambie el usuario)
  useEffect(() => {
    const cargarCotizaciones = async () => {
      try {
        setLoading(true);
        console.log('📥 [DashboardVendedor] Cargando cotizaciones para vendedor:', usuario.id);
        const datos = await obtenerCotizaciones(usuario.id);
        console.log('✅ [DashboardVendedor] Cotizaciones cargadas:', datos.length);
        setCotizaciones(datos);
      } catch (error) {
        console.error('❌ [DashboardVendedor] Error al cargar cotizaciones:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarCotizaciones();
  }, [usuario.id]);

  // Calcular estadísticas del mes seleccionado
  // Usar la misma lógica que el dashboard principal para consistencia
  const inicioMes = new Date(añoSeleccionado, mesSeleccionado, 1);
  inicioMes.setHours(0, 0, 0, 0);
  const finMes = new Date(añoSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59, 999);
  
  // Filtrar cotizaciones creadas en el mes (para total de cotizaciones)
  const cotizacionesMes = cotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const inicioNormalizado = new Date(inicioMes.getFullYear(), inicioMes.getMonth(), inicioMes.getDate());
    const finNormalizado = new Date(finMes.getFullYear(), finMes.getMonth(), finMes.getDate());
    return fechaNormalizada >= inicioNormalizado && fechaNormalizada <= finNormalizado;
  });

  // Filtrar cotizaciones ACEPTADAS en el mes (para ventas)
  // Usar updated_at si está disponible y es diferente de created_at (fecha de aceptación)
  const cotizacionesAceptadasMes = cotizaciones.filter(c => {
    if (c.estado !== 'aceptada') return false;
    // Si tiene updated_at y es diferente de created_at, usar updated_at (fecha de aceptación)
    const fechaAceptacion = c.updated_at && c.updated_at !== c.created_at 
      ? new Date(c.updated_at) 
      : new Date(c.created_at);
    const fechaNormalizada = new Date(fechaAceptacion.getFullYear(), fechaAceptacion.getMonth(), fechaAceptacion.getDate());
    const inicioNormalizado = new Date(inicioMes.getFullYear(), inicioMes.getMonth(), inicioMes.getDate());
    const finNormalizado = new Date(finMes.getFullYear(), finMes.getMonth(), finMes.getDate());
    return fechaNormalizada >= inicioNormalizado && fechaNormalizada <= finNormalizado;
  });

  const calcularTotalDesdeItems = (cotizacion: Cotizacion): number => {
    return cotizacion.total || 0;
  };

  const totalCotizaciones = cotizaciones.length;
  const totalCotizacionesMes = cotizacionesMes.length;
  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada').length;
  const cotizacionesPendientesMes = cotizacionesMes.filter(c => c.estado === 'pendiente');
  
  // Ventas totales históricas (todas las aceptadas)
  const ventasTotales = cotizaciones
    .filter(c => c.estado === 'aceptada')
    .reduce((sum, c) => {
      const total = calcularTotalDesdeItems(c);
      return sum + total;
    }, 0);
  
  // Ventas cobradas del mes: solo cotizaciones aceptadas en el mes y pagadas completamente
  const cotizacionesPagadasMes = cotizacionesAceptadasMes.filter(c => {
    const total = calcularTotalDesdeItems(c);
    const pagado = c.monto_pagado ?? 0;
    return pagado >= total && total > 0;
  });
  const ventasTotalesMes = cotizacionesPagadasMes.reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);
  // Por cobrar: aceptadas en el mes pero no pagadas totalmente
  const porCobrarMes = cotizacionesAceptadasMes.filter(c => {
    const total = calcularTotalDesdeItems(c);
    const pagado = c.monto_pagado ?? 0;
    return pagado < total;
  });
  const montoPorCobrarMes = porCobrarMes.reduce((sum, c) => {
    const total = calcularTotalDesdeItems(c);
    const pagado = c.monto_pagado ?? 0;
    return sum + (total - pagado);
  }, 0);

  // Debug: Log de cálculos
  console.log('📊 [DashboardVendedor] Cálculos:', {
    totalCotizaciones,
    totalCotizacionesMes,
    cotizacionesAceptadas,
    cotizacionesAceptadasMes: cotizacionesAceptadasMes.length,
    cotizacionesPendientesMes: cotizacionesPendientesMes.length,
    ventasTotales,
    ventasTotalesMes,
    mes: mesSeleccionado + 1,
    año: añoSeleccionado
  });

  // Datos para gráfico de cotizaciones por estado
  const datosEstados = [
    { name: 'Pendiente', cantidad: cotizaciones.filter(c => c.estado === 'pendiente').length },
    { name: 'Aceptada', cantidad: cotizaciones.filter(c => c.estado === 'aceptada').length },
    { name: 'Rechazada', cantidad: cotizaciones.filter(c => c.estado === 'rechazada').length }
  ];

  if (loading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Vendedor</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {usuario.nombre} {usuario.apellido}
          </p>
        </div>
      </div>

      {/* Selector de mes/año */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
        </div>
      </div>

      {/* Tarjetas de resumen */}
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
                  <dt className="text-sm font-medium text-gray-500">Mis Cotizaciones</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {totalCotizacionesMes}
                  </dd>
                  <p className="text-xs text-gray-400 mt-1">Este mes</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">✅ Aceptadas:</span>
                <span className="font-semibold text-green-600">
                  {cotizacionesAceptadasMes.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500">⏳ Pendientes:</span>
                <span className="font-semibold text-yellow-600">
                  {cotizacionesPendientesMes.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500">❌ Rechazadas:</span>
                <span className="font-semibold text-red-600">
                  {cotizacionesMes.filter(c => c.estado === 'rechazada').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ventas cobradas del Mes - solo lo ya pagado */}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Ventas cobradas (mes)</dt>
                  <dd className="text-2xl font-bold text-blue-600">
                    ${ventasTotalesMes.toLocaleString('es-CO')}
                  </dd>
                  <p className="text-xs text-gray-400 mt-1">Solo lo ya pagado. Lo no cobrado no es venta.</p>
                  {porCobrarMes.length > 0 && (
                    <p className="text-xs text-orange-600 mt-0.5">
                      Por cobrar: ${montoPorCobrarMes.toLocaleString('es-CO')} ({porCobrarMes.length} cot.)
                    </p>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Histórico */}
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg font-bold">📊</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Cotizaciones</dt>
                  <dd className="text-2xl font-bold text-green-600">
                    {totalCotizaciones}
                  </dd>
                  <p className="text-xs text-gray-400 mt-1">Desde el inicio</p>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Ventas Totales */}
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-purple-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg font-bold">💵</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ventas Totales</dt>
                  <dd className="text-2xl font-bold text-purple-600">
                    ${ventasTotales.toLocaleString('es-CO')}
                  </dd>
                  <p className="text-xs text-gray-400 mt-1">Histórico (con IVA; el IVA no es ganancia)</p>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de cotizaciones por estado */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cotizaciones por Estado</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosEstados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/catalogo"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ver Catálogo</h3>
              <p className="text-sm text-gray-600">Explora productos disponibles</p>
            </div>
          </div>
        </a>

        <a
          href="/cotizacion"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Nueva Cotización</h3>
              <p className="text-sm text-gray-600">Crear una nueva cotización</p>
            </div>
          </div>
        </a>

        <a
          href="/cotizaciones"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mis Cotizaciones</h3>
              <p className="text-sm text-gray-600">Ver historial completo</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

