/**
 * Historial de pagos por cotización (parciales y total con fecha)
 */
import { supabase } from '../utils/supabase';
import { actualizarEstadoPagoCotizacion } from './cotizaciones.service';
import type { CotizacionPago } from '../types/database';

function normalizarPagoId(pagoId: string | number): string {
  const id = String(pagoId || '').trim();
  if (!id) throw new Error('ID de pago inválido.');
  return id;
}

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
  pagoId: string | number,
  nuevaFecha: string
): Promise<CotizacionPago> {
  const id = normalizarPagoId(pagoId);

  const { data, error } = await supabase
    .from('cotizacion_pagos')
    .update({ fecha_pago: nuevaFecha }, { returning: 'representation' })
    .eq('id', id);

  if (error) throw error;

  if (!data || !Array.isArray(data) || data.length === 0) {
    // Fallback: verificar si el pago existe para dar mejor mensaje y evitar falsos negativos.
    const lookup = await supabase
      .from('cotizacion_pagos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (lookup.error) throw lookup.error;
    if (lookup.data) {
      return lookup.data as CotizacionPago;
    }

    throw new Error('No se encontró el pago para actualizar la fecha.');
  }

  return data[0] as CotizacionPago;
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

/**
 * Actualiza el monto de un pago existente.
 * Recalcula automáticamente monto_pagado y estado_pago de la cotización.
 */
export async function actualizarMontoPagoCotizacion(
  pagoId: string | number,
  nuevoMonto: number,
  cotizacionId: string,
  totalCotizacion?: number
): Promise<{ pago: CotizacionPago; montoPagadoTotal: number; estadoPago: 'no_pagado' | 'pago_parcial' | 'pagado' }> {
  if (nuevoMonto <= 0) throw new Error('El monto debe ser mayor a 0.');

  const id = normalizarPagoId(pagoId);

  const { data, error } = await supabase
    .from('cotizacion_pagos')
    .update({ monto: nuevoMonto }, { returning: 'representation' })
    .eq('id', id);

  if (error) throw error;

  let pago: CotizacionPago | null = null;
  if (data && Array.isArray(data) && data.length > 0) {
    pago = data[0] as CotizacionPago;
  }

  // Supabase a veces devuelve [] o null cuando no hay returning explícito,
  // pero la actualización puede haber sido exitosa. Verificar si el registro existe.
  if (!pago) {
    const lookup = await supabase
      .from('cotizacion_pagos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (lookup.error) throw lookup.error;
    if (!lookup.data) {
      throw new Error('No se encontró el pago para actualizar el monto.');
    }
    pago = lookup.data as CotizacionPago;
  }

  // Recalcular totales
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
 * Elimina un pago completamente.
 * Recalcula automáticamente monto_pagado y estado_pago de la cotización.
 */
export async function eliminarPagoCotizacion(
  pagoId: string | number,
  cotizacionId: string,
  totalCotizacion?: number
): Promise<{ montoPagadoTotal: number; estadoPago: 'no_pagado' | 'pago_parcial' | 'pagado' }> {
  const id = normalizarPagoId(pagoId);

  const { data, error, count } = await supabase
    .from('cotizacion_pagos')
    .delete({ count: 'exact', returning: 'minimal' })
    .eq('id', id);

  if (error) throw error;

  // Supabase con returning:'minimal' puede devolver data=null, aún con count > 0.
  // No disparar false-positive 'no encontrado' en ese caso.
  const registrosEliminados = typeof count === 'number'
    ? count
    : Array.isArray(data)
      ? data.length
      : 0;

  if (registrosEliminados === 0) {
    throw new Error('No se encontró el pago para eliminar.');
  }

  // Recalcular totales después de eliminar
  const todos = await obtenerPagosPorCotizacion(cotizacionId);
  const montoPagadoTotal = todos.reduce((sum, p) => sum + Number(p.monto), 0);
  const total = totalCotizacion ?? 0;
  let estadoPago: 'no_pagado' | 'pago_parcial' | 'pagado' = 'no_pagado';
  if (total > 0) {
    if (montoPagadoTotal >= total) estadoPago = 'pagado';
    else if (montoPagadoTotal > 0) estadoPago = 'pago_parcial';
  }

  await actualizarEstadoPagoCotizacion(cotizacionId, estadoPago, montoPagadoTotal);

  return { montoPagadoTotal, estadoPago };
}
