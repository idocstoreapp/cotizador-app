/**
 * Servicio para gestionar gastos fijos
 */
import { supabase } from '../utils/supabase';
import type { FixedExpense } from '../types/database';

/**
 * Obtiene todos los gastos fijos con filtros opcionales
 */
export async function obtenerGastosFijos(filtros?: {
  mes?: number; // 1-12
  anio?: number;
  fechaDesde?: string; // YYYY-MM-DD
  fechaHasta?: string; // YYYY-MM-DD
  categoriaId?: string;
  proveedor?: string;
  montoMinimo?: number;
  montoMaximo?: number;
}): Promise<FixedExpense[]> {
  let query = supabase
    .from('fixed_expenses')
    .select(`
      *,
      category:fixed_expense_categories(id, name, description)
    `)
    .order('date', { ascending: false });

  // Aplicar filtros
  if (filtros?.mes && filtros?.anio) {
    const fechaInicio = `${filtros.anio}-${String(filtros.mes).padStart(2, '0')}-01`;
    const fechaFin = `${filtros.anio}-${String(filtros.mes).padStart(2, '0')}-31`;
    query = query.gte('date', fechaInicio).lte('date', fechaFin);
  } else if (filtros?.fechaDesde) {
    query = query.gte('date', filtros.fechaDesde);
  } else if (filtros?.fechaHasta) {
    query = query.lte('date', filtros.fechaHasta);
  }

  if (filtros?.categoriaId) {
    query = query.eq('category_id', filtros.categoriaId);
  }

  if (filtros?.proveedor) {
    query = query.ilike('provider', `%${filtros.proveedor}%`);
  }

  if (filtros?.montoMinimo !== undefined) {
    query = query.gte('amount', filtros.montoMinimo);
  }

  if (filtros?.montoMaximo !== undefined) {
    query = query.lte('amount', filtros.montoMaximo);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Mapear categoría si existe
  return (data || []).map((item: any) => ({
    ...item,
    category: item.category ? {
      id: item.category.id,
      name: item.category.name,
      description: item.category.description
    } : null
  })) as FixedExpense[];
}

/**
 * Obtiene un gasto fijo por ID
 */
export async function obtenerGastoFijoPorId(id: string): Promise<FixedExpense | null> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select(`
      *,
      category:fixed_expense_categories(id, name, description)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw error;
  }

  return {
    ...data,
    category: data.category ? {
      id: data.category.id,
      name: data.category.name,
      description: data.category.description
    } : null
  } as FixedExpense;
}

/**
 * Crea un nuevo gasto fijo
 */
export async function crearGastoFijo(gasto: {
  category_id?: string;
  description: string;
  amount: number;
  provider?: string;
  payment_method?: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';
  date: string;
}): Promise<FixedExpense> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert({
      category_id: gasto.category_id || null,
      description: gasto.description.trim(),
      amount: gasto.amount,
      provider: gasto.provider?.trim() || null,
      payment_method: gasto.payment_method || null,
      date: gasto.date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      category:fixed_expense_categories(id, name, description)
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    category: data.category ? {
      id: data.category.id,
      name: data.category.name,
      description: data.category.description
    } : null
  } as FixedExpense;
}

/**
 * Actualiza un gasto fijo
 */
export async function actualizarGastoFijo(
  id: string,
  updates: Partial<{
    category_id: string;
    description: string;
    amount: number;
    provider: string;
    payment_method: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';
    date: string;
  }>
): Promise<FixedExpense> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .update({
      ...updates,
      description: updates.description?.trim(),
      provider: updates.provider?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      category:fixed_expense_categories(id, name, description)
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    category: data.category ? {
      id: data.category.id,
      name: data.category.name,
      description: data.category.description
    } : null
  } as FixedExpense;
}

/**
 * Elimina un gasto fijo
 */
export async function eliminarGastoFijo(id: string): Promise<void> {
  const { error } = await supabase
    .from('fixed_expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Obtiene estadísticas de gastos fijos
 */
export async function obtenerEstadisticasGastosFijos(filtros?: {
  mes?: number;
  anio?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}): Promise<{
  totalMes: number;
  totalPorCategoria: Array<{ categoria: string; total: number }>;
  totalPorMes: Array<{ mes: string; total: number }>;
  top5Gastos: FixedExpense[];
}> {
  // Obtener todos los gastos con los filtros
  const gastos = await obtenerGastosFijos(filtros);

  // Calcular total del mes
  const totalMes = gastos.reduce((sum, g) => sum + g.amount, 0);

  // Agrupar por categoría
  const porCategoria = new Map<string, number>();
  gastos.forEach((gasto) => {
    const categoriaNombre = gasto.category?.name || 'Sin categoría';
    const actual = porCategoria.get(categoriaNombre) || 0;
    porCategoria.set(categoriaNombre, actual + gasto.amount);
  });

  const totalPorCategoria = Array.from(porCategoria.entries()).map(([categoria, total]) => ({
    categoria,
    total
  })).sort((a, b) => b.total - a.total);

  // Agrupar por mes (últimos 12 meses)
  const porMes = new Map<string, number>();
  const ahora = new Date();
  for (let i = 11; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    porMes.set(mesKey, 0);
  }

  // Obtener todos los gastos (sin filtros de mes) para el gráfico de 12 meses
  const todosLosGastos = await obtenerGastosFijos();
  todosLosGastos.forEach((gasto) => {
    const fecha = new Date(gasto.date);
    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    if (porMes.has(mesKey)) {
      const actual = porMes.get(mesKey) || 0;
      porMes.set(mesKey, actual + gasto.amount);
    }
  });

  const totalPorMes = Array.from(porMes.entries()).map(([mes, total]) => ({
    mes,
    total
  }));

  // Top 5 gastos más altos
  const top5Gastos = [...gastos]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    totalMes,
    totalPorCategoria,
    totalPorMes,
    top5Gastos
  };
}

