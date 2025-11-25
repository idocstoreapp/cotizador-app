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
}): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: cliente.nombre,
      email: cliente.email || null,
      telefono: cliente.telefono || null,
      direccion: cliente.direccion || null,
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
 */
export async function buscarCliente(email?: string, telefono?: string): Promise<Cliente | null> {
  if (!email && !telefono) {
    return null;
  }

  let query = supabase.from('clientes').select('*');

  if (email) {
    query = query.eq('email', email);
  } else if (telefono) {
    query = query.eq('telefono', telefono);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) throw error;
  return data as Cliente | null;
}

