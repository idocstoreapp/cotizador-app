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

  // Buscar K001 específicamente para debug
  const cotizacionK001 = todasLasCotizaciones.find(c => c.numero === 'K001' || c.numero === 'K-001');
  
  // Debug: Log para verificar filtros
  console.log('📊 [Dashboard Stats] Filtros:', {
    totalCotizaciones: todasLasCotizaciones.length,
    cotizacionesCreadasMes: cotizacionesMes.length,
    cotizacionesAceptadasMes: cotizacionesAceptadasMes.length,
    cotizacionesMesAnterior: cotizacionesMesAnterior.length,
    rangoMes: {
      inicio: inicioMes.toISOString().split('T')[0],
      fin: finMes.toISOString().split('T')[0]
    },
    k001: cotizacionK001 ? {
      id: cotizacionK001.id,
      numero: cotizacionK001.numero,
      estado: cotizacionK001.estado,
      created_at: cotizacionK001.created_at,
      updated_at: cotizacionK001.updated_at,
      estaEnMes: cotizacionesAceptadasMes.some(c => c.id === cotizacionK001.id),
      fechaAceptacion: cotizacionK001.updated_at && cotizacionK001.updated_at !== cotizacionK001.created_at 
        ? new Date(cotizacionK001.updated_at).toISOString().split('T')[0]
        : new Date(cotizacionK001.created_at).toISOString().split('T')[0]
    } : 'No encontrada'
  });

  // Estadísticas de cotizaciones del mes
  const totalCotizaciones = cotizacionesMes.length;
  const cotizacionesPendientesMes = cotizacionesMes.filter(c => c.estado === 'pendiente');
  const cotizacionesRechazadasMes = cotizacionesMes.filter(c => c.estado === 'rechazada');

  // Ventas del mes (cotizaciones aceptadas en el mes actual)
  const ventasTotalesMes = cotizacionesAceptadasMes.reduce((sum, c) => sum + calcularTotalDesdeItems(c), 0);

  // ====== COSTOS REALES DEL MES (TODOS) ======
  // IMPORTANTE: Contar todos los costos reales de las cotizaciones aceptadas en el mes
  // Esto refleja mejor la realidad: si una cotización fue aceptada en el mes,
  // todos sus costos reales (sin importar cuándo ocurrieron) se asocian a esa venta del mes
  
  // Obtener IDs de cotizaciones aceptadas en el mes
  const idsCotizacionesAceptadas = cotizacionesAceptadasMes.map(c => c.id);
  
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
      cotizacionesAceptadasMes.map(async (cotizacion) => {
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
    cotizacionesAceptadasMes.forEach(cotizacion => {
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

