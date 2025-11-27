/**
 * Servicio para gestionar trabajadores asignados a cotizaciones
 */
import { supabase } from '../utils/supabase';
import type { CotizacionTrabajador } from '../types/database';

/**
 * Obtiene todos los trabajadores asignados a una cotización
 */
export async function obtenerTrabajadoresPorCotizacion(
  cotizacionId: string
): Promise<CotizacionTrabajador[]> {
  const { data, error } = await supabase
    .from('cotizacion_trabajadores')
    .select(`
      *,
      trabajador:perfiles!cotizacion_trabajadores_trabajador_id_fkey (
        id,
        email,
        nombre,
        role,
        especialidad
      )
    `)
    .eq('cotizacion_id', cotizacionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as CotizacionTrabajador[];
}

/**
 * Asigna un trabajador a una cotización con su pago
 */
export async function asignarTrabajadorACotizacion(
  cotizacionId: string,
  trabajadorId: string,
  pagoTrabajador: number,
  notas?: string
): Promise<CotizacionTrabajador> {
  const { data, error } = await supabase
    .from('cotizacion_trabajadores')
    .insert({
      cotizacion_id: cotizacionId,
      trabajador_id: trabajadorId,
      pago_trabajador: pagoTrabajador,
      notas: notas || null,
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      trabajador:perfiles!cotizacion_trabajadores_trabajador_id_fkey (
        id,
        email,
        nombre,
        role,
        especialidad
      )
    `)
    .single();

  if (error) throw error;
  return data as CotizacionTrabajador;
}

/**
 * Actualiza el pago de un trabajador asignado
 */
export async function actualizarPagoTrabajador(
  id: string,
  pagoTrabajador: number,
  notas?: string
): Promise<CotizacionTrabajador> {
  const { data, error } = await supabase
    .from('cotizacion_trabajadores')
    .update({
      pago_trabajador: pagoTrabajador,
      notas: notas || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      trabajador:perfiles!cotizacion_trabajadores_trabajador_id_fkey (
        id,
        email,
        nombre,
        role,
        especialidad
      )
    `)
    .single();

  if (error) throw error;
  return data as CotizacionTrabajador;
}

/**
 * Elimina un trabajador de una cotización
 */
export async function eliminarTrabajadorDeCotizacion(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('cotizacion_trabajadores')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Asigna múltiples trabajadores a una cotización
 */
export async function asignarTrabajadoresACotizacion(
  cotizacionId: string,
  trabajadores: Array<{
    trabajadorId: string;
    pagoTrabajador: number;
    notas?: string;
  }>
): Promise<CotizacionTrabajador[]> {
  const inserts = trabajadores.map(t => ({
    cotizacion_id: cotizacionId,
    trabajador_id: t.trabajadorId,
    pago_trabajador: t.pagoTrabajador,
    notas: t.notas || null,
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('cotizacion_trabajadores')
    .insert(inserts)
    .select(`
      *,
      trabajador:perfiles!cotizacion_trabajadores_trabajador_id_fkey (
        id,
        email,
        nombre,
        role,
        especialidad
      )
    `);

  if (error) throw error;
  return data as CotizacionTrabajador[];
}

