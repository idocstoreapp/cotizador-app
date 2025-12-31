/**
 * Servicio para gestionar mano de obra real
 */
import { supabase } from '../utils/supabase';
import type { ManoObraReal } from '../types/database';

/**
 * Crea un registro de mano de obra real
 */
export async function crearManoObraReal(manoObra: {
  cotizacion_id: string;
  trabajador_id?: string;
  horas_trabajadas: number;
  pago_por_hora: number;
  monto_manual?: number;
  tipo_calculo?: 'horas' | 'monto';
  fecha: string;
  metodo_pago?: 'efectivo' | 'transferencia';
  comprobante_url?: string;
  notas?: string;
  alcance_gasto?: 'unidad' | 'parcial' | 'total';
  cantidad_items_aplicados?: number;
}): Promise<ManoObraReal> {
  const total_pagado = manoObra.tipo_calculo === 'monto' && manoObra.monto_manual
    ? manoObra.monto_manual
    : manoObra.horas_trabajadas * manoObra.pago_por_hora;

  const { data, error } = await supabase
    .from('mano_obra_real')
    .insert({
      cotizacion_id: manoObra.cotizacion_id,
      trabajador_id: manoObra.trabajador_id || null,
      horas_trabajadas: manoObra.horas_trabajadas || 0,
      pago_por_hora: manoObra.pago_por_hora || 0,
      monto_manual: manoObra.monto_manual || null,
      tipo_calculo: manoObra.tipo_calculo || 'horas',
      total_pagado: total_pagado,
      fecha: manoObra.fecha,
      metodo_pago: manoObra.metodo_pago || null,
      comprobante_url: manoObra.comprobante_url || null,
      notas: manoObra.notas || null,
      alcance_gasto: manoObra.alcance_gasto || 'unidad',
      cantidad_items_aplicados: manoObra.cantidad_items_aplicados || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data as ManoObraReal;
}

/**
 * Obtiene todos los registros de mano de obra real de una cotización
 */
export async function obtenerManoObraRealPorCotizacion(cotizacionId: string): Promise<ManoObraReal[]> {
  const { data, error } = await supabase
    .from('mano_obra_real')
    .select(`
      *,
      trabajador:perfiles(id, nombre, email)
    `)
    .eq('cotizacion_id', cotizacionId)
    .order('fecha', { ascending: false });

  if (error) throw error;
  
  // Mapear trabajador si existe (apellido puede no existir aún)
  return (data || []).map((item: any) => ({
    ...item,
    trabajador: item.trabajador ? {
      id: item.trabajador.id,
      nombre: item.trabajador.nombre || '',
      apellido: (item.trabajador as any).apellido || null,
      email: item.trabajador.email || null
    } : null
  })) as ManoObraReal[];
}

/**
 * Actualiza un registro de mano de obra real
 */
export async function actualizarManoObraReal(
  id: string,
  updates: Partial<{
    trabajador_id?: string;
    horas_trabajadas: number;
    pago_por_hora: number;
    monto_manual?: number;
    tipo_calculo?: 'horas' | 'monto';
    fecha: string;
    metodo_pago?: 'efectivo' | 'transferencia';
    comprobante_url?: string;
    notas?: string;
    alcance_gasto?: 'unidad' | 'parcial' | 'total';
    cantidad_items_aplicados?: number;
  }>
): Promise<ManoObraReal> {
  // Calcular total según el tipo de cálculo
  const updateData: any = { ...updates };
  const tipoCalculo = updates.tipo_calculo;
  
  if (tipoCalculo === 'monto' && updates.monto_manual !== undefined) {
    updateData.total_pagado = updates.monto_manual;
  } else if (tipoCalculo === 'horas' || !tipoCalculo) {
    // Si se actualizan horas o pago, recalcular total
    if (updates.horas_trabajadas !== undefined || updates.pago_por_hora !== undefined) {
      // Necesitamos obtener el registro actual para calcular el total
      const { data: actual } = await supabase
        .from('mano_obra_real')
        .select('horas_trabajadas, pago_por_hora')
        .eq('id', id)
        .single();
      
      if (actual) {
        const horas = updates.horas_trabajadas ?? actual.horas_trabajadas;
        const pago = updates.pago_por_hora ?? actual.pago_por_hora;
        updateData.total_pagado = horas * pago;
      }
    }
  }

  // Asegurar que trabajador_id sea null si no se proporciona
  if (updates.trabajador_id === undefined || updates.trabajador_id === '') {
    updateData.trabajador_id = null;
  }

  const { data, error } = await supabase
    .from('mano_obra_real')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ManoObraReal;
}

/**
 * Elimina un registro de mano de obra real
 */
export async function eliminarManoObraReal(id: string): Promise<void> {
  const { error } = await supabase
    .from('mano_obra_real')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

