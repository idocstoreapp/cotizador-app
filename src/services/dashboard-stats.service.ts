/**
 * Servicio para obtener estadísticas del dashboard
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
  
  // Financiero del mes
  ventasTotalesMes: number; // Total de cotizaciones aceptadas del mes
  gastosMaterialesMes: number; // Gastos reales en materiales del mes
  gananciaMes: number; // Ventas - Gastos
  
  // Comparación mes anterior
  variacionCotizaciones: number; // % de variación vs mes anterior
  variacionVentas: number; // % de variación vs mes anterior
}

/**
 * Obtiene estadísticas del dashboard para el mes actual
 */
export async function obtenerEstadisticasDashboard(): Promise<EstadisticasDashboard> {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
  
  // Mes anterior para comparación
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

  // Obtener todas las cotizaciones
  const todasLasCotizaciones = await obtenerCotizaciones();
  
  // Filtrar por mes actual
  const cotizacionesMes = todasLasCotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    return fecha >= inicioMes && fecha <= finMes;
  });

  // Filtrar por mes anterior
  const cotizacionesMesAnterior = todasLasCotizaciones.filter(c => {
    const fecha = new Date(c.created_at);
    return fecha >= inicioMesAnterior && fecha <= finMesAnterior;
  });

  // Estadísticas del mes actual
  const totalCotizaciones = cotizacionesMes.length;
  const cotizacionesAceptadas = cotizacionesMes.filter(c => c.estado === 'aceptada');
  const cotizacionesPendientes = cotizacionesMes.filter(c => c.estado === 'pendiente' || c.estado === 'borrador');
  const cotizacionesRechazadas = cotizacionesMes.filter(c => c.estado === 'rechazada');

  // Función auxiliar para calcular total desde items (igual que en HistorialCotizaciones)
  const calcularTotalDesdeItems = (cotizacion: Cotizacion): number => {
    // Si hay items guardados, calcular desde items (más preciso)
    if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
      const subtotal = cotizacion.items.reduce((sum: number, item: any) => {
        return sum + (item.precio_total || 0);
      }, 0);
      
      // Aplicar descuento si existe
      const descuento = cotizacion.descuento || 0;
      const descuentoMonto = subtotal * (descuento / 100);
      const subtotalConDescuento = subtotal - descuentoMonto;
      
      // Calcular IVA (usar el IVA de la cotización o 19% por defecto)
      const ivaPorcentaje = (cotizacion as any).iva_porcentaje || 19;
      const iva = subtotalConDescuento * (ivaPorcentaje / 100);
      
      // Total final
      return subtotalConDescuento + iva;
    }
    
    // Fallback: usar total guardado
    return cotizacion.total || 0;
  };

  // Calcular ventas totales del mes (solo aceptadas)
  const ventasTotalesMes = cotizacionesAceptadas.reduce((sum, c) => {
    // Usar total calculado desde items si está disponible
    const total = calcularTotalDesdeItems(c);
    return sum + total;
  }, 0);

  // Obtener gastos reales en materiales del mes
  const { data: gastosMateriales, error: errorGastos } = await supabase
    .from('gastos_reales_materiales')
    .select('precio_unitario_real, cantidad_real')
    .gte('fecha_compra', inicioMes.toISOString())
    .lte('fecha_compra', finMes.toISOString());

  if (errorGastos) {
    console.error('Error al obtener gastos de materiales:', errorGastos);
  }

  const gastosMaterialesMes = (gastosMateriales || []).reduce((sum, g) => {
    return sum + ((g.precio_unitario_real || 0) * (g.cantidad_real || 0));
  }, 0);

  // Calcular ganancia del mes (ventas - gastos en materiales)
  const gananciaMes = ventasTotalesMes - gastosMaterialesMes;

  // Calcular variaciones vs mes anterior
  const totalCotizacionesAnterior = cotizacionesMesAnterior.length;
  const ventasMesAnterior = cotizacionesMesAnterior
    .filter(c => c.estado === 'aceptada')
    .reduce((sum, c) => {
      const total = calcularTotalDesdeItems(c);
      return sum + total;
    }, 0);

  const variacionCotizaciones = totalCotizacionesAnterior > 0
    ? ((totalCotizaciones - totalCotizacionesAnterior) / totalCotizacionesAnterior) * 100
    : 0;

  const variacionVentas = ventasMesAnterior > 0
    ? ((ventasTotalesMes - ventasMesAnterior) / ventasMesAnterior) * 100
    : 0;

  return {
    totalCotizaciones,
    cotizacionesAceptadas: cotizacionesAceptadas.length,
    cotizacionesPendientes: cotizacionesPendientes.length,
    cotizacionesRechazadas: cotizacionesRechazadas.length,
    ventasTotalesMes,
    gastosMaterialesMes,
    gananciaMes,
    variacionCotizaciones,
    variacionVentas
  };
}

