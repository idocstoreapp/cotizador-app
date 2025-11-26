/**
 * Servicio para gestión de trabajos
 */
import { supabase } from '../utils/supabase';
import type { Trabajo } from '../types/database';

/**
 * Crea un nuevo trabajo desde una cotización aceptada
 */
export async function crearTrabajo(trabajo: {
  cliente_id: string;
  cotizacion_id: string;
  empleados_asignados?: string[];
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  notas?: string;
}): Promise<Trabajo> {
  const { data, error } = await supabase
    .from('trabajos')
    .insert({
      cliente_id: trabajo.cliente_id,
      cotizacion_id: trabajo.cotizacion_id,
      estado: 'pendiente',
      empleados_asignados: trabajo.empleados_asignados || [],
      fecha_inicio: trabajo.fecha_inicio || null,
      fecha_fin_estimada: trabajo.fecha_fin_estimada || null,
      notas: trabajo.notas || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) throw error;
  
  // Cargar cliente y cotización por separado
  const trabajoCompleto = data as any;
  
  if (trabajo.cliente_id) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', trabajo.cliente_id)
      .single();
    if (cliente) trabajoCompleto.cliente = cliente;
  }
  
  if (trabajo.cotizacion_id) {
    const { data: cotizacion } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('id', trabajo.cotizacion_id)
      .single();
    if (cotizacion) trabajoCompleto.cotizacion = cotizacion;
  }
  
  return trabajoCompleto as Trabajo;
}

/**
 * Actualiza un trabajo (para asignar empleados, cambiar estado, etc.)
 */
export async function actualizarTrabajo(
  id: string,
  updates: {
    empleados_asignados?: string[];
    estado?: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
    fecha_inicio?: string;
    fecha_fin_estimada?: string;
    notas?: string;
  }
): Promise<Trabajo> {
  const { data, error } = await supabase
    .from('trabajos')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  
  // Cargar cliente y cotización por separado
  const trabajoCompleto = data as any;
  
  if (data.cliente_id) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', data.cliente_id)
      .single();
    if (cliente) trabajoCompleto.cliente = cliente;
  }
  
  if (data.cotizacion_id) {
    const { data: cotizacion } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('id', data.cotizacion_id)
      .single();
    if (cotizacion) trabajoCompleto.cotizacion = cotizacion;
  }
  
  return trabajoCompleto as Trabajo;
}

/**
 * Obtiene todos los trabajos
 */
export async function obtenerTrabajos(): Promise<Trabajo[]> {
  const { data, error } = await supabase
    .from('trabajos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];
  
  // Cargar clientes y cotizaciones por separado
  const clienteIds = [...new Set(data.map(t => t.cliente_id).filter(Boolean))];
  const cotizacionIds = [...new Set(data.map(t => t.cotizacion_id).filter(Boolean))];
  
  let clientes: any[] = [];
  let cotizaciones: any[] = [];
  
  if (clienteIds.length > 0) {
    const { data: clientesData } = await supabase
      .from('clientes')
      .select('*')
      .in('id', clienteIds);
    if (clientesData) clientes = clientesData;
  }
  
  if (cotizacionIds.length > 0) {
    const { data: cotizacionesData } = await supabase
      .from('cotizaciones')
      .select('*')
      .in('id', cotizacionIds);
    if (cotizacionesData) cotizaciones = cotizacionesData;
  }
  
  // Combinar datos
  return data.map(trabajo => ({
    ...trabajo,
    cliente: clientes.find(c => c.id === trabajo.cliente_id) || null,
    cotizacion: cotizaciones.find(c => c.id === trabajo.cotizacion_id) || null
  })) as Trabajo[];
}

/**
 * Obtiene un trabajo por ID
 */
export async function obtenerTrabajoPorId(id: string): Promise<Trabajo | null> {
  const { data, error } = await supabase
    .from('trabajos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;
  
  // Cargar cliente y cotización por separado
  const trabajoCompleto = data as any;
  
  if (data.cliente_id) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', data.cliente_id)
      .single();
    if (cliente) trabajoCompleto.cliente = cliente;
  }
  
  if (data.cotizacion_id) {
    const { data: cotizacion } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('id', data.cotizacion_id)
      .single();
    if (cotizacion) trabajoCompleto.cotizacion = cotizacion;
  }
  
  return trabajoCompleto as Trabajo;
}











