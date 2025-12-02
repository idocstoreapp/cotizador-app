/**
 * Servicio para obtener estadísticas del dashboard
 * MEJORADO: Incluye TODOS los costos reales (materiales, mano de obra, gastos hormiga, transporte)
 */
import { supabase } from '../utils/supabase';
import { obtenerCotizaciones } from './cotizaciones.service';
import type { Cotizacion } from '../types/database';

export interface EstadisticasDashboard {
  // Cotizaciones
  totalCotizaciones: number;
  cotizacionesAceptadas: number;
  cotizacionesPendientes: number;
  cotizacionesRechazadas: number;
  
  // Financiero del mes - VENTAS
  ventasTotalesMes: number; // Total de cotizaciones aceptadas del mes
  
  // Financiero del mes - COSTOS REALES (TODOS)
  gastosMaterialesMes: number;
  gastosManoObraMes: number;
  gastosHormigaMes: number;
  gastosTransporteMes: number;
  costosTotalesMes: number; // Suma de todos los costos
  
  // Financiero del mes - GANANCIA REAL
  gananciaMes: number; // Ventas - Costos Totales
  margenGananciaMes: number; // (Ganancia / Ventas) * 100
  
  // Comparación mes anterior
  variacionCotizaciones: number;
  variacionVentas: number;
  
