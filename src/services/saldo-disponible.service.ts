/**
 * Saldo real disponible (libre de IVA y de todo) y disponible para gastos.
 * Los pagos (gastos fijos, liquidaciones, etc.) se descuentan siempre del disponible;
 * la caja de ahorros no se toca.
 */
import { obtenerCotizaciones } from './cotizaciones.service';
import { obtenerEstadisticasDashboard } from './dashboard-stats.service';
import { obtenerLiquidaciones } from './liquidaciones.service';
import { obtenerGastosFijos } from './fixed-expenses.service';
import { obtenerTotalAhorros } from './caja-ahorros.service';

export interface SaldoDisponibleResult {
  /** Total cobrado por clientes (cotizaciones aceptadas, monto_pagado) */
  totalCobradoHistorico: number;
  /** Costos reales + IVA (histórico) */
  costosTotalesHistorico: number;
  /** Total pagado a personal (liquidaciones) */
  totalLiquidacionesHistorico: number;
  /** Total gastos fijos registrados */
  totalGastosFijosHistorico: number;
  /** Saldo real = cobrado - costos - liquidaciones - gastos fijos (libre de IVA y de todo) */
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
  const [cotizaciones, stats, liquidaciones, gastosFijos, totalAhorros] = await Promise.all([
    obtenerCotizaciones(),
    obtenerEstadisticasDashboard(),
    obtenerLiquidaciones(),
    obtenerGastosFijos(),
    obtenerTotalAhorros()
  ]);

  const aceptadas = cotizaciones.filter(c => c.estado === 'aceptada');
  const totalCobradoHistorico = aceptadas.reduce((sum, c) => sum + (c.monto_pagado || 0), 0);
  const totalLiquidacionesHistorico = liquidaciones.reduce((sum, l) => sum + (l.monto || 0), 0);
  const totalGastosFijosHistorico = gastosFijos.reduce((sum, g) => sum + (g.amount || 0), 0);

  const costosTotalesHistorico = stats.costosTotalesHistorico || 0;
  const saldoRealDisponible = totalCobradoHistorico - costosTotalesHistorico - totalLiquidacionesHistorico - totalGastosFijosHistorico;
  const disponibleParaGastar = saldoRealDisponible - totalAhorros;

  return {
    totalCobradoHistorico,
    costosTotalesHistorico,
    totalLiquidacionesHistorico,
    totalGastosFijosHistorico,
    saldoRealDisponible,
    totalAhorros,
    disponibleParaGastar
  };
}
