/**
 * Servicio para gestionar categorías de gastos fijos
 */
import { supabase } from '../utils/supabase';
import type { FixedExpenseCategory } from '../types/database';

/**
 * Obtiene todas las categorías de gastos fijos
 */
export async function obtenerCategoriasGastosFijos(): Promise<FixedExpenseCategory[]> {
  const { data, error } = await supabase
    .from('fixed_expense_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as FixedExpenseCategory[];
}

/**
 * Crea una nueva categoría de gasto fijo
 */
export async function crearCategoriaGastoFijo(
  name: string,
  description?: string
): Promise<FixedExpenseCategory> {
  const { data, error } = await supabase
    .from('fixed_expense_categories')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data as FixedExpenseCategory;
}

/**
 * Actualiza una categoría de gasto fijo
 */
export async function actualizarCategoriaGastoFijo(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
  }>
): Promise<FixedExpenseCategory> {
  const { data, error } = await supabase
    .from('fixed_expense_categories')
    .update({
      ...updates,
      name: updates.name?.trim()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FixedExpenseCategory;
}

/**
 * Elimina una categoría de gasto fijo
 */
export async function eliminarCategoriaGastoFijo(id: string): Promise<void> {
  const { error } = await supabase
    .from('fixed_expense_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}