  // Totales históricos
  ventasTotalesHistorico: number;
  costosTotalesHistorico: number;
  gananciaHistorica: number;
  
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

/**
 * Obtiene estadísticas del dashboard para un mes específico
 * MEJORADO: Incluye TODOS los costos reales
 * @param mes - Mes a consultar (0-11, donde 0 = enero). Si no se proporciona, usa el mes actual
 * @param año - Año a consultar. Si no se proporciona, usa el año actual
 */
export async function obtenerEstadisticasDashboard(mes?: number, año?: number): Promise<EstadisticasDashboard> {
  const ahora = new Date();
  const mesSeleccionado = mes !== undefined ? mes : ahora.getMonth();
  const añoSeleccionado = año !== undefined ? año : ahora.getFullYear();
  
  const inicioMes = new Date(añoSeleccionado, mesSeleccionado, 1);
  const finMes = new Date(añoSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);
  
  const inicioMesAnterior = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
  const finMesAnterior = new Date(añoSeleccionado, mesSeleccionado, 0, 23, 59, 59);

  // Obtener todas las cotizaciones
  const todasLasCotizaciones = await obtenerCotizaciones();
  
  // Filtrar cotizaciones CREADAS en el mes actual (para contar totales)
  const cotizacionesMes = todasLasCotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const inicioNormalizado = new Date(inicioMes.getFullYear(), inicioMes.getMonth(), inicioMes.getDate());
    const finNormalizado = new Date(finMes.getFullYear(), finMes.getMonth(), finMes.getDate());
    return fechaNormalizada >= inicioNormalizado && fechaNormalizada <= finNormalizado;
  });

  // Filtrar cotizaciones ACEPTADAS en el mes actual (para ventas)
  // Usar updated_at si está disponible, sino created_at
  const cotizacionesAceptadasMes = todasLasCotizaciones.filter(c => {
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

  const cotizacionesMesAnterior = todasLasCotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const inicioAnteriorNormalizado = new Date(inicioMesAnterior.getFullYear(), inicioMesAnterior.getMonth(), inicioMesAnterior.getDate());
    const finAnteriorNormalizado = new Date(finMesAnterior.getFullYear(), finMesAnterior.getMonth(), finMesAnterior.getDate());
    return fechaNormalizada >= inicioAnteriorNormalizado && fechaNormalizada <= finAnteriorNormalizado;
  });

  // Debug: Log para verificar filtros
  console.log('📊 [Dashboard Stats] Filtros:', {
    totalCotizaciones: todasLasCotizaciones.length,
    cotizacionesCreadasMes: cotizacionesMes.length,
    cotizacionesAceptadasMes: cotizacionesAceptadasMes.length,
    cotizacionesMesAnterior: cotizacionesMesAnterior.length,
    rangoMes: {
      inicio: inicioMes.toISOString().split('T')[0],
      fin: finMes.toISOString().split('T')[0]
    }
  });

  // Estadísticas de cotizaciones del mes
  const totalCotizaciones = cotizacionesMes.length;
  const cotizacionesPendientesMes = cotizacionesMes.filter(c => c.estado === 'pendiente');
  const cotizacionesRechazadasMes = cotizacionesMes.filter(c => c.estado === 'rechazada');

  // Ventas del mes (cotizaciones aceptadas en el mes actual)
  const ventasTotalesMes = cotizacionesAceptadasMes.reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);

  // ====== COSTOS REALES DEL MES (TODOS) ======
  // IMPORTANTE: Usar created_at (fecha de registro) en lugar de fecha_compra/fecha
  // porque queremos saber cuándo se registró el gasto, no cuándo ocurrió
  
  // 1. Gastos en materiales (registrados este mes)
  const { data: gastosMateriales } = await supabase
    .from('gastos_reales_materiales')
    .select('precio_unitario_real, cantidad_real, created_at')
    .gte('created_at', inicioMes.toISOString())
    .lte('created_at', finMes.toISOString());

  const gastosMaterialesMes = (gastosMateriales || []).reduce((sum, g) => {
    return sum + ((g.precio_unitario_real || 0) * (g.cantidad_real || 0));
  }, 0);

  // 2. Mano de obra real (registrada este mes)
  const { data: manoObra } = await supabase
    .from('mano_obra_real')
    .select('total_pagado, created_at')
    .gte('created_at', inicioMes.toISOString())
    .lte('created_at', finMes.toISOString());

  const gastosManoObraMes = (manoObra || []).reduce((sum, m) => sum + (m.total_pagado || 0), 0);

  // 3. Gastos hormiga (registrados este mes)
  const { data: gastosHormiga } = await supabase
    .from('gastos_hormiga')
    .select('monto, created_at')
    .gte('created_at', inicioMes.toISOString())
    .lte('created_at', finMes.toISOString());

  const gastosHormigaMes = (gastosHormiga || []).reduce((sum, g) => sum + (g.monto || 0), 0);

  // 4. Transporte real (registrado este mes)
  const { data: transporte } = await supabase
    .from('transporte_real')
    .select('costo, created_at')
    .gte('created_at', inicioMes.toISOString())
    .lte('created_at', finMes.toISOString());

  const gastosTransporteMes = (transporte || []).reduce((sum, t) => sum + (t.costo || 0), 0);

  // Debug: Log de costos
  console.log('💰 [Dashboard Stats] Costos del mes:', {
    materiales: gastosMaterialesMes,
    manoObra: gastosManoObraMes,
    gastosHormiga: gastosHormigaMes,
    transporte: gastosTransporteMes,
    total: gastosMaterialesMes + gastosManoObraMes + gastosHormigaMes + gastosTransporteMes
  });

  // COSTOS TOTALES = Materiales + Mano de Obra + Gastos Hormiga + Transporte
  const costosTotalesMes = gastosMaterialesMes + gastosManoObraMes + gastosHormigaMes + gastosTransporteMes;

  // GANANCIA REAL = Ventas - Costos Totales
  const gananciaMes = ventasTotalesMes - costosTotalesMes;
  
  // Margen de ganancia %
  const margenGananciaMes = ventasTotalesMes > 0 ? (gananciaMes / ventasTotalesMes) * 100 : 0;

  // ====== COMPARACIÓN MES ANTERIOR ======
  const totalCotizacionesAnterior = cotizacionesMesAnterior.length;
  
  // Cotizaciones aceptadas en el mes anterior (usar updated_at si está disponible)
  const cotizacionesAceptadasMesAnterior = todasLasCotizaciones.filter(c => {
    if (c.estado !== 'aceptada') return false;
    const fechaAceptacion = c.updated_at && c.updated_at !== c.created_at 
      ? new Date(c.updated_at) 
      : new Date(c.created_at);
    const fechaNormalizada = new Date(fechaAceptacion.getFullYear(), fechaAceptacion.getMonth(), fechaAceptacion.getDate());
    const inicioAnteriorNormalizado = new Date(inicioMesAnterior.getFullYear(), inicioMesAnterior.getMonth(), inicioMesAnterior.getDate());
    const finAnteriorNormalizado = new Date(finMesAnterior.getFullYear(), finMesAnterior.getMonth(), finMesAnterior.getDate());
    return fechaNormalizada >= inicioAnteriorNormalizado && fechaNormalizada <= finAnteriorNormalizado;
  });
  
  const ventasMesAnterior = cotizacionesAceptadasMesAnterior.reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);

  const variacionCotizaciones = totalCotizacionesAnterior > 0
    ? ((totalCotizaciones - totalCotizacionesAnterior) / totalCotizacionesAnterior) * 100
    : 0;

  const variacionVentas = ventasMesAnterior > 0
    ? ((ventasTotalesMes - ventasMesAnterior) / ventasMesAnterior) * 100
    : 0;

  // ====== TOTALES HISTÓRICOS ======
  const ventasTotalesHistorico = todasLasCotizaciones
    .filter(c => c.estado === 'aceptada')
    .reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);

  // Costos históricos totales
  const [materialesHist, manoObraHist, hormigaHist, transporteHist] = await Promise.all([
    supabase.from('gastos_reales_materiales').select('precio_unitario_real, cantidad_real'),
    supabase.from('mano_obra_real').select('total_pagado'),
    supabase.from('gastos_hormiga').select('monto'),
    supabase.from('transporte_real').select('costo')
  ]);

  const costosTotalesHistorico = 
    (materialesHist.data || []).reduce((sum, g) => sum + ((g.precio_unitario_real || 0) * (g.cantidad_real || 0)), 0) +
    (manoObraHist.data || []).reduce((sum, m) => sum + (m.total_pagado || 0), 0) +
    (hormigaHist.data || []).reduce((sum, g) => sum + (g.monto || 0), 0) +
    (transporteHist.data || []).reduce((sum, t) => sum + (t.costo || 0), 0);

  const gananciaHistorica = ventasTotalesHistorico - costosTotalesHistorico;

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
    cotizacionesAceptadas: cotizacionesAceptadasMes.length,
    cotizacionesPendientes: cotizacionesPendientesMes.length,
    cotizacionesRechazadas: cotizacionesRechazadasMes.length,
    ventasTotalesMes,
    gastosMaterialesMes,
    gastosManoObraMes,
    gastosHormigaMes,
    gastosTransporteMes,
    costosTotalesMes,
    gananciaMes,
    margenGananciaMes,
    variacionCotizaciones,
    variacionVentas,
    ventasTotalesHistorico,
    costosTotalesHistorico,
    gananciaHistorica,
    cotizacionesRecientes
  };
}

