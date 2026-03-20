/**
 * Saldo real disponible (libre de IVA y de todo) y disponible para gastos.
 * Los pagos (gastos fijos, liquidaciones, etc.) se descuentan siempre del disponible;
 * la caja de ahorros no se toca.
 */
import { obtenerCotizaciones } from './cotizaciones.service';
import { obtenerLiquidaciones } from './liquidaciones.service';
import { obtenerGastosFijos } from './fixed-expenses.service';
import { obtenerTotalAhorros } from './caja-ahorros.service';
import { supabase } from '../utils/supabase';

export interface SaldoDisponibleResult {
  /** Total cobrado real por clientes (histórico) */
  totalCobradoHistorico: number;
  /** Total pagado/egresos reales (histórico) */
  totalPagadoHistorico: number;
  /** IVA reservado (proporcional a lo cobrado, histórico) */
  ivaReservadoHistorico: number;
  /** Pagos a personal (liquidaciones) */
  totalLiquidacionesHistorico: number;
  /** Gastos fijos */
  totalGastosFijosHistorico: number;
  /** Costos reales operativos */
  totalPagosMaterialesHistorico: number;
  totalPagosManoObraHistorico: number;
  totalPagosHormigaHistorico: number;
  totalPagosTransporteHistorico: number;
  /** Saldo real (cashflow) = cobrado - pagado - IVA reservado */
  saldoRealDisponible: number;
  /** Total en caja de ahorros (no se usa para pagar) */
  totalAhorros: number;
  /** Lo que se puede usar para pagar = saldoReal - ahorros */
  disponibleParaGastar: number;
}

/**
 * Calcula el saldo real disponible y el disponible para gastar.
 * Regla: al pagar (gastos fijos, mano de obra, etc.) el sistema descuenta del disponible;
 * lo ahorrado no se toca.
 */
export async function obtenerSaldoDisponible(): Promise<SaldoDisponibleResult> {
  const [cotizaciones, liquidaciones, gastosFijos, totalAhorros] = await Promise.all([
    obtenerCotizaciones(),
    obtenerLiquidaciones(),
    obtenerGastosFijos(),
    obtenerTotalAhorros()
  ]);

  const aceptadas = cotizaciones.filter(c => c.estado === 'aceptada');
  // 1) Cobros reales históricos
  // Preferir tabla cotizacion_pagos; si no existe aún, usar monto_pagado.
  let totalCobradoHistorico = 0;
  const pagadoPorCotizacion = new Map<string, number>();
  try {
    const { data: pagos, error } = await supabase
      .from('cotizacion_pagos')
      .select('cotizacion_id, monto, fecha_pago');
    if (error) throw error;
    (pagos || []).forEach((p: any) => {
      if (!p.fecha_pago) return;
      const fecha = new Date(p.fecha_pago);
      if (isNaN(fecha.getTime())) return;
      const id = p.cotizacion_id;
      const m = Number(p.monto) || 0;
      pagadoPorCotizacion.set(id, (pagadoPorCotizacion.get(id) || 0) + m);
      totalCobradoHistorico += m;
    });
  } catch {
    // fallback
    totalCobradoHistorico = aceptadas.reduce((sum, c) => sum + (Number(c.monto_pagado) || 0), 0);
    aceptadas.forEach((c) => pagadoPorCotizacion.set(c.id, Number(c.monto_pagado) || 0));
  }

  // 2) IVA reservado histórico (proporcional a lo cobrado, respeta aplica_iva=false)
  const ivaReservadoHistorico = aceptadas.reduce((sum, c: any) => {
    const aplicaIVA = c.aplica_iva !== undefined ? Boolean(c.aplica_iva) : true;
    if (!aplicaIVA) return sum;

    const totalCotizacion = Number(c.total) || 0;
    if (totalCotizacion <= 0) return sum;

    const ivaCotizacion = Number(c.iva) || 0;
    if (ivaCotizacion <= 0) return sum;

    const cobrado = Math.min(Number(pagadoPorCotizacion.get(c.id) || 0), totalCotizacion);
    const proporcion = cobrado / totalCotizacion;
    return sum + (ivaCotizacion * proporcion);
  }, 0);

  // 3) Pagos reales históricos (egresos)
  const totalLiquidacionesHistorico = liquidaciones.reduce((sum, l) => sum + (Number(l.monto) || 0), 0);
  const totalGastosFijosHistorico = gastosFijos.reduce((sum, g: any) => sum + (Number(g.amount) || 0), 0);

  const [
    materialesRes,
    manoObraRes,
    hormigaRes,
    transporteRes
  ] = await Promise.all([
    supabase.from('gastos_reales_materiales').select('precio_unitario_real, cantidad_real, fecha_compra'),
    supabase.from('mano_obra_real').select('total_pagado, fecha'),
    supabase.from('gastos_hormiga').select('monto, fecha'),
    supabase.from('transporte_real').select('costo, fecha')
  ]);

  const materialesValidos = (materialesRes.data || []).filter(g => {
    if (!g.fecha_compra) return false;
    const fecha = new Date(g.fecha_compra);
    return !isNaN(fecha.getTime());
  });
  const manoObraValidos = (manoObraRes.data || []).filter(m => {
    if (!m.fecha) return false;
    const fecha = new Date(m.fecha);
    return !isNaN(fecha.getTime());
  });
  const hormigaValidos = (hormigaRes.data || []).filter(g => {
    if (!g.fecha) return false;
    const fecha = new Date(g.fecha);
    return !isNaN(fecha.getTime());
  });
  const transporteValidos = (transporteRes.data || []).filter(t => {
    if (!t.fecha) return false;
    const fecha = new Date(t.fecha);
    return !isNaN(fecha.getTime());
  });

  const totalPagosMaterialesHistorico = materialesValidos.reduce((sum: number, g: any) => {
    return sum + ((Number(g.precio_unitario_real) || 0) * (Number(g.cantidad_real) || 0));
  }, 0);
  const totalPagosManoObraHistorico = manoObraValidos.reduce((sum: number, m: any) => sum + (Number(m.total_pagado) || 0), 0);
  const totalPagosHormigaHistorico = hormigaValidos.reduce((sum: number, g: any) => sum + (Number(g.monto) || 0), 0);
  const totalPagosTransporteHistorico = transporteValidos.reduce((sum: number, t: any) => sum + (Number(t.costo) || 0), 0);

  const totalPagadoHistorico =
    totalLiquidacionesHistorico +
    totalGastosFijosHistorico +
    totalPagosMaterialesHistorico +
    totalPagosManoObraHistorico +
    totalPagosHormigaHistorico +
    totalPagosTransporteHistorico;

    const saldoRealDisponible =
    totalCobradoHistorico -
    totalPagadoHistorico -
    ivaReservadoHistorico;

  const disponibleParaGastar = saldoRealDisponible - totalAhorros;

  return {
    totalCobradoHistorico,
    totalPagadoHistorico,
    ivaReservadoHistorico,
    totalLiquidacionesHistorico,
    totalGastosFijosHistorico,
    totalPagosMaterialesHistorico,
    totalPagosManoObraHistorico,
    totalPagosHormigaHistorico,
    totalPagosTransporteHistorico,
    saldoRealDisponible,
    totalAhorros,
    disponibleParaGastar
  };
}
