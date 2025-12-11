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
  
  // Financiero del mes - VENTAS (SOLO PAGADAS)
  ventasTotalesMes: number; // Total de cotizaciones PAGADAS del mes
  
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
  ivaRealMes: number; // IVA real desde facturas
  costosTotalesMes: number; // Suma de todos los costos (incluye IVA)
  
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
  
  if (fechaInicio && fechaFin) {
    // Usar rango de fechas proporcionado
    inicioPeriodo = new Date(fechaInicio);
    inicioPeriodo.setHours(0, 0, 0, 0);
    finPeriodo = new Date(fechaFin);
    finPeriodo.setHours(23, 59, 59, 999);
  } else {
    // Fallback a mes/año
    const mesSeleccionado = mes !== undefined ? mes : ahora.getMonth();
    const añoSeleccionado = año !== undefined ? año : ahora.getFullYear();
    inicioPeriodo = new Date(añoSeleccionado, mesSeleccionado, 1);
    inicioPeriodo.setHours(0, 0, 0, 0);
    finPeriodo = new Date(añoSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);
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
  // Usar updated_at si está disponible, sino created_at
  const cotizacionesAceptadasPeriodo = todasLasCotizaciones.filter(c => {
    if (c.estado !== 'aceptada') return false;
    // Si tiene updated_at y es diferente de created_at, usar updated_at (fecha de aceptación)
    const fechaAceptacion = c.updated_at && c.updated_at !== c.created_at 
      ? new Date(c.updated_at) 
      : new Date(c.created_at);
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
      inicio: inicioPeriodo.toISOString().split('T')[0],
      fin: finPeriodo.toISOString().split('T')[0]
    },
    k001: cotizacionK001 ? {
      id: cotizacionK001.id,
      numero: cotizacionK001.numero,
      estado: cotizacionK001.estado,
      created_at: cotizacionK001.created_at,
      updated_at: cotizacionK001.updated_at,
      estaEnPeriodo: cotizacionesAceptadasPeriodo.some(c => c.id === cotizacionK001.id),
      fechaAceptacion: cotizacionK001.updated_at && cotizacionK001.updated_at !== cotizacionK001.created_at 
        ? new Date(cotizacionK001.updated_at).toISOString().split('T')[0]
        : new Date(cotizacionK001.created_at).toISOString().split('T')[0]
    } : 'No encontrada'
  });

  // Estadísticas de cotizaciones del período
  const totalCotizaciones = cotizacionesPeriodo.length;
  const cotizacionesPendientesPeriodo = cotizacionesPeriodo.filter(c => c.estado === 'pendiente');
  const cotizacionesRechazadasPeriodo = cotizacionesPeriodo.filter(c => c.estado === 'rechazada');

  // Separar cotizaciones aceptadas por estado de pago
  const cotizacionesPagadas = cotizacionesAceptadasPeriodo.filter(c => 
    c.estado_pago === 'pagado' || (c.monto_pagado && c.monto_pagado > 0 && c.monto_pagado >= calcularTotalDesdeItems(c))
  );
  const cotizacionesEnProceso = cotizacionesAceptadasPeriodo.filter(c => 
    !c.estado_pago || c.estado_pago === 'no_pagado' || c.estado_pago === 'pago_parcial' || 
    (c.monto_pagado && c.monto_pagado > 0 && c.monto_pagado < calcularTotalDesdeItems(c))
  );

  // Ventas del período (SOLO cotizaciones PAGADAS)
  const ventasTotalesPeriodo = cotizacionesPagadas.reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);

  // Calcular total abonado (suma de todos los monto_pagado, incluyendo parciales)
  const totalAbonado = cotizacionesAceptadasPeriodo.reduce((sum, c) => {
    return sum + (c.monto_pagado || 0);
  }, 0);

  // Calcular total pendiente (lo que resta por pagar)
  const totalPendiente = cotizacionesEnProceso.reduce((sum, c) => {
    const total = calcularTotalDesdeItems(c);
    const pagado = c.monto_pagado || 0;
    return sum + (total - pagado);
  }, 0);

  // ====== COSTOS REALES DEL PERÍODO (TODOS) ======
  // IMPORTANTE: Contar todos los costos reales de las cotizaciones aceptadas en el período
  // Esto refleja mejor la realidad: si una cotización fue aceptada en el período,
  // todos sus costos reales (sin importar cuándo ocurrieron) se asocian a esa venta del período
  
  // Obtener IDs de cotizaciones aceptadas en el período
  const idsCotizacionesAceptadas = cotizacionesAceptadasPeriodo.map(c => c.id);
  
  // Si no hay cotizaciones aceptadas, los costos son 0
  let gastosMaterialesMes = 0;
  let gastosManoObraMes = 0;
  let gastosHormigaMes = 0;
  let gastosTransporteMes = 0;
  
  // Inicializar variables de datos (necesarias para el debug después)
  let gastosMateriales: any[] = [];
  let manoObra: any[] = [];
  let gastosHormiga: any[] = [];
  let transporte: any[] = [];
  
  if (idsCotizacionesAceptadas.length > 0) {
    // IMPORTANTE: Obtener las cotizaciones con sus items para saber la cantidad del item
    // Los gastos reales están registrados para 1 unidad, necesitamos multiplicar por la cantidad
    const cotizacionesConItems = await Promise.all(
      cotizacionesAceptadasPeriodo.map(async (cotizacion) => {
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
  
    // 1. Gastos en materiales (de todas las cotizaciones aceptadas en el mes)
    const { data: gastosMaterialesData, error: errorMateriales } = await supabase
    .from('gastos_reales_materiales')
      .select('precio_unitario_real, cantidad_real, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
      .in('cotizacion_id', idsCotizacionesAceptadas);

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
        // Por defecto (gastos antiguos sin alcance_gasto): multiplicar por cantidadItem
        multiplicador = cantidadItem;
      }
      
      const costoTotal = costoPorUnidad * multiplicador;
      return sum + costoTotal;
  }, 0);

    // 2. Mano de obra real (de todas las cotizaciones aceptadas en el mes)
    const { data: manoObraData, error: errorManoObra } = await supabase
    .from('mano_obra_real')
      .select('total_pagado, cotizacion_id, alcance_gasto, cantidad_items_aplicados')
      .in('cotizacion_id', idsCotizacionesAceptadas);

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
      .in('cotizacion_id', idsCotizacionesAceptadas);

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
      .in('cotizacion_id', idsCotizacionesAceptadas);

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
  if (idsCotizacionesAceptadas.length > 0) {
    cotizacionesAceptadasPeriodo.forEach(cotizacion => {
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
    cotizacionesAceptadas: idsCotizacionesAceptadas.length,
    idsCotizaciones: idsCotizacionesAceptadas,
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
  // El IVA real = IVA presupuestado (valor fijo, no se calcula desde facturas)
  // Las facturas son solo registro administrativo, no afectan los cálculos
  let ivaRealMes = 0;
  try {
    // Calcular IVA presupuestado de todas las cotizaciones aceptadas del mes
    cotizacionesAceptadas.forEach(cotizacion => {
      const descuento = (cotizacion as any).descuento || 0;
      const subtotal = cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0
        ? cotizacion.items.reduce((sum: number, item: any) => sum + (item.precio_total || 0), 0)
        : ((cotizacion as any).subtotal || 0);
      const descuentoMonto = subtotal * (descuento / 100);
      const subtotalConDescuento = subtotal - descuentoMonto;
      const ivaPorcentaje = (cotizacion as any).iva_porcentaje || 19;
      const ivaPresupuestado = subtotalConDescuento * (ivaPorcentaje / 100);
      ivaRealMes += ivaPresupuestado;
    });
    
    console.log('💰 [Dashboard] IVA Real del mes (presupuestado):', ivaRealMes);
  } catch (error) {
    console.warn('⚠️ [Dashboard] Error al calcular IVA presupuestado:', error);
  }

  // COSTOS TOTALES = Materiales + Mano de Obra + Gastos Hormiga + Transporte + IVA Presupuestado
  const costosTotalesMes = gastosMaterialesMes + gastosManoObraMes + gastosHormigaMes + gastosTransporteMes + ivaRealMes;

  // GANANCIA REAL = Ventas - Costos Totales (incluye IVA)
  const gananciaMes = ventasTotalesPeriodo - costosTotalesMes;
  
  // Margen de ganancia %
  const margenGananciaMes = ventasTotalesPeriodo > 0 ? (gananciaMes / ventasTotalesPeriodo) * 100 : 0;

  // ====== COMPARACIÓN MES ANTERIOR ======
  const totalCotizacionesAnterior = cotizacionesPeriodoAnterior.length;
  
  // Cotizaciones aceptadas en el período anterior (usar updated_at si está disponible)
  const cotizacionesAceptadasPeriodoAnterior = todasLasCotizaciones.filter(c => {
    if (c.estado !== 'aceptada') return false;
    const fechaAceptacion = c.updated_at && c.updated_at !== c.created_at 
      ? new Date(c.updated_at) 
      : new Date(c.created_at);
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

  // Costos históricos totales (solo de cotizaciones aceptadas)
  let costosTotalesHistorico = 0;
  
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

    costosTotalesHistorico = costosMaterialesHist + costosManoObraHist + costosHormigaHist + costosTransporteHist;
    
    console.log('📊 [Dashboard Stats] Costos históricos calculados (con alcance_gasto):');
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
      costosK001.total = costosK001.materiales + costosK001.manoObra + costosK001.gastosHormiga + costosK001.transporte;
      
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
    cotizacionesAceptadasEnProceso: cotizacionesEnProceso.length,
    cotizacionesPagadasCompletamente: cotizacionesPagadas.length,
    totalAbonado: totalAbonado,
    totalPendiente: totalPendiente,
    gastosMaterialesMes,
    gastosManoObraMes,
    gastosHormigaMes,
    gastosTransporteMes,
    costosTotalesMes,
    ivaRealMes,
    gananciaMes: ventasTotalesPeriodo - costosTotalesMes,
    margenGananciaMes: ventasTotalesPeriodo > 0 ? ((ventasTotalesPeriodo - costosTotalesMes) / ventasTotalesPeriodo) * 100 : 0,
    variacionCotizaciones,
    variacionVentas,
    ventasTotalesHistorico,
    costosTotalesHistorico,
    gananciaHistorica,
    cotizacionesRecientes
  };
}

