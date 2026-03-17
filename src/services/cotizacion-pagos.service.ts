/**
 * Historial de pagos por cotización (parciales y total con fecha)
 */
import { supabase } from '../utils/supabase';
import { actualizarEstadoPagoCotizacion } from './cotizaciones.service';
import type { CotizacionPago } from '../types/database';

export async function obtenerPagosPorCotizacion(cotizacionId: string): Promise<CotizacionPago[]> {
  const { data, error } = await supabase
    .from('cotizacion_pagos')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('fecha_pago', { ascending: false });

  if (error) throw error;
  return (data || []) as CotizacionPago[];
}

/**
 * Agrega un pago a la cotización, actualiza monto_pagado y estado_pago.
 * totalCotizacion debe ser el total de la cotización para derivar estado.
 */
export async function agregarPagoCotizacion(
  cotizacionId: string,
  monto: number,
  fechaPago: string,
  nota?: string,
  totalCotizacion?: number
): Promise<{ pago: CotizacionPago; montoPagadoTotal: number; estadoPago: 'no_pagado' | 'pago_parcial' | 'pagado' }> {
  if (monto <= 0) throw new Error('El monto debe ser mayor a 0.');

  const { data: insertado, error: errInsert } = await supabase
    .from('cotizacion_pagos')
    .insert({
      cotizacion_id: cotizacionId,
      monto,
      fecha_pago: fechaPago,
      nota: nota || null
    })
    .select()
    .single();

  if (errInsert) throw errInsert;
  const pago = insertado as CotizacionPago;

  const todos = await obtenerPagosPorCotizacion(cotizacionId);
  const montoPagadoTotal = todos.reduce((sum, p) => sum + Number(p.monto), 0);
  const total = totalCotizacion ?? 0;
  let estadoPago: 'no_pagado' | 'pago_parcial' | 'pagado' = 'no_pagado';
  if (total > 0) {
    if (montoPagadoTotal >= total) estadoPago = 'pagado';
    else if (montoPagadoTotal > 0) estadoPago = 'pago_parcial';
  }

  await actualizarEstadoPagoCotizacion(cotizacionId, estadoPago, montoPagadoTotal);

  return { pago, montoPagadoTotal, estadoPago };
}

/**
 * Permite actualizar la fecha de un pago existente.
 * Pensado para administradores, por ejemplo para pruebas o correcciones.
 */
export async function actualizarFechaPagoCotizacion(
  pagoId: string,
  nuevaFecha: string
): Promise<CotizacionPago> {
  const { data, error } = await supabase
    .from('cotizacion_pagos')
    .update({ fecha_pago: nuevaFecha })
    .eq('id', pagoId)
    .select()
    .single();

  if (error) throw error;
  return data as CotizacionPago;
}

/**
 * Si la cotización tiene monto_pagado pero no hay registros en cotizacion_pagos,
 * inserta un registro único para no perder el dato (migración suave).
 */
export async function asegurarHistorialPagos(cotizacionId: string, montoPagadoActual: number, fechaFallback: string): Promise<CotizacionPago[]> {
  const existentes = await obtenerPagosPorCotizacion(cotizacionId);
  if (existentes.length > 0 || montoPagadoActual <= 0) return existentes;

  await supabase.from('cotizacion_pagos').insert({
    cotizacion_id: cotizacionId,
    monto: montoPagadoActual,
    fecha_pago: fechaFallback
  });
  return await obtenerPagosPorCotizacion(cotizacionId);
}
