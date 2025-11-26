/**
 * Servicio para gestión de clientes
 */
import { supabase } from '../utils/supabase';
import type { Cliente } from '../types/database';

/**
 * Crea un nuevo cliente
 */
export async function crearCliente(cliente: {
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  empresa?: 'casablanca' | 'kubica';
}): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: cliente.nombre,
      email: cliente.email || null,
      telefono: cliente.telefono || null,
      direccion: cliente.direccion || null,
      empresa: cliente.empresa || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data as Cliente;
}

/**
 * Obtiene un cliente por ID
 */
export async function obtenerClientePorId(id: string): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Cliente | null;
}

/**
 * Busca un cliente por email o teléfono
 * Busca primero por email, luego por teléfono, y si ambos coinciden con el mismo cliente, lo retorna
 */
export async function buscarCliente(email?: string, telefono?: string): Promise<Cliente | null> {
  if (!email && !telefono) {
    return null;
  }

  // Buscar por email primero (más confiable)
  if (email) {
    const { data: clientePorEmail, error: errorEmail } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (errorEmail) throw errorEmail;
    if (clientePorEmail) return clientePorEmail as Cliente;
  }

  // Si no se encontró por email, buscar por teléfono
  if (telefono) {
    const { data: clientePorTelefono, error: errorTelefono } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .limit(1)
      .maybeSingle();

    if (errorTelefono) throw errorTelefono;
    if (clientePorTelefono) return clientePorTelefono as Cliente;
  }

  return null;
}

/**
 * Obtiene todos los clientes
 */
export async function obtenerClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Cliente[];
}

/**
 * Obtiene un cliente con sus trabajos asociados
 */
export async function obtenerClienteConTrabajos(id: string): Promise<(Cliente & { trabajos: any[] }) | null> {
  const cliente = await obtenerClientePorId(id);
  if (!cliente) return null;

  // Obtener trabajos del cliente
  const { data: trabajos, error: trabajosError } = await supabase
    .from('trabajos')
    .select('*')
    .eq('cliente_id', id)
    .order('created_at', { ascending: false });

  if (trabajosError) throw trabajosError;
  if (!trabajos || trabajos.length === 0) {
    return {
      ...cliente,
      trabajos: []
    } as Cliente & { trabajos: any[] };
  }

  // Cargar cotizaciones por separado
  const cotizacionIds = [...new Set(trabajos.map(t => t.cotizacion_id).filter(Boolean))];
  let cotizaciones: any[] = [];
  
  if (cotizacionIds.length > 0) {
    const { data: cotizacionesData } = await supabase
      .from('cotizaciones')
      .select('*')
      .in('id', cotizacionIds);
    if (cotizacionesData) cotizaciones = cotizacionesData;
  }

  // Combinar trabajos con cotizaciones
  const trabajosCompletos = trabajos.map(trabajo => ({
    ...trabajo,
    cotizacion: cotizaciones.find(c => c.id === trabajo.cotizacion_id) || null
  }));

  return {
    ...cliente,
    trabajos: trabajosCompletos
  } as Cliente & { trabajos: any[] };
}

