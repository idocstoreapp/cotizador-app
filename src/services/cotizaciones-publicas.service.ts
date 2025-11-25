/**
 * Servicio para gestionar cotizaciones públicas
 * Permite guardar cotizaciones desde el catálogo público sin autenticación
 */
import { supabase } from '../utils/supabase';
import type { ItemCotizacion } from '../types/muebles';

export interface CotizacionPublicaInput {
  nombre_cliente: string;
  email_cliente?: string;
  telefono_cliente?: string;
  mensaje_cliente?: string;
  items: ItemCotizacion[];
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  metodo_contacto: 'whatsapp' | 'email' | 'formulario';
  ip_address?: string;
  user_agent?: string;
}

export interface CotizacionPublica {
  id: string;
  nombre_cliente: string;
  email_cliente?: string;
  telefono_cliente?: string;
  mensaje_cliente?: string;
  items: ItemCotizacion[];
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  metodo_contacto: 'whatsapp' | 'email' | 'formulario';
  estado: 'pendiente' | 'contactado' | 'cerrado';
  created_at: string;
  updated_at: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Guarda una cotización pública
 */
export async function guardarCotizacionPublica(
  input: CotizacionPublicaInput
): Promise<CotizacionPublica> {
  // Obtener IP y User Agent si están disponibles
  const ip_address = typeof window !== 'undefined' 
    ? await obtenerIP() 
    : input.ip_address;
  
  const user_agent = typeof window !== 'undefined'
    ? navigator.userAgent
    : input.user_agent;

  const { data, error } = await supabase
    .from('cotizaciones_publicas')
    .insert({
      nombre_cliente: input.nombre_cliente,
      email_cliente: input.email_cliente || null,
      telefono_cliente: input.telefono_cliente || null,
      mensaje_cliente: input.mensaje_cliente || null,
      items: input.items,
      subtotal: input.subtotal,
      descuento: input.descuento,
      iva: input.iva,
      total: input.total,
      metodo_contacto: input.metodo_contacto,
      ip_address: ip_address || null,
      user_agent: user_agent || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error al guardar cotización pública:', error);
    throw error;
  }

  return data as CotizacionPublica;
}

/**
 * Obtiene todas las cotizaciones públicas (solo admin)
 */
export async function obtenerCotizacionesPublicas(): Promise<CotizacionPublica[]> {
  const { data, error } = await supabase
    .from('cotizaciones_publicas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener cotizaciones públicas:', error);
    throw error;
  }

  return (data || []) as CotizacionPublica[];
}

/**
 * Actualiza el estado de una cotización pública (solo admin)
 */
export async function actualizarEstadoCotizacionPublica(
  id: string,
  estado: 'pendiente' | 'contactado' | 'cerrado'
): Promise<CotizacionPublica> {
  const { data, error } = await supabase
    .from('cotizaciones_publicas')
    .update({ estado })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar estado:', error);
    throw error;
  }

  return data as CotizacionPublica;
}

/**
 * Obtiene una cotización pública por ID (solo admin)
 */
export async function obtenerCotizacionPublicaPorId(id: string): Promise<CotizacionPublica | null> {
  const { data, error } = await supabase
    .from('cotizaciones_publicas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener cotización pública:', error);
    return null;
  }

  return data as CotizacionPublica;
}

/**
 * Obtiene la IP del cliente (usando servicio externo)
 */
async function obtenerIP(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('No se pudo obtener la IP:', error);
    return undefined;
  }
}

