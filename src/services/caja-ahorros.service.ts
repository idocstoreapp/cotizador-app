/**
 * Servicio para la caja de ahorros.
 * El dinero depositado aquí no se usa para pagos (gastos fijos, liquidaciones, etc.).
 */
import { supabase } from '../utils/supabase';
import type { CajaAhorrosMovimiento } from '../types/database';

export async function obtenerMovimientosAhorros(): Promise<CajaAhorrosMovimiento[]> {
  const { data, error } = await supabase
    .from('caja_ahorros_movimientos')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) throw error;
  return (data || []) as CajaAhorrosMovimiento[];
}

export async function obtenerTotalAhorros(): Promise<number> {
  const { data, error } = await supabase
    .from('caja_ahorros_movimientos')
    .select('monto');

  if (error) throw error;
  const total = (data || []).reduce((sum: number, row: { monto: number }) => sum + Number(row.monto), 0);
  return total;
}

export interface DepositarAhorrosParams {
  monto: number;
  fecha?: string; // YYYY-MM-DD
  nota?: string;
  created_by?: string;
}

export async function depositarAhorros(params: DepositarAhorrosParams): Promise<CajaAhorrosMovimiento> {
  const { monto, fecha, nota, created_by } = params;
  if (monto <= 0) throw new Error('El monto debe ser mayor a 0.');

  const row = {
    monto,
    fecha: fecha || new Date().toISOString().split('T')[0],
    nota: nota || null,
    created_by: created_by || null
  };

  const { data, error } = await supabase
    .from('caja_ahorros_movimientos')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data as CajaAhorrosMovimiento;
}
