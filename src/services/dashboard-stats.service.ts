import { supabase } from '../utils/supabase';
import { obtenerCotizaciones } from './cotizaciones.service';
import { obtenerEstadisticasGastosFijos } from './fixed-expenses.service';
import { obtenerSaldoDisponible, type SaldoDisponibleResult } from './saldo-disponible.service';
import type { Cotizacion } from '../types/database';

/**
 * Servicio para obtener estadísticas del dashboard
 * MEJORADO: Incluye TODOS los costos reales (materiales, mano de obra, gastos hormiga, transporte)
 */


export interface EstadisticasDashboard {
  // Cotizaciones
  totalCotizaciones: number;
  cotizacionesAceptadas: number;
  cotizacionesPendientes: number;
  cotizacionesRechazadas: number;
  
  // Financiero del mes - VENTAS (SOLO PAGADAS)
  ventasTotalesMes: number; // Total de cotizaciones PAGADAS del mes
  cobrosTotalesPeriodo: number; // Total cobrado real en el período (por fecha de pago)
  
  // Cotizaciones aceptadas en proceso
  cotizacionesAceptadasEnProceso: number; // Cantidad de cotizaciones aceptadas no pagadas o pagadas parcialmente
  cotizacionesPagadasCompletamente: number; // Cantidad de cotizaciones pagadas completamente
  totalAbonado: number; // Suma de todos los montos pagados (incluyendo parciales)
  totalPendiente: number; // Suma de lo que resta por pagar (total - monto_pagado para no pagadas/parciales)
  
  // Financiero del mes - COSTOS REALES (TODOS)
  gastosMaterialesMes: number;
  gastosManoObraMes: number;
  gastosHormigaMes: number;
  gastosTransporteMes: number;
  gastosFijosMes: number;
  ivaRealMes: number; // IVA presupuestado del período (no es ganancia)
  costosTotalesMes: number; // Suma de todos los costos (incluye IVA)

  // Pagos reales del mes (SALIDAS por fecha, dinero efectivamente pagado/registrado)
  pagosMaterialesMes: number;
  pagosManoObraMes: number;
  pagosHormigaMes: number;
  pagosTransporteMes: number;
  pagosGastosFijosMes: number;
  pagosPersonalMes: number; // Liquidaciones pagadas a personal
  pagosIVAMes: number; // IVA pagado/registrado (detectado en gastos fijos)
  pagosTotalesMes: number; // Total de salidas del mes
  
  // Financiero del mes - GANANCIA REAL
  gananciaMes: number; // Ventas - Costos Totales
  margenGananciaMes: number; // (Ganancia / Ventas) * 100

  // Financiero del mes - GANANCIA NETA REAL (cashflow)
  ivaReservadoPeriodo: number; // IVA reservado proporcional a lo cobrado en el período
  gananciaNetaMes: number; // Ventas pagadas - salidas del período - IVA presupuestado (mostrar al usuario como “ganancia neta”)
  gananciaNetaMesCashflow: number; // Para comparación: ventas pagadas - salidas - IVA reservado (cashflow real)
  margenGananciaNetaMes: number; // (GananciaNeta / Ventas) * 100
  
  // Comparación mes anterior
  variacionCotizaciones: number;
  variacionVentas: number;
  
  // Totales históricos
  ventasTotalesHistorico: number;
  costosTotalesHistorico: number;
  ivaRealHistorico: number; // IVA presupuestado histórico (no es ganancia)
  gananciaHistorica: number;

  // Caja / saldo real global (mismo cálculo que Caja de Ahorros)
  totalCobradoHistorico: number;
  totalPagadoHistorico: number;
  ivaReservadoHistorico: number;
  saldoRealDisponible: number;
  totalAhorros: number;
  disponibleParaGastar: number;
  saldoRealDisponiblePeriodo: number;
  
  // Actividad
  cotizacionesRecientes: Array<{
    id: string;
    numero: string;
    cliente_nombre: string;
    total: number;
    estado: string;
    created_at: string;
  }>;
}

/**
 * Función auxiliar para calcular total desde items de una cotización
 */      
function calcularTotalDesdeItems(cotizacion: Cotizacion): number {
  if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    const subtotal = cotizacion.items.reduce((sum: number, item: any) => {
      return sum + (item.precio_total || 0);
    }, 0);
  const descuento = (cotizacion as any).descuento || 0;
    const descuentoMonto = subtotal * (descuento / 100);
    const subtotalConDescuento = subtotal - descuentoMonto;
    const ivaPorcentaje = (cotizacion as any).iva_porcentaje || 19;
    const iva = subtotalConDescuento * (ivaPorcentaje / 100);
    
    return subtotalConDescuento + iva;
  }
return cotizacion.total || 0;
}

