/**
 * Servicio para gestión de liquidaciones de trabajadores y vendedores
 */
import { supabase } from '../utils/supabase';
import type { 
  Liquidacion, 
  BalancePersonal, 
  DetallePago, 
  ResumenLiquidaciones 
} from '../types/database';

/**
 * Obtiene el balance de todos los trabajadores y vendedores
 */
export async function obtenerBalancePersonal(): Promise<BalancePersonal[]> {
  const { data, error } = await supabase
    .from('balance_personal')
    .select('*')
    .order('balance_pendiente', { ascending: false });

  if (error) throw error;
  return data as BalancePersonal[];
}

/**
 * Obtiene el balance de una persona específica
 */
export async function obtenerBalancePersonaPorId(personaId: string): Promise<BalancePersonal | null> {
  const { data, error } = await supabase
    .from('balance_personal')
    .select('*')
    .eq('persona_id', personaId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw error;
  }
  return data as BalancePersonal;
}

/**
 * Obtiene el detalle de pagos de una persona
 */
export async function obtenerDetallePagos(personaId: string): Promise<DetallePago[]> {
  const { data, error } = await supabase
    .rpc('obtener_detalle_pagos', { persona_uuid: personaId });

  if (error) throw error;
  return data as DetallePago[];
}

/**
 * Obtiene el resumen general de liquidaciones
 */
export async function obtenerResumenLiquidaciones(): Promise<ResumenLiquidaciones | null> {
  const { data, error } = await supabase
    .rpc('obtener_resumen_liquidaciones');

  if (error) throw error;
  return data?.[0] as ResumenLiquidaciones || null;
}

/**
 * Obtiene todas las liquidaciones
 */
export async function obtenerLiquidaciones(): Promise<Liquidacion[]> {
  const { data, error } = await supabase
    .from('liquidaciones')
    .select(`
      *,
      persona:perfiles!liquidaciones_persona_id_fkey (
        id, nombre, apellido, email, role, especialidad
      ),
      liquidador:perfiles!liquidaciones_liquidado_por_fkey (
        id, nombre, apellido, email
      )
    `)
    .order('fecha_liquidacion', { ascending: false });

  if (error) throw error;
  return data as Liquidacion[];
}

/**
 * Obtiene las liquidaciones de una persona específica
 */
export async function obtenerLiquidacionesPorPersona(personaId: string): Promise<Liquidacion[]> {
  const { data, error } = await supabase
    .from('liquidaciones')
    .select(`
      *,
      persona:perfiles!liquidaciones_persona_id_fkey (
        id, nombre, apellido, email, role, especialidad
      ),
      liquidador:perfiles!liquidaciones_liquidado_por_fkey (
        id, nombre, apellido, email
      )
    `)
    .eq('persona_id', personaId)
    .order('fecha_liquidacion', { ascending: false });

  if (error) throw error;
  return data as Liquidacion[];
}

/**
 * Crea una nueva liquidación (pago a trabajador/vendedor)
 */
export async function crearLiquidacion(liquidacion: {
  persona_id: string;
  tipo_persona: 'vendedor' | 'trabajador_taller';
  monto: number;
  metodo_pago?: 'efectivo' | 'transferencia' | 'cheque' | 'otro';
  numero_referencia?: string;
  notas?: string;
}): Promise<Liquidacion> {
  // Obtener el usuario actual para registrar quién hizo la liquidación
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('liquidaciones')
    .insert({
      ...liquidacion,
      liquidado_por: user?.id,
      fecha_liquidacion: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      persona:perfiles!liquidaciones_persona_id_fkey (
        id, nombre, apellido, email, role, especialidad
      ),
      liquidador:perfiles!liquidaciones_liquidado_por_fkey (
        id, nombre, apellido, email
      )
    `)
    .single();

  if (error) throw error;
  return data as Liquidacion;
}

/**
 * Elimina una liquidación
 */
export async function eliminarLiquidacion(id: string): Promise<void> {
  const { error } = await supabase
    .from('liquidaciones')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Obtiene el balance calculado manualmente (sin usar la vista)
 * Útil si la vista no está creada aún
 */
export async function calcularBalancePersona(personaId: string): Promise<{
  totalGanado: number;
  totalLiquidado: number;
  balancePendiente: number;
}> {
  // Obtener perfil
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('role')
    .eq('id', personaId)
    .single();

  if (!perfil) {
    return { totalGanado: 0, totalLiquidado: 0, balancePendiente: 0 };
  }

  let totalGanado = 0;

  // Si es vendedor, sumar pagos de cotizaciones
  if (perfil.role === 'vendedor') {
    const { data: cotizaciones } = await supabase
      .from('cotizaciones')
      .select('pago_vendedor')
      .eq('vendedor_id', personaId)
      .eq('estado', 'aceptada');

    totalGanado = cotizaciones?.reduce((sum, c) => sum + (c.pago_vendedor || 0), 0) || 0;
  }

  // Si es trabajador, sumar pagos de cotizacion_trabajadores
  if (perfil.role === 'trabajador_taller') {
    const { data: trabajos } = await supabase
      .from('cotizacion_trabajadores')
      .select('pago_trabajador')
      .eq('trabajador_id', personaId);

    totalGanado = trabajos?.reduce((sum, t) => sum + (t.pago_trabajador || 0), 0) || 0;
  }

  // Obtener total liquidado
  const { data: liquidaciones } = await supabase
    .from('liquidaciones')
    .select('monto')
    .eq('persona_id', personaId);

  const totalLiquidado = liquidaciones?.reduce((sum, l) => sum + (l.monto || 0), 0) || 0;

  return {
    totalGanado,
    totalLiquidado,
    balancePendiente: totalGanado - totalLiquidado
  };
}

/**
 * Obtiene el balance de todos (sin usar la vista)
 */
export async function obtenerBalanceTodos(): Promise<Array<{
  persona: {
    id: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    role: string;
    especialidad?: string;
  };
  totalGanado: number;
  totalLiquidado: number;
  balancePendiente: number;
}>> {
  // Obtener vendedores y trabajadores
  const { data: personas, error } = await supabase
    .from('perfiles')
    .select('id, nombre, apellido, email, role, especialidad')
    .in('role', ['vendedor', 'trabajador_taller']);

  if (error) throw error;

  const balances = await Promise.all(
    (personas || []).map(async (persona) => {
      const balance = await calcularBalancePersona(persona.id);
      return {
        persona,
        ...balance
      };
    })
  );

  // Ordenar por balance pendiente descendente
  return balances.sort((a, b) => b.balancePendiente - a.balancePendiente);
}