function parseYMDAsLocalDate(ymd: string): Date {
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date(ymd);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function formatLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function calcularKPIsFinancieros(
  { fechaInicio, fechaFin, debug }: { fechaInicio?: string; fechaFin?: string; debug?: boolean } = {}
) {
  const ignorarFechas = !fechaInicio || !fechaFin;
  const inicioPeriodo = ignorarFechas ? new Date(1970, 0, 1) : parseYMDAsLocalDate(fechaInicio!);
  const finPeriodo = ignorarFechas ? new Date() : parseYMDAsLocalDate(fechaFin!);
  inicioPeriodo.setHours(0, 0, 0, 0);
  finPeriodo.setHours(23, 59, 59, 999);

  const fechaInicioYMD = formatLocalYMD(inicioPeriodo);
  const fechaFinYMD = formatLocalYMD(finPeriodo);

  const queryRange = async (table: string, select: string, field: string) => {
    if (ignorarFechas) return supabase.from(table).select(select);
    const dateQ = await supabase.from(table).select(select).gte(field, fechaInicioYMD).lte(field, fechaFinYMD);
    const tsQ = await supabase.from(table).select(select).gte(field, `${fechaInicioYMD}T00:00:00`).lte(field, `${fechaFinYMD}T23:59:59`);
    if (dateQ.error && !tsQ.error) return tsQ;
    if (!dateQ.error && tsQ.error) return dateQ;
    if (dateQ.error && tsQ.error) return tsQ;
    const lenDate = Array.isArray(dateQ.data) ? dateQ.data.length : 0;
    const lenTs = Array.isArray(tsQ.data) ? tsQ.data.length : 0;
    return lenTs > lenDate ? tsQ : dateQ;
  };

  const [cobrosRes, materialesRes, manoObraRes, hormigaRes, transporteRes, gastosFijosRes, personalRes] = await Promise.all([
    queryRange('cotizacion_pagos', 'cotizacion_id, monto, fecha_pago', 'fecha_pago'),
    queryRange('gastos_reales_materiales', 'precio_unitario_real, cantidad_real, fecha_compra', 'fecha_compra'),
    queryRange('mano_obra_real', 'total_pagado, fecha', 'fecha'),
    queryRange('gastos_hormiga', 'monto, fecha', 'fecha'),
    queryRange('transporte_real', 'costo, fecha', 'fecha'),
    ignorarFechas
      ? supabase.from('fixed_expenses').select('amount, date, created_at')
      : supabase.from('fixed_expenses').select('amount, date, created_at').gte('date', fechaInicioYMD).lte('date', fechaFinYMD),
    queryRange('liquidaciones', 'monto, fecha_liquidacion', 'fecha_liquidacion')
  ]);

  const cobrosLista = (cobrosRes.data || []) as any[];
  const cobrosTotalesPeriodo = cobrosLista.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
  const cobradoPorCotizacionPeriodo = new Map<string, number>();
  cobrosLista.forEach((p: any) => {
    const id = String(p.cotizacion_id || '');
    if (!id) return;
    cobradoPorCotizacionPeriodo.set(id, (cobradoPorCotizacionPeriodo.get(id) || 0) + (Number(p.monto) || 0));
  });

  const pagosMaterialesPeriodo = (materialesRes.data || []).reduce((sum: number, g: any) => sum + ((Number(g.precio_unitario_real) || 0) * (Number(g.cantidad_real) || 0)), 0);
  const pagosManoObraPeriodo = (manoObraRes.data || []).reduce((sum: number, m: any) => sum + (Number(m.total_pagado) || 0), 0);
  const pagosHormigaPeriodo = (hormigaRes.data || []).reduce((sum: number, g: any) => sum + (Number(g.monto) || 0), 0);
  const pagosTransportePeriodo = (transporteRes.data || []).reduce((sum: number, t: any) => sum + (Number(t.costo) || 0), 0);
  const pagosGastosFijosPeriodo = (gastosFijosRes.data || []).reduce((sum: number, g: any) => sum + (Number(g.amount ?? g.monto ?? g.valor) || 0), 0);
  const pagosPersonalPeriodo = (personalRes.data || []).reduce((sum: number, p: any) => sum + (Number(p.monto) || 0), 0);

  const cotizaciones = await obtenerCotizaciones();
  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada');
  const ivaReservadoPeriodo = cotizacionesAceptadas.reduce((sum: number, c: any) => {
    const aplicaIVA = c.aplica_iva !== undefined ? Boolean(c.aplica_iva) : true;
    if (!aplicaIVA) return sum;
    const total = Number(c.total) || 0;
    const iva = Number(c.iva) || 0;
    if (total <= 0 || iva <= 0) return sum;
    const cobrado = Math.min(Number(cobradoPorCotizacionPeriodo.get(c.id) || 0), total);
    return sum + (iva * (cobrado / total));
  }, 0);

  const pagosTotalesPeriodo = pagosMaterialesPeriodo + pagosManoObraPeriodo + pagosHormigaPeriodo + pagosTransportePeriodo + pagosGastosFijosPeriodo + pagosPersonalPeriodo;
  const gananciaNetaPeriodo = cobrosTotalesPeriodo - pagosTotalesPeriodo - ivaReservadoPeriodo;

  const result = {
    cobrosTotalesPeriodo,
    pagosMaterialesPeriodo,
    pagosManoObraPeriodo,
    pagosHormigaPeriodo,
    pagosTransportePeriodo,
    pagosGastosFijosPeriodo,
    pagosPersonalPeriodo,
    pagosTotalesPeriodo,
    ivaReservadoPeriodo,
    gananciaNetaPeriodo,
    cobradoPorCotizacionPeriodo
  };

  if (debug) {
    console.log('📊 [KPIs Financieros]', {
      rango: { inicio: fechaInicioYMD, fin: fechaFinYMD, ignorarFechas },
      cobrosTotalesPeriodo,
      pagosTotalesPeriodo,
      ivaReservadoPeriodo,
      gananciaNetaPeriodo
    });
  }
  return result;
}


/**
 * Obtiene estadísticas del dashboard para un rango de fechas específico
 * MEJORADO: Incluye TODOS los costos reales
 * @param fechaInicio - Fecha de inicio del rango (ISO string). Si no se proporciona, usa el mes actual
 * @param fechaFin - Fecha de fin del rango (ISO string). Si no se proporciona, usa el mes actual
 * @param mes - Mes a consultar (0-11, donde 0 = enero). Se usa como fallback si no hay fechas
 * @param año - Año a consultar. Se usa como fallback si no hay fechas
 */
export async function obtenerEstadisticasDashboard(
  fechaInicio?: string,
  fechaFin?: string,
  mes?: number,
  año?: number
): Promise<EstadisticasDashboard> {

  const ahora = new Date();
  let inicioPeriodo: Date;
  let finPeriodo: Date;
  const mesBase = mes !== undefined ? mes : ahora.getMonth();
  const añoBase = año !== undefined ? año : ahora.getFullYear();
  
  if (fechaInicio && fechaFin) {
    // Usar rango de fechas proporcionado
    inicioPeriodo = parseYMDAsLocalDate(fechaInicio);
    inicioPeriodo.setHours(0, 0, 0, 0);
    finPeriodo = parseYMDAsLocalDate(fechaFin);
    finPeriodo.setHours(23, 59, 59, 999);
  } else {
    // Fallback a mes/año
    inicioPeriodo = new Date(añoBase, mesBase, 1);
    inicioPeriodo.setHours(0, 0, 0, 0);
    finPeriodo = new Date(añoBase, mesBase + 1, 0, 23, 59, 59);
  }
  
  // Calcular período anterior para comparación (mismo número de días)
  const diasPeriodo = Math.ceil((finPeriodo.getTime() - inicioPeriodo.getTime()) / (1000 * 60 * 60 * 24));
  const inicioPeriodoAnterior = new Date(inicioPeriodo);
  inicioPeriodoAnterior.setDate(inicioPeriodoAnterior.getDate() - diasPeriodo);
  const finPeriodoAnterior = new Date(inicioPeriodo);
  finPeriodoAnterior.setDate(finPeriodoAnterior.getDate() - 1);
  finPeriodoAnterior.setHours(23, 59, 59, 999);

  // Obtener todas las cotizaciones
  const todasLasCotizaciones = await obtenerCotizaciones();
  
  // Filtrar cotizaciones CREADAS en el período actual (para contar totales)
  const cotizacionesPeriodo = todasLasCotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    return fecha >= inicioPeriodo && fecha <= finPeriodo;
  });

  // Filtrar cotizaciones ACEPTADAS en el período actual (para ventas)
  // IMPORTANTE: no usar updated_at porque cambia con abonos/ediciones y
  // termina moviendo cotizaciones antiguas al período actual.
  const cotizacionesAceptadasPeriodo = todasLasCotizaciones.filter(c => {
    if (c.estado !== 'aceptada') return false;
    const fechaAceptacion = new Date(c.created_at);
    return fechaAceptacion >= inicioPeriodo && fechaAceptacion <= finPeriodo;
  });

  const cotizacionesPeriodoAnterior = todasLasCotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    return fecha >= inicioPeriodoAnterior && fecha <= finPeriodoAnterior;
  });

  // Buscar K001 específicamente para debug
  const cotizacionK001 = todasLasCotizaciones.find(c => c.numero === 'K001' || c.numero === 'K-001');

  // Debug: Log para verificar filtros
  console.log('📊 [Dashboard Stats] Filtros:', {
    totalCotizaciones: todasLasCotizaciones.length,
    cotizacionesCreadasPeriodo: cotizacionesPeriodo.length,
    cotizacionesAceptadasPeriodo: cotizacionesAceptadasPeriodo.length,
    cotizacionesPeriodoAnterior: cotizacionesPeriodoAnterior.length,
    rangoPeriodo: {
      inicio: formatLocalYMD(inicioPeriodo),
      fin: formatLocalYMD(finPeriodo)
    },
    k001: cotizacionK001 ? {
      id: cotizacionK001.id,
      numero: cotizacionK001.numero,
      estado: cotizacionK001.estado,
      created_at: cotizacionK001.created_at,
      updated_at: cotizacionK001.updated_at,
      estaEnPeriodo: cotizacionesAceptadasPeriodo.some(c => c.id === cotizacionK001.id),
      fechaAceptacion: formatLocalYMD(new Date(cotizacionK001.created_at))
    } : 'No encontrada'
  });

  // Estadísticas de cotizaciones del período
  const totalCotizaciones = cotizacionesPeriodo.length;
  let cotizacionesPendientesPeriodo = cotizacionesPeriodo.filter(c => c.estado === 'pendiente');
  let cotizacionesRechazadasPeriodo = cotizacionesPeriodo.filter(c => c.estado === 'rechazada');

  // Tolerancia para considerar una cotización como "completamente pagada" cuando hay
  // pequeñas diferencias de centavos (redondeos, ajustes, pagos parciales casi completos).
  const PAGO_EPSILON = 0.05;

  // Separar cotizaciones aceptadas por estado de pago
  // Nota: abusamos de la definición "pagadas" para incluir solo las cotizaciones que están completamente pagadas.
  const cotizacionesAceptadasPeriodoParaCobro = cotizacionesPeriodo.filter(c => c.estado === 'aceptada');

  const cotizacionesPagadas = cotizacionesAceptadasPeriodoParaCobro.filter(c => {
    const totalCotizacion = calcularTotalDesdeItems(c);
    const montoPagado = Number(c.monto_pagado) || 0;
    const estaPagadaPorMonto = montoPagado >= (totalCotizacion - PAGO_EPSILON);
    return estaPagadaPorMonto || c.estado_pago === 'pagado';
  });

  const cotizacionesEnProceso = cotizacionesAceptadasPeriodoParaCobro.filter(c => {
    const totalCotizacion = calcularTotalDesdeItems(c);
    const montoPagado = Number(c.monto_pagado) || 0;
    const estaPagadaPorMonto = montoPagado >= (totalCotizacion - PAGO_EPSILON);
    return !estaPagadaPorMonto && (
      !c.estado_pago || c.estado_pago === 'no_pagado' || c.estado_pago === 'pago_parcial' || montoPagado > 0
    );
  });

  // Cálculo de cobros según montos registrados en cotizaciones
  const cobrosPorCotizacionesPeriodo = cotizacionesPeriodo.reduce((sum, c) => sum + (Number(c.monto_pagado) || 0), 0);
  const cobrosPorCotizacionesAceptadasPeriodo = cotizacionesAceptadasPeriodo.reduce((sum, c) => sum + (Number(c.monto_pagado) || 0), 0);
  const cobrosPorTodasLasCotizaciones = todasLasCotizaciones.reduce((sum, c) => sum + (Number(c.monto_pagado) || 0), 0);

  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 [Dashboard Stats] cobrosPorCotizaciones (monto_pagado):', {
      periodo: cobrosPorCotizacionesPeriodo,
      aceptadas: cobrosPorCotizacionesAceptadasPeriodo,
      historico: cobrosPorTodasLasCotizaciones
    });
  }

  // Identificadores útiles
  const idsCotizacionesPeriodo = new Set(cotizacionesPeriodo.map(c => String(c.id)));

  // Mapa de cobros por cotización para el período (se completa más abajo desde cotizacion_pagos)
  let cobradoPorCotizacionPeriodo = new Map<string, number>();

  // Cotizaciones con cobros iniciales (monto_pagado declarado o pagos en cotizacion_pagos) restringidas a período
  let cotizacionesConCobros = cotizacionesAceptadasPeriodoParaCobro.filter((c) => {
    return (Number(c.monto_pagado) || 0) > 0;
  });

  // IDs de cotizaciones con cobros (usadas para costos reales)
  let idsCotizacionesConCobros = new Set(cotizacionesConCobros.map(c => String(c.id)));

  // IDs de cotizaciones pagadas (completas) para filtro de cobros reales si existen
  const idsCotizacionesPagadas = new Set(cotizacionesPagadas.map(c => String(c.id)));

  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 [Dashboard Stats] cotizacionesConCobros (ids+totales):', cotizacionesConCobros.map(c => ({
      id: c.id,
      total: calcularTotalDesdeItems(c),
      monto_pagado: Number(c.monto_pagado) || 0,
      estado_pago: c.estado_pago,
      cobradoPeriodo: Number(cobradoPorCotizacionPeriodo.get(c.id) || 0)
    })));
  }

  // Ventas del período (cotizaciones con cobros reales en el período)
  let ventasTotalesPeriodo = cotizacionesConCobros.reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);

  // (opcional) Total cobrado por cotizaciones en el período basado en cotizacion_pagos
  const cobrosPorCotizacionPagosPeriodo = Array.from(cobradoPorCotizacionPeriodo.values()).reduce((sum, v) => sum + v, 0);

  // Calcular total abonado (suma de todos los monto_pagado, incluyendo parciales)
  // Priorizar cotizaciones con cobros en el período para evitar el sesgo de aceptadas.
  let totalAbonado = cotizacionesConCobros.reduce((sum, c) => {
    return sum + (c.monto_pagado || 0);
  }, 0);

  // Calcular total pendiente (lo que resta por pagar)
  const totalPendienteRaw = cotizacionesEnProceso.reduce((sum, c) => {
    const total = calcularTotalDesdeItems(c);
    const pagado = c.monto_pagado || 0;
    return sum + (total - pagado);
  }, 0);
  const totalPendiente = Math.abs(totalPendienteRaw) < PAGO_EPSILON ? 0 : Math.round(totalPendienteRaw * 100) / 100;

  // ====== COSTOS REALES DEL PERÍODO (TODOS) ======
  // IMPORTANTE: Contar todos los costos reales de las cotizaciones aceptadas en el período
  // Esto refleja mejor la realidad: si una cotización fue aceptada en el período,
  // todos sus costos reales (sin importar cuándo ocurrieron) se asocian a esa venta del período
  
  // IDs de cotizaciones con cobros (usadas para filtrar cobros y costos)
  const idsCotizacionesPagadasArray = Array.from(idsCotizacionesConCobros);

  // Si no hay cotizaciones con cobros, los costos son 0
  let gastosMaterialesMes = 0;
  let gastosManoObraMes = 0;
  let gastosHormigaMes = 0;
  let gastosTransporteMes = 0;
  
  // Inicializar variables de datos (necesarias para el debug después)
  let gastosMateriales: any[] = [];
  let manoObra: any[] = [];
  let gastosHormiga: any[] = [];
  let transporte: any[] = [];
  
  if (idsCotizacionesPagadasArray.length > 0) {
    // IMPORTANTE: Obtener las cotizaciones pagadas con sus items para saber la cantidad del item
    // Los gastos reales están registrados para 1 unidad, necesitamos multiplicar por la cantidad
    const cotizacionesConItems = await Promise.all(
      cotizacionesPagadas.map(async (cotizacion) => {
        // Obtener la cantidad del item (los gastos reales están registrados para 1 unidad)
        let cantidadItem = 1;
        if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
          const itemConCantidad = cotizacion.items.find((item: any) => item.cantidad && item.cantidad > 1);
          if (itemConCantidad) {
            cantidadItem = itemConCantidad.cantidad;
          }
        }
        return { id: cotizacion.id, cantidadItem };
      })
    );

    // Crear un mapa de cantidad por cotización
    const cantidadPorCotizacion = new Map<string, number>();
    cotizacionesConItems.forEach(c => {
      cantidadPorCotizacion.set(c.id, c.cantidadItem);
    });
  
    // 1. Gastos en materiales (de las cotizaciones pagadas en el mes)
    const { data: gastosMaterialesData, error: errorMateriales } = await supabase
    .from('gastos_reales_materiales')
      .select('precio_unitario_real, cantidad_real, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
      .in('cotizacion_id', idsCotizacionesPagadasArray);

    if (errorMateriales) {
      console.error('❌ Error al obtener gastos de materiales:', errorMateriales);
    }

    gastosMateriales = gastosMaterialesData || [];
    // IMPORTANTE: Calcular considerando el alcance_gasto de cada gasto
    gastosMaterialesMes = gastosMateriales.reduce((sum, g) => {
      const cantidadItem = cantidadPorCotizacion.get(g.cotizacion_id) || 1;
      const costoPorUnidad = (g.precio_unitario_real || 0) * (g.cantidad_real || 0);
      
      let multiplicador = 1;
      if (g.alcance_gasto === 'unidad') {
        // Por 1 unidad: multiplicar por cantidad total de items
        multiplicador = cantidadItem;
      } else if (g.alcance_gasto === 'parcial') {
        // Parcial: usar cantidad_items_aplicados directamente
        multiplicador = g.cantidad_items_aplicados || 1;
      } else if (g.alcance_gasto === 'total') {
        // Total: no multiplicar (ya incluye todos los items)
        multiplicador = 1;
      } else {
        // Por defecto (gastos antiguos sin alcance_gasto): no multiplicar (suponemos que el registro ya es total)
        multiplicador = 1;
      }
      
      const costoTotal = costoPorUnidad * multiplicador;
      return sum + costoTotal;
  }, 0);

    // 2. Mano de obra real (de todas las cotizaciones aceptadas en el mes)
    const { data: manoObraData, error: errorManoObra } = await supabase
    .from('mano_obra_real')
      .select('total_pagado, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
      .in('cotizacion_id', idsCotizacionesPagadasArray);

    if (errorManoObra) {
      console.error('❌ Error al obtener mano de obra:', errorManoObra);
    }

    manoObra = manoObraData || [];
    // IMPORTANTE: Calcular considerando el alcance_gasto de cada gasto
    gastosManoObraMes = manoObra.reduce((sum, m) => {
      const cantidadItem = cantidadPorCotizacion.get(m.cotizacion_id) || 1;
      const costoPorUnidad = m.total_pagado || 0;
      
      let multiplicador = 1;
      if (m.alcance_gasto === 'unidad') {
        multiplicador = cantidadItem;
      } else if (m.alcance_gasto === 'parcial') {
        multiplicador = m.cantidad_items_aplicados || 1;
      } else if (m.alcance_gasto === 'total') {
        multiplicador = 1;
      } else {
        // Por defecto: multiplicar por cantidadItem
        multiplicador = cantidadItem;
      }
      
      const costoTotal = costoPorUnidad * multiplicador;
      return sum + costoTotal;
    }, 0);

    // 3. Gastos hormiga (de todas las cotizaciones aceptadas en el mes)
    const { data: gastosHormigaData, error: errorHormiga } = await supabase
    .from('gastos_hormiga')
      .select('monto, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
      .in('cotizacion_id', idsCotizacionesPagadasArray);

    if (errorHormiga) {
      console.error('❌ Error al obtener gastos hormiga:', errorHormiga);
    }

    gastosHormiga = gastosHormigaData || [];
    // IMPORTANTE: Calcular considerando el alcance_gasto de cada gasto
    gastosHormigaMes = gastosHormiga.reduce((sum, g) => {
      const cantidadItem = cantidadPorCotizacion.get(g.cotizacion_id) || 1;
      const costoPorUnidad = g.monto || 0;
      
      let multiplicador = 1;
      if (g.alcance_gasto === 'unidad') {
        multiplicador = cantidadItem;
      } else if (g.alcance_gasto === 'parcial') {
        multiplicador = g.cantidad_items_aplicados || 1;
      } else if (g.alcance_gasto === 'total') {
        multiplicador = 1;
      } else {
        // Por defecto: multiplicar por cantidadItem
        multiplicador = cantidadItem;
      }
      
      const costoTotal = costoPorUnidad * multiplicador;
      return sum + costoTotal;
    }, 0);

    // 4. Transporte real (de todas las cotizaciones aceptadas en el mes)
    const { data: transporteData, error: errorTransporte } = await supabase
    .from('transporte_real')
      .select('costo, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
      .in('cotizacion_id', idsCotizacionesPagadasArray);

    if (errorTransporte) {
      console.error('❌ Error al obtener transporte:', errorTransporte);
    }

    transporte = transporteData || [];
    // IMPORTANTE: Calcular considerando el alcance_gasto de cada gasto
    gastosTransporteMes = transporte.reduce((sum, t) => {
      const cantidadItem = cantidadPorCotizacion.get(t.cotizacion_id) || 1;
      const costoPorUnidad = t.costo || 0;
      
      let multiplicador = 1;
      if (t.alcance_gasto === 'unidad') {
        multiplicador = cantidadItem;
      } else if (t.alcance_gasto === 'parcial') {
        multiplicador = t.cantidad_items_aplicados || 1;
      } else if (t.alcance_gasto === 'total') {
        multiplicador = 1;
      } else {
        // Por defecto: multiplicar por cantidadItem
        multiplicador = cantidadItem;
      }
      
      const costoTotal = costoPorUnidad * multiplicador;
      return sum + costoTotal;
    }, 0);
  }

  // Calcular costos por cotización para debug (con multiplicación por cantidad)
  const costosPorCotizacion = new Map<string, {
    materiales: number;
    manoObra: number;
    gastosHormiga: number;
    transporte: number;
    total: number;
  }>();

  // Obtener cantidad por cotización si no está ya calculada
  let cantidadPorCotizacionDebug = new Map<string, number>();
  if (idsCotizacionesPagadasArray.length > 0) {
    cotizacionesPagadas.forEach(cotizacion => {
      let cantidadItem = 1;
      if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
        const itemConCantidad = cotizacion.items.find((item: any) => item.cantidad && item.cantidad > 1);
        if (itemConCantidad) {
          cantidadItem = itemConCantidad.cantidad;
        }
      }
      cantidadPorCotizacionDebug.set(cotizacion.id, cantidadItem);
    });
  }

  (gastosMateriales || []).forEach(g => {
    const cantidadItem = cantidadPorCotizacionDebug.get(g.cotizacion_id) || 1;
    const costoPorUnidad = (g.precio_unitario_real || 0) * (g.cantidad_real || 0);
    
    let multiplicador = 1;
    if (g.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (g.alcance_gasto === 'parcial') {
      multiplicador = g.cantidad_items_aplicados || 1;
    } else if (g.alcance_gasto === 'total') {
      multiplicador = 1;
    } else {
      // Por defecto (gastos antiguos): asumir total
      multiplicador = 1;
    }
    
    const costo = costoPorUnidad * multiplicador;
    const existente = costosPorCotizacion.get(g.cotizacion_id) || { materiales: 0, manoObra: 0, gastosHormiga: 0, transporte: 0, total: 0 };
    existente.materiales += costo;
    existente.total += costo;
    costosPorCotizacion.set(g.cotizacion_id, existente);
  });

  (manoObra || []).forEach(m => {
    const cantidadItem = cantidadPorCotizacionDebug.get(m.cotizacion_id) || 1;
    const costoPorUnidad = m.total_pagado || 0;
    
    let multiplicador = 1;
    if (m.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (m.alcance_gasto === 'parcial') {
      multiplicador = m.cantidad_items_aplicados || 1;
    } else if (m.alcance_gasto === 'total') {
      multiplicador = 1;
    } else {
      // Por defecto: asumir total
      multiplicador = 1;
    }
    
    const costo = costoPorUnidad * multiplicador;
    const existente = costosPorCotizacion.get(m.cotizacion_id) || { materiales: 0, manoObra: 0, gastosHormiga: 0, transporte: 0, total: 0 };
    existente.manoObra += costo;
    existente.total += costo;
    costosPorCotizacion.set(m.cotizacion_id, existente);
  });

  (gastosHormiga || []).forEach(g => {
    const cantidadItem = cantidadPorCotizacionDebug.get(g.cotizacion_id) || 1;
    const costoPorUnidad = g.monto || 0;
    
    let multiplicador = 1;
    if (g.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (g.alcance_gasto === 'parcial') {
      multiplicador = g.cantidad_items_aplicados || 1;
    } else if (g.alcance_gasto === 'total') {
      multiplicador = 1;
    } else {
      // Por defecto: asumir total
      multiplicador = 1;
    }
    
    const costo = costoPorUnidad * multiplicador;
    const existente = costosPorCotizacion.get(g.cotizacion_id) || { materiales: 0, manoObra: 0, gastosHormiga: 0, transporte: 0, total: 0 };
    existente.gastosHormiga += costo;
    existente.total += costo;
    costosPorCotizacion.set(g.cotizacion_id, existente);
  });

  (transporte || []).forEach(t => {
    const cantidadItem = cantidadPorCotizacionDebug.get(t.cotizacion_id) || 1;
    const costoPorUnidad = t.costo || 0;
    
    let multiplicador = 1;
    if (t.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (t.alcance_gasto === 'parcial') {
      multiplicador = t.cantidad_items_aplicados || 1;
    } else if (t.alcance_gasto === 'total') {
      multiplicador = 1;
    } else {
      multiplicador = cantidadItem;
    }
    
    const costo = costoPorUnidad * multiplicador;
    const existente = costosPorCotizacion.get(t.cotizacion_id) || { materiales: 0, manoObra: 0, gastosHormiga: 0, transporte: 0, total: 0 };
    existente.transporte += costo;
    existente.total += costo;
    costosPorCotizacion.set(t.cotizacion_id, existente);
  });

  // Debug: Log detallado de costos
  console.log('💰 [Dashboard Stats] Costos del mes (con alcance_gasto):', {
    cotizacionesPagadas: cotizacionesPagadas.length,
    idsCotizaciones: idsCotizacionesPagadasArray,
    materiales: {
      total: gastosMaterialesMes,
      registros: gastosMateriales?.length || 0,
      muestraAlcance: gastosMateriales?.slice(0, 3).map(g => ({
        material: g.material_nombre || 'N/A',
        alcance: g.alcance_gasto || 'null',
        costo: (g.precio_unitario_real || 0) * (g.cantidad_real || 0)
      })) || [],
      detalle: Array.from(costosPorCotizacion.entries())
        .sort((a, b) => b[1].materiales - a[1].materiales)
        .slice(0, 5)
        .map(([cotizacionId, costos]) => ({
          cotizacion_id: cotizacionId,
          materiales: costos.materiales,
          total_cotizacion: costos.total
        }))
    },
    manoObra: {
      total: gastosManoObraMes,
      registros: manoObra?.length || 0,
      muestraAlcance: manoObra?.slice(0, 3).map(m => ({
        alcance: m.alcance_gasto || 'null',
        costo: m.total_pagado || 0
      })) || []
    },
    gastosHormiga: {
      total: gastosHormigaMes,
      registros: gastosHormiga?.length || 0,
      muestraAlcance: gastosHormiga?.slice(0, 3).map(g => ({
        descripcion: g.descripcion || 'N/A',
        alcance: g.alcance_gasto || 'null',
        costo: g.monto || 0
      })) || []
    },
    transporte: {
      total: gastosTransporteMes,
      registros: transporte?.length || 0,
      muestraAlcance: transporte?.slice(0, 3).map(t => ({
        tipo: t.tipo_descripcion || 'N/A',
        alcance: t.alcance_gasto || 'null',
        costo: t.costo || 0
      })) || []
    },
    total: gastosMaterialesMes + gastosManoObraMes + gastosHormigaMes + gastosTransporteMes,
    topCotizaciones: Array.from(costosPorCotizacion.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3)
      .map(([cotizacionId, costos]) => ({
        cotizacion_id: cotizacionId,
        total: costos.total,
        desglose: {
          materiales: costos.materiales,
          manoObra: costos.manoObra,
          gastosHormiga: costos.gastosHormiga,
          transporte: costos.transporte
        }
      }))
  });

  // ====== CALCULAR IVA PRESUPUESTADO DEL MES ======
  // El IVA real = IVA presupuestado de las cotizaciones que tienen cobros reales en el período.
  let ivaRealMes = 0;
  try {
    ivaRealMes = cotizacionesConCobros.reduce((sum: number, cotizacion) => {
      const aplicaIVA = (cotizacion as any).aplica_iva !== undefined ? (cotizacion as any).aplica_iva : true;
      if (!aplicaIVA) return sum;
      return sum + (Number((cotizacion as any).iva) || 0);
    }, 0);

    console.log('💰 [Dashboard] IVA Real del mes (presupuestado, cotizaciones con cobros):', ivaRealMes);
  } catch (error) {
    console.warn('⚠️ [Dashboard] Error al calcular IVA presupuestado:', error);
  }

  // Incluir gastos fijos del mes
  let gastosFijosMes = 0;
  try {
    const statsGastosFijos = await obtenerEstadisticasGastosFijos({
      mes: mesBase + 1, // servicio usa 1-12
      anio: añoBase
    });
    gastosFijosMes = statsGastosFijos?.totalMes ?? 0;
  } catch (error) {
    console.warn('⚠️ [Dashboard] Error al obtener estadísticas de gastos fijos:', error);
  }

  // ====== PAGOS REALES DEL MES (SALIDAS POR FECHA) ======
  const fechaInicioISO = inicioPeriodo.toISOString();
  const fechaFinISO = finPeriodo.toISOString();

  // IMPORTANTE: usar fecha local para filtros por columnas tipo DATE.
  // toISOString() usa UTC y puede mover el día (ej: fin de mes → día siguiente), causando rangos incorrectos y 400.

  const fechaInicioYMD = formatLocalYMD(inicioPeriodo);
  const fechaFinYMD = formatLocalYMD(finPeriodo);

  let pagosMaterialesMes = 0;
  let pagosManoObraMes = 0;
  let pagosHormigaMes = 0;
  let pagosTransporteMes = 0;
  let pagosGastosFijosMes = 0;
  let pagosPersonalMes = 0;
  let pagosIVAMes = 0;
  let cobrosTotalesPeriodo = 0;
  cobradoPorCotizacionPeriodo = new Map<string, number>();
  let kpisFinancierosPeriodo: Awaited<ReturnType<typeof calcularKPIsFinancieros>> | null = null;

  try {
    const queryByYMDOrTimestampRange = async (table: string, select: string, field: string, extra?: (q: any) => any) => {
      // 1) Intento con rango DATE (YYYY-MM-DD)
      let q1: any = supabase.from(table).select(select).gte(field, fechaInicioYMD).lte(field, fechaFinYMD);
      if (extra) q1 = extra(q1);
      const res1 = await q1;
          // 2) Intento con rango TIMESTAMP (incluye día completo)
      let q2: any = supabase
        .from(table)
        .select(select)
        .gte(field, `${fechaInicioYMD}T00:00:00`)
        .lte(field, `${fechaFinYMD}T23:59:59`);
      if (extra) q2 = extra(q2);
      const res2 = await q2;
        // Si una falla y la otra no, usar la exitosa
        if (res1.error && !res2.error) return res2;
        if (!res1.error && res2.error) return res1;
        if (res1.error && res2.error) return res2;
  
        // Si ambas funcionan, elegir la que devuelve más filas (evita perder registros por tipo DATE/TIMESTAMP)
        const len1 = Array.isArray(res1.data) ? res1.data.length : 0;
        const len2 = Array.isArray(res2.data) ? res2.data.length : 0;
        return len2 > len1 ? res2 : res1;
    };

    const [
      cobrosRes,
      pagosMaterialesRes,
      pagosManoObraRes,
      pagosHormigaRes,
      pagosTransporteRes,
      pagosGastosFijosRes,
      pagosPersonalRes
    ] = await Promise.all([
      // Cobros reales (ingresos) por fecha de pago
      queryByYMDOrTimestampRange('cotizacion_pagos', 'cotizacion_id, monto, fecha_pago', 'fecha_pago'),

      // fecha_compra puede ser DATE o TIMESTAMP → usar helper con 2 intentos
      queryByYMDOrTimestampRange('gastos_reales_materiales', 'precio_unitario_real, cantidad_real, fecha_compra', 'fecha_compra'),

      // fecha suele ser date (o timestamp en algunos esquemas)
      queryByYMDOrTimestampRange('mano_obra_real', 'total_pagado, fecha', 'fecha'),
      queryByYMDOrTimestampRange('gastos_hormiga', 'monto, fecha, descripcion', 'fecha'),
      // En proyectos migrados, la columna puede no llamarse tipo_descripcion. No la pedimos para evitar 42703.
      queryByYMDOrTimestampRange('transporte_real', 'costo, fecha', 'fecha'),

      // fixed_expenses.date es DATE; si falla, intentar filtrar por created_at (timestamp)
      (async () => {
        // En proyectos migrados, description/provider pueden llamarse distinto (descripcion/proveedor).
        // Intentar traer categoría embebida para detectar IVA por categoría.
        const r1 = await supabase
          .from('fixed_expenses')
          .select(`
            *,
            category:fixed_expense_categories(name)
          `)
          .gte('date', fechaInicioYMD)
          .lte('date', fechaFinYMD);
        if (!r1.error) return r1;
        const r2 = await supabase
          .from('fixed_expenses')
          .select(`
            *,
            category:fixed_expense_categories(name)
          `)
          .gte('created_at', fechaInicioISO)
          .lte('created_at', fechaFinISO);
        // Si el embed falla por schema cache/relationship, caer a select('*')
        if (!r2.error) return r2;
        const isRelationshipError =
          r2.error.code === 'PGRST200' ||
          String(r2.error.message || '').toLowerCase().includes('relationship') ||
          String(r2.error.message || '').toLowerCase().includes('schema cache');
        if (!isRelationshipError) return r2;

        const r3 = await supabase
          .from('fixed_expenses')
          .select('*')
          .gte('created_at', fechaInicioISO)
          .lte('created_at', fechaFinISO);
        return r3;
      })(),

      // liquidaciones.fecha_liquidacion suele ser timestamp
      supabase
        .from('liquidaciones')
        .select('monto, fecha_liquidacion')
        .gte('fecha_liquidacion', fechaInicioISO)
        .lte('fecha_liquidacion', fechaFinISO)
    ]);

    if (cobrosRes.error) console.warn('⚠️ [Dashboard] Error cobros (cotizacion_pagos):', cobrosRes.error);
    if (pagosMaterialesRes.error) console.warn('⚠️ [Dashboard] Error pagos materiales:', pagosMaterialesRes.error);
    if (pagosManoObraRes.error) console.warn('⚠️ [Dashboard] Error pagos mano de obra:', pagosManoObraRes.error);
    if (pagosHormigaRes.error) console.warn('⚠️ [Dashboard] Error pagos hormiga:', pagosHormigaRes.error);
    if (pagosTransporteRes.error) console.warn('⚠️ [Dashboard] Error pagos transporte:', pagosTransporteRes.error);
    if (pagosGastosFijosRes.error) console.warn('⚠️ [Dashboard] Error pagos gastos fijos:', pagosGastosFijosRes.error);
    if (pagosPersonalRes.error) console.warn('⚠️ [Dashboard] Error pagos personal (liquidaciones):', pagosPersonalRes.error);

    const cobrosLista = (cobrosRes.data || []) as any[];

    // Filtrar cobros relacionados con el período (por fecha de pago) y con pago real
    // El query ya trae pagos en el rango, por lo que no hay que filtrar por cotizaciones creadas solo.
    let cobrosFiltrados = cobrosLista;
    const idsCotizacionesConCobrosPeriodo = new Set(cobrosFiltrados
      .map((p: any) => String(p.cotizacion_id || ''))
      .filter(id => id));

    // Mapa de cobros por cotización (para calcular IVA reservado y para evitar que cobros > ventas)
    cobradoPorCotizacionPeriodo = new Map<string, number>();
    cobrosFiltrados.forEach((p: any) => {
      const id = String(p.cotizacion_id || '');
      if (!id) return;
      const m = Number(p.monto) || 0;
      cobradoPorCotizacionPeriodo.set(id, (cobradoPorCotizacionPeriodo.get(id) || 0) + m);
    });

    // Alineación de cotizaciones con cobros (solo el período)
    cotizacionesConCobros = todasLasCotizaciones.filter(c => {
      const hasPagoPeriodo = idsCotizacionesConCobrosPeriodo.has(String(c.id));
      const hasMontoPagadoPeriodo = (Number(c.monto_pagado || 0) > 0);
      return hasPagoPeriodo || hasMontoPagadoPeriodo;
    });

    idsCotizacionesConCobros = new Set(cotizacionesConCobros.map(c => String(c.id)));

    if (process.env.NODE_ENV !== 'production') {
      console.log('🛠 [Dashboard Stats] cotizacionesConCobros finalizados:', {
        cotizacionesConCobros: cotizacionesConCobros.map(c => ({ id: c.id, total: calcularTotalDesdeItems(c), subtotal_materiales: c.subtotal_materiales, subtotal_servicios: c.subtotal_servicios, monto_pagado: c.monto_pagado })),
        idsCotizacionesConCobrosPeriodo: Array.from(idsCotizacionesConCobrosPeriodo),
        idsCotizacionesConCobros: Array.from(idsCotizacionesConCobros)
      });
    }

    // Recalcular ventas/abonado/cotizaciones en base al conjunto final de cotizaciones con cobros en el período
    ventasTotalesPeriodo = cotizacionesConCobros.reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);
    totalAbonado = cotizacionesConCobros.reduce((sum, c) => sum + (Number(c.monto_pagado) || 0), 0);
    cotizacionesPendientesPeriodo = cotizacionesConCobros.filter(c => c.estado === 'pendiente');
    cotizacionesRechazadasPeriodo = cotizacionesConCobros.filter(c => c.estado === 'rechazada');

    const cobrosTotalesPeriodoRaw = Array.from(cobradoPorCotizacionPeriodo.values()).reduce((sum, v) => sum + v, 0);

    // Si hay montos pagados en las cotizaciones que tuvieron pago en el período, usarlos (valor cliente)
    const cobrosPorCotizacionesConPagoPeriodo = cotizacionesConCobros.reduce((sum, c) => sum + (Number(c.monto_pagado) || 0), 0);

    if (cobrosPorCotizacionesConPagoPeriodo > 0) {
      cobrosTotalesPeriodo = cobrosPorCotizacionesConPagoPeriodo;
    } else {
      cobrosTotalesPeriodo = cobrosTotalesPeriodoRaw;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('🛠 [Dashboard Stats] cobros fuentes (revisado):', {
        cotizacionesConPagoPeriodo: cobrosPorCotizacionesConPagoPeriodo,
        cotizacionesPeriodo: cobrosPorCotizacionesPeriodo,
        cobrosTotalesPeriodoRaw,
        final: cobrosTotalesPeriodo
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('🛠 [Dashboard Stats] cobros fuentes:', {
        cotizaciones_monto_pagado: cobrosPorCotizacionesPeriodo,
        pagadas: cotizacionesPagadas.length,
        cotizacionesPorCobro: cobrosTotalesPeriodo,
        cobrosTotalesPeriodoRaw
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 [Dashboard Stats] Cobros periodo:', {
        cobrosTotalesPeriodoRaw,
        cobrosTotalesPeriodo,
        ventasTotalesPeriodo,
        sobrepagos: cobrosTotalesPeriodoRaw - cobrosTotalesPeriodo
      });
    }

    pagosMaterialesMes = (pagosMaterialesRes.data || []).reduce((sum: number, g: any) => {
      return sum + ((g.precio_unitario_real || 0) * (g.cantidad_real || 0));
    }, 0);

    pagosManoObraMes = (pagosManoObraRes.data || []).reduce((sum: number, m: any) => sum + (m.total_pagado || 0), 0);
    pagosHormigaMes = (pagosHormigaRes.data || []).reduce((sum: number, g: any) => sum + (g.monto || 0), 0);
    pagosTransporteMes = (pagosTransporteRes.data || []).reduce((sum: number, t: any) => sum + (t.costo || 0), 0);

    const gastosFijosLista = pagosGastosFijosRes.data || [];
    const getFixedExpenseAmount = (f: any) =>
      (f.amount ?? f.monto ?? f.valor ?? 0) as number;
    pagosGastosFijosMes = gastosFijosLista.reduce((sum: number, f: any) => sum + (getFixedExpenseAmount(f) || 0), 0);

    // Si no vino la categoría embebida, hidratarla por category_id para poder detectar IVA por categoría.
    try {
      const sinCategoria = gastosFijosLista.filter((f: any) => !f.category && !!f.category_id);
      if (sinCategoria.length > 0) {
        const categoryIds = Array.from(new Set(sinCategoria.map((f: any) => f.category_id).filter(Boolean)));
        if (categoryIds.length > 0) {
          const { data: cats, error: catsErr } = await supabase
            .from('fixed_expense_categories')
            .select('id, name')
            .in('id', categoryIds);
          if (!catsErr && cats) {
            const map = new Map<string, string>(cats.map((c: any) => [String(c.id), String(c.name)]));
            gastosFijosLista.forEach((f: any) => {
              if (!f.category && f.category_id && map.has(String(f.category_id))) {
                f.category = { name: map.get(String(f.category_id)) };
              }
            });
          }
        }
      }
    } catch {
      // no-op: si falla, solo no se hidrata categoría
    }

    // IVA pagado/registrado: heurística por texto + por categoría (robusta para distintos nombres)
    const ivaKeywords = [
      'iva',
      'dian',
      'impuesto',
      'impuestos',
      'tribut',
      'reteiva',
      'retencion iva',
      'retención iva',
      'declaracion',
      'declaración'
    ];
    pagosIVAMes = gastosFijosLista.reduce((sum: number, f: any) => {
      const desc = f.description ?? f.descripcion ?? f.detalle ?? f.concepto ?? '';
      const prov = f.provider ?? f.proveedor ?? f.vendor ?? '';
      const cat = f.category?.name ?? f.categoria?.name ?? f.categoria ?? f.category_name ?? '';
      const texto = `${desc} ${prov} ${cat}`.toLowerCase();
      const esIVA = ivaKeywords.some((k) => texto.includes(k));
      if (esIVA) return sum + (getFixedExpenseAmount(f) || 0);
      return sum;
    }, 0);

    pagosPersonalMes = (pagosPersonalRes.data || []).reduce((sum: number, l: any) => sum + (l.monto || 0), 0);
  } catch (e) {
    console.warn('⚠️ [Dashboard] Error al calcular pagos reales del mes:', e);
  }

   // Fuente de verdad unificada para KPIs financieros (cobros/egresos/IVA reservado)
  // para mantener consistencia entre ganancia neta y saldo real.
  try {
    kpisFinancierosPeriodo = await calcularKPIsFinancieros({
      fechaInicio: fechaInicioYMD,
      fechaFin: fechaFinYMD,
      debug: process.env.NODE_ENV !== 'production'
    });
    cobrosTotalesPeriodo = kpisFinancierosPeriodo.cobrosTotalesPeriodo;
    pagosMaterialesMes = kpisFinancierosPeriodo.pagosMaterialesPeriodo;
    pagosManoObraMes = kpisFinancierosPeriodo.pagosManoObraPeriodo;
    pagosHormigaMes = kpisFinancierosPeriodo.pagosHormigaPeriodo;
    pagosTransporteMes = kpisFinancierosPeriodo.pagosTransportePeriodo;
    pagosGastosFijosMes = kpisFinancierosPeriodo.pagosGastosFijosPeriodo;
    pagosPersonalMes = kpisFinancierosPeriodo.pagosPersonalPeriodo;
    cobradoPorCotizacionPeriodo = kpisFinancierosPeriodo.cobradoPorCotizacionPeriodo;

    if (process.env.NODE_ENV !== 'production') {
      console.log('🛠 [Dashboard Stats] cobrosTotalesPeriodo (final, periodo only):', {
        kpisBase: kpisFinancierosPeriodo?.cobrosTotalesPeriodo,
        cobrosTotalesPeriodo
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('🛠 [Dashboard Stats] cobrosTotalesPeriodo (final):', {
        kpisBase: kpisFinancierosPeriodo?.cobrosTotalesPeriodo,
        cobrosTotalesPeriodo
      });
    }
  } catch (e) {
    console.warn('⚠️ [Dashboard] No se pudieron unificar KPIs financieros del período:', e);
  }


  // Total de salidas reales del período
  const pagosTotalesMes =
    pagosMaterialesMes +
    pagosManoObraMes +
    pagosHormigaMes +
    pagosTransporteMes +
    pagosGastosFijosMes +      // ← YA INCLUYE IVA pagado en gastos fijos
    pagosPersonalMes;


  // ====== COBROS E IVA RESERVADO DEL PERÍODO (cashflow real, consistente con Caja de Ahorros) ======
  const cotizacionesAceptadasTodas = todasLasCotizaciones.filter(c => c.estado === 'aceptada');

  // IVA RESERVADO DEL PERÍODO (proporcional a lo cobrado)
  // Nota: Este es dinero que COBRÉ en nombre del estado, no es ganancia nuestra
  // Se restará cuando se PAGUE efectivamente a DIAN, no en este período
  // Usar cotizaciones con cobros en el período (aunque estén pendientes/aceptadas)
  let ivaReservadoPeriodo = cotizacionesConCobros.reduce((sum: number, c: any) => {
    const aplicaIVA = c.aplica_iva !== undefined ? Boolean(c.aplica_iva) : true;
    if (!aplicaIVA) return sum;
    const totalCotizacion = Number(c.total) || 0;
    if (totalCotizacion <= 0) return sum;
    const ivaCotizacion = Number(c.iva) || 0;
    if (ivaCotizacion <= 0) return sum;
    const cobradoPeriodo = Math.min(Number(cobradoPorCotizacionPeriodo.get(c.id) || 0), totalCotizacion);
    const proporcion = cobradoPeriodo / totalCotizacion;
    return sum + (ivaCotizacion * proporcion);
  }, 0);

   // ====== COSTOS REALES DEL PERÍODO (ENFOQUE BANCO / CAJA REAL) ======
  // Para no mezclar costos "presupuestados por cotización" con caja real, en KPI usamos
  // movimientos reales pagados dentro del período.
  gastosMaterialesMes = pagosMaterialesMes;
  gastosManoObraMes = pagosManoObraMes;
  gastosHormigaMes = pagosHormigaMes;
  gastosTransporteMes = pagosTransporteMes;
  gastosFijosMes = pagosGastosFijosMes;
  ivaRealMes = ivaReservadoPeriodo;

  // Mantener KPIs de costos alineados a pagos reales del período.
  // No mezclar con costos presupuestados para evitar desfases entre tarjetas.

  // Si no hay registro de gastos hormiga/transporte, pero hay cotizaciones con cobros, mantener 0.
  // Se puede mejorar con más datos si su modelo de cotizaciones tiene campos específicos de estos costos.

  // COSTOS TOTALES = costos operativos pagados + gastos fijos pagados
  // (no incluir IVA en costos reales para que quede separado como impuesto)
  const costosTotalesMes = gastosMaterialesMes + gastosManoObraMes + gastosHormigaMes + gastosTransporteMes + gastosFijosMes;

  // GANANCIA REAL = Cobros reales - Costos Totales reales (sin IVA)
  const gananciaMes = cobrosTotalesPeriodo - costosTotalesMes;

  // Margen de ganancia %
  const margenGananciaMes = cobrosTotalesPeriodo > 0 ? (gananciaMes / cobrosTotalesPeriodo) * 100 : 0;

  // GANANCIA NETA REAL (caja útil al final del período)
  // Fórmula basada en cashflow + costos reales + IVA pendiente
  // - cobros reales
  // - pagos reales
  // - costos reales (materia prima + obra + hormiga + transporte + fijos)
  // - IVA reservado (como obligación pendiente)
  const gananciaNetaMes = cobrosTotalesPeriodo - pagosTotalesMes - ivaReservadoPeriodo;

  // CASHFLOW NETO: cuánto queda en caja después de pagos reales del período y del IVA reservado.
  const gananciaNetaMesCashflow = cobrosTotalesPeriodo - pagosTotalesMes - ivaReservadoPeriodo;
  const saldoRealDisponiblePeriodo = gananciaNetaMesCashflow;

  // Margen de ganancia neta (sobre cobros reales, no sobre ventas facturadas)
  const margenGananciaNetaMes = cobrosTotalesPeriodo > 0 ? (gananciaNetaMes / cobrosTotalesPeriodo) * 100 : 0;

  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 [Dashboard Stats] KPI cálculo periodo:', {
      ventasTotalesPeriodo,
      cobrosTotalesPeriodo,
      pagosTotalesMes,
      ivaRealMes,
      ivaReservadoPeriodo,
      gananciaNetaMes,
      gananciaNetaMesCashflow,
      margenGananciaNetaMes
    });
  }


  // ====== COMPARACIÓN MES ANTERIOR ======
  const totalCotizacionesAnterior = cotizacionesPeriodoAnterior.length;
  
  // Cotizaciones aceptadas en el período anterior
  const cotizacionesAceptadasPeriodoAnterior = todasLasCotizaciones.filter(c => {
    if (c.estado !== 'aceptada') return false;
    const fechaAceptacion = new Date(c.created_at);
    return fechaAceptacion >= inicioPeriodoAnterior && fechaAceptacion <= finPeriodoAnterior;
  });

  const ventasPeriodoAnterior = cotizacionesAceptadasPeriodoAnterior.reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);

  const variacionCotizaciones = totalCotizacionesAnterior > 0
    ? ((totalCotizaciones - totalCotizacionesAnterior) / totalCotizacionesAnterior) * 100
    : 0;

  const variacionVentas = ventasPeriodoAnterior > 0
    ? ((ventasTotalesPeriodo - ventasPeriodoAnterior) / ventasPeriodoAnterior) * 100
    : 0;

  // ====== TOTALES HISTÓRICOS ======
  // IMPORTANTE: Solo contar costos de cotizaciones ACEPTADAS históricamente
  const cotizacionesAceptadasHistorico = todasLasCotizaciones.filter(c => c.estado === 'aceptada');
  const idsCotizacionesAceptadasHistorico = cotizacionesAceptadasHistorico.map(c => c.id);

  const ventasTotalesHistorico = cotizacionesAceptadasHistorico
    .reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);

  // Costos históricos totales (solo de cotizaciones aceptadas, incluye IVA)
  let costosTotalesHistorico = 0;
  let ivaRealHistorico = 0;
  
  if (idsCotizacionesAceptadasHistorico.length > 0) {
    // IMPORTANTE: Obtener la cantidad del item para cada cotización
    const cantidadPorCotizacionHist = new Map<string, number>();
    cotizacionesAceptadasHistorico.forEach(cotizacion => {
      let cantidadItem = 1;
      if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
        const itemConCantidad = cotizacion.items.find((item: any) => item.cantidad && item.cantidad > 1);
        if (itemConCantidad) {
          cantidadItem = itemConCantidad.cantidad;
        }
      }
      cantidadPorCotizacionHist.set(cotizacion.id, cantidadItem);
    });

  const [materialesHist, manoObraHist, hormigaHist, transporteHist] = await Promise.all([
      supabase.from('gastos_reales_materiales')
        .select('precio_unitario_real, cantidad_real, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
        .in('cotizacion_id', idsCotizacionesAceptadasHistorico),
      supabase.from('mano_obra_real')
        .select('total_pagado, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
        .in('cotizacion_id', idsCotizacionesAceptadasHistorico),
      supabase.from('gastos_hormiga')
        .select('monto, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
        .in('cotizacion_id', idsCotizacionesAceptadasHistorico),
      supabase.from('transporte_real')
        .select('costo, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
        .in('cotizacion_id', idsCotizacionesAceptadasHistorico)
    ]);
    
    console.log('📊 [Dashboard Stats] Datos históricos obtenidos:');
    console.log('  - Materiales:', materialesHist.data?.length || 0, 'registros');
    console.log('  - Mano Obra:', manoObraHist.data?.length || 0, 'registros');
    console.log('  - Gastos Hormiga:', hormigaHist.data?.length || 0, 'registros');
    console.log('  - Transporte:', transporteHist.data?.length || 0, 'registros');

    // IMPORTANTE: Calcular considerando el alcance_gasto de cada gasto
    const costosMaterialesHist = (materialesHist.data || []).reduce((sum, g) => {
      const cantidadItem = cantidadPorCotizacionHist.get(g.cotizacion_id) || 1;
      const costoPorUnidad = (g.precio_unitario_real || 0) * (g.cantidad_real || 0);
      
      let multiplicador = 1;
      if (g.alcance_gasto === 'unidad') {
        multiplicador = cantidadItem;
      } else if (g.alcance_gasto === 'parcial') {
        multiplicador = g.cantidad_items_aplicados || 1;
      } else if (g.alcance_gasto === 'total') {
        multiplicador = 1;
      } else {
        // Por defecto (gastos antiguos sin alcance_gasto): 
        // IMPORTANTE: Asumir que son "total" (ya incluyen todos los items)
        // Si necesitas que se multipliquen, edita el gasto y marca como "unidad"
        multiplicador = 1;
      }
      
      const costoTotal = costoPorUnidad * multiplicador;
      return sum + costoTotal;
    }, 0);
    
    // Debug: Contar gastos sin alcance_gasto
    const materialesSinAlcance = (materialesHist.data || []).filter(g => !g.alcance_gasto).length;
    if (materialesSinAlcance > 0) {
      console.log('⚠️ [Dashboard Stats] Materiales sin alcance_gasto (tratados como "total"):', materialesSinAlcance);
    }

    const costosManoObraHist = (manoObraHist.data || []).reduce((sum, m) => {
      const cantidadItem = cantidadPorCotizacionHist.get(m.cotizacion_id) || 1;
      const costoPorUnidad = m.total_pagado || 0;
      
      let multiplicador = 1;
      if (m.alcance_gasto === 'unidad') {
        multiplicador = cantidadItem;
      } else if (m.alcance_gasto === 'parcial') {
        multiplicador = m.cantidad_items_aplicados || 1;
      } else if (m.alcance_gasto === 'total') {
        multiplicador = 1;
      } else {
        // Por defecto: asumir total
        multiplicador = 1;
      }
      
      return sum + (costoPorUnidad * multiplicador);
    }, 0);
    
    const manoObraSinAlcance = (manoObraHist.data || []).filter(m => !m.alcance_gasto).length;
    if (manoObraSinAlcance > 0) {
      console.log('⚠️ [Dashboard Stats] Mano de obra sin alcance_gasto (tratados como "total"):', manoObraSinAlcance);
    }

    const costosHormigaHist = (hormigaHist.data || []).reduce((sum, g) => {
      const cantidadItem = cantidadPorCotizacionHist.get(g.cotizacion_id) || 1;
      const costoPorUnidad = g.monto || 0;
      
      let multiplicador = 1;
      if (g.alcance_gasto === 'unidad') {
        multiplicador = cantidadItem;
      } else if (g.alcance_gasto === 'parcial') {
        multiplicador = g.cantidad_items_aplicados || 1;
      } else if (g.alcance_gasto === 'total') {
        multiplicador = 1;
      } else {
        // Por defecto: asumir total
        multiplicador = 1;
      }
      
      return sum + (costoPorUnidad * multiplicador);
    }, 0);
    
    const hormigaSinAlcance = (hormigaHist.data || []).filter(g => !g.alcance_gasto).length;
    if (hormigaSinAlcance > 0) {
      console.log('⚠️ [Dashboard Stats] Gastos hormiga sin alcance_gasto (tratados como "total"):', hormigaSinAlcance);
    }

    const costosTransporteHist = (transporteHist.data || []).reduce((sum, t) => {
      const cantidadItem = cantidadPorCotizacionHist.get(t.cotizacion_id) || 1;
      const costoPorUnidad = t.costo || 0;
      
      let multiplicador = 1;
      if (t.alcance_gasto === 'unidad') {
        multiplicador = cantidadItem;
      } else if (t.alcance_gasto === 'parcial') {
        multiplicador = t.cantidad_items_aplicados || 1;
      } else if (t.alcance_gasto === 'total') {
        multiplicador = 1;
      } else {
        // Por defecto: asumir total
        multiplicador = 1;
      }
      
      return sum + (costoPorUnidad * multiplicador);
    }, 0);
    
    const transporteSinAlcance = (transporteHist.data || []).filter(t => !t.alcance_gasto).length;
    if (transporteSinAlcance > 0) {
      console.log('⚠️ [Dashboard Stats] Transporte sin alcance_gasto (tratados como "total"):', transporteSinAlcance);
    }

    // IVA histórico: presupuestado de todas las cotizaciones aceptadas (IVA no es ganancia)
    try {
      cotizacionesAceptadasHistorico.forEach(cotizacion => {
        const descuento = (cotizacion as any).descuento || 0;
        const subtotal = cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0
          ? cotizacion.items.reduce((sum: number, item: any) => sum + (item.precio_total || 0), 0)
          : ((cotizacion as any).subtotal || 0);
        const descuentoMonto = subtotal * (descuento / 100);
        const subtotalConDescuento = subtotal - descuentoMonto;
        const ivaPorcentaje = (cotizacion as any).iva_porcentaje || 19;
        ivaRealHistorico += subtotalConDescuento * (ivaPorcentaje / 100);
      });
      console.log('💰 [Dashboard] IVA histórico (presupuestado, no es ganancia):', ivaRealHistorico);
    } catch (e) {
      console.warn('⚠️ [Dashboard] Error al calcular IVA histórico:', e);
    }

    costosTotalesHistorico = costosMaterialesHist + costosManoObraHist + costosHormigaHist + costosTransporteHist + ivaRealHistorico;
    
    console.log('📊 [Dashboard Stats] Costos históricos calculados (con alcance_gasto + IVA):');
    console.log('  - Materiales:', costosMaterialesHist.toLocaleString('es-CO'));
    console.log('  - Mano Obra:', costosManoObraHist.toLocaleString('es-CO'));
    console.log('  - Gastos Hormiga:', costosHormigaHist.toLocaleString('es-CO'));
    console.log('  - Transporte:', costosTransporteHist.toLocaleString('es-CO'));
    console.log('  - Total:', costosTotalesHistorico.toLocaleString('es-CO'));
    console.log('  - Ventas Históricas:', ventasTotalesHistorico.toLocaleString('es-CO'));
    console.log('  - Ganancia Histórica:', (ventasTotalesHistorico - costosTotalesHistorico).toLocaleString('es-CO'));

    // Verificar costos de K001 específicamente
    if (cotizacionK001 && cotizacionK001.estado === 'aceptada') {
      const cantidadItemK001 = cantidadPorCotizacionHist.get(cotizacionK001.id) || 1;
      
      const costosK001 = {
        materiales: (materialesHist.data || []).filter(g => g.cotizacion_id === cotizacionK001.id)
          .reduce((sum, g) => {
            const costoPorUnidad = (g.precio_unitario_real || 0) * (g.cantidad_real || 0);
            let multiplicador = 1;
            if (g.alcance_gasto === 'unidad') {
              multiplicador = cantidadItemK001;
            } else if (g.alcance_gasto === 'parcial') {
              multiplicador = g.cantidad_items_aplicados || 1;
            } else if (g.alcance_gasto === 'total') {
              multiplicador = 1;
            } else {
              multiplicador = 1;
            }
            return sum + (costoPorUnidad * multiplicador);
          }, 0),
        manoObra: (manoObraHist.data || []).filter(m => m.cotizacion_id === cotizacionK001.id)
          .reduce((sum, m) => {
            const costoPorUnidad = m.total_pagado || 0;
            let multiplicador = 1;
            if (m.alcance_gasto === 'unidad') {
              multiplicador = cantidadItemK001;
            } else if (m.alcance_gasto === 'parcial') {
              multiplicador = m.cantidad_items_aplicados || 1;
            } else if (m.alcance_gasto === 'total') {
              multiplicador = 1;
            } else {
              multiplicador = 1;
            }
            return sum + (costoPorUnidad * multiplicador);
          }, 0),
        gastosHormiga: (hormigaHist.data || []).filter(g => g.cotizacion_id === cotizacionK001.id)
          .reduce((sum, g) => {
            const costoPorUnidad = g.monto || 0;
            let multiplicador = 1;
            if (g.alcance_gasto === 'unidad') {
              multiplicador = cantidadItemK001;
            } else if (g.alcance_gasto === 'parcial') {
              multiplicador = g.cantidad_items_aplicados || 1;
            } else if (g.alcance_gasto === 'total') {
              multiplicador = 1;
            } else {
              multiplicador = 1;
            }
            return sum + (costoPorUnidad * multiplicador);
          }, 0),
        transporte: (transporteHist.data || []).filter(t => t.cotizacion_id === cotizacionK001.id)
          .reduce((sum, t) => {
            const costoPorUnidad = t.costo || 0;
            let multiplicador = 1;
            if (t.alcance_gasto === 'unidad') {
              multiplicador = cantidadItemK001;
            } else if (t.alcance_gasto === 'parcial') {
              multiplicador = t.cantidad_items_aplicados || 1;
            } else if (t.alcance_gasto === 'total') {
              multiplicador = 1;
            } else {
              multiplicador = 1;
            }
            return sum + (costoPorUnidad * multiplicador);
          }, 0)
      };
      (costosK001 as any).total = costosK001.materiales + costosK001.manoObra + costosK001.gastosHormiga + costosK001.transporte;
      
      console.log('🔍 [Dashboard Stats] Costos de K001:', {
        cotizacion_id: cotizacionK001.id,
        numero: cotizacionK001.numero,
        estado: cotizacionK001.estado,
        costos: costosK001,
        registrosMateriales: (materialesHist.data || []).filter(g => g.cotizacion_id === cotizacionK001.id).length,
        registrosManoObra: (manoObraHist.data || []).filter(m => m.cotizacion_id === cotizacionK001.id).length,
        registrosHormiga: (hormigaHist.data || []).filter(g => g.cotizacion_id === cotizacionK001.id).length,
        registrosTransporte: (transporteHist.data || []).filter(t => t.cotizacion_id === cotizacionK001.id).length
      });
    }

    // Debug: Log histórico
    console.log('📊 [Dashboard Stats] Costos históricos:', {
      cotizacionesAceptadas: idsCotizacionesAceptadasHistorico.length,
      materiales: {
        total: costosMaterialesHist,
        registros: materialesHist.data?.length || 0
      },
      manoObra: {
        total: costosManoObraHist,
        registros: manoObraHist.data?.length || 0
      },
      gastosHormiga: {
        total: costosHormigaHist,
        registros: hormigaHist.data?.length || 0
      },
      transporte: {
        total: costosTransporteHist,
        registros: transporteHist.data?.length || 0
      },
      total: costosTotalesHistorico
    });
  }

  const gananciaHistorica = ventasTotalesHistorico - costosTotalesHistorico;

  // ====== SALDO REAL GLOBAL (CAJA) ======
  // Usar exactamente el mismo cálculo que la Caja de Ahorros para que los números coincidan.
  let saldoRealDisponible = 0;
  let totalAhorros = 0;
  let disponibleParaGastar = 0;
  let totalCobradoHistorico = 0;
  let totalPagadoHistorico = 0;
  let ivaReservadoHistorico = 0;
  try {
    const saldoGlobal = await obtenerSaldoDisponible();
    saldoRealDisponible = saldoGlobal.saldoRealDisponible;
    totalAhorros = saldoGlobal.totalAhorros;
    disponibleParaGastar = saldoGlobal.disponibleParaGastar;
    totalCobradoHistorico = saldoGlobal.totalCobradoHistorico;
    totalPagadoHistorico = saldoGlobal.totalPagadoHistorico;
    ivaReservadoHistorico = saldoGlobal.ivaReservadoHistorico;
  } catch (e) {
    console.warn('⚠️ [Dashboard] Error al obtener saldo real global:', e);
  }

  // ====== COTIZACIONES RECIENTES ======
  const cotizacionesRecientes = todasLasCotizaciones.slice(0, 5).map(c => ({
    id: c.id,
    numero: c.numero,
    cliente_nombre: c.cliente_nombre,
    total: calcularTotalDesdeItems(c),
    estado: c.estado,
    created_at: c.created_at
  }));

  return {
    totalCotizaciones,
    cotizacionesAceptadas: cotizacionesAceptadasPeriodo.length,
    cotizacionesPendientes: cotizacionesPendientesPeriodo.length,
    cotizacionesRechazadas: cotizacionesRechazadasPeriodo.length,
    ventasTotalesMes: ventasTotalesPeriodo,
    cobrosTotalesPeriodo,
    cotizacionesAceptadasEnProceso: cotizacionesEnProceso.length,
    cotizacionesPagadasCompletamente: cotizacionesPagadas.length,
    totalAbonado: totalAbonado,
    totalPendiente: totalPendiente,
    gastosMaterialesMes,
    gastosManoObraMes,
    gastosHormigaMes,
    gastosTransporteMes,
    gastosFijosMes,
    costosTotalesMes,
    ivaRealMes,
    gananciaMes,
    margenGananciaMes,
    gananciaNetaMes,
    gananciaNetaMesCashflow,
    margenGananciaNetaMes,
    saldoRealDisponiblePeriodo,

    pagosMaterialesMes,
    pagosManoObraMes,
    pagosHormigaMes,
    pagosTransporteMes,
    pagosGastosFijosMes,
    pagosPersonalMes,
    pagosIVAMes,
    pagosTotalesMes,

    ivaReservadoPeriodo,
    variacionCotizaciones,
    variacionVentas,
    ventasTotalesHistorico,
    costosTotalesHistorico,
    ivaRealHistorico,
    gananciaHistorica,
    totalCobradoHistorico,
    totalPagadoHistorico,
    ivaReservadoHistorico,
    saldoRealDisponible,
    totalAhorros,
    disponibleParaGastar,
    cotizacionesRecientes
  };
}
