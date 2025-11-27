/**
 * Servicio para gestionar facturas
 */
import { supabase } from '../utils/supabase';
import type { Factura, FacturaItem } from '../types/database';

/**
 * Crea una factura
 */
export async function crearFactura(factura: {
  cotizacion_id: string;
  numero_factura: string;
  fecha_factura: string;
  proveedor?: string;
  total: number;
  archivo_url?: string;
  tipo: 'material' | 'mano_obra' | 'transporte' | 'gasto_hormiga' | 'mixta';
  items?: Array<{
    tipo_item: 'material_real' | 'mano_obra_real' | 'transporte_real' | 'gasto_hormiga';
    item_id: string;
  }>;
}): Promise<Factura> {
  // Crear la factura
  const { data: facturaData, error: facturaError } = await supabase
    .from('facturas')
    .insert({
      cotizacion_id: factura.cotizacion_id,
      numero_factura: factura.numero_factura,
      fecha_factura: factura.fecha_factura,
      proveedor: factura.proveedor || null,
      total: factura.total,
      archivo_url: factura.archivo_url || null,
      tipo: factura.tipo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (facturaError) throw facturaError;

  // Si hay items, crearlos
  if (factura.items && factura.items.length > 0) {
    const items = factura.items.map(item => ({
      factura_id: facturaData.id,
      tipo_item: item.tipo_item,
      item_id: item.item_id,
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('factura_items')
      .insert(items);

    if (itemsError) {
      // Si falla la inserción de items, eliminar la factura
      await supabase.from('facturas').delete().eq('id', facturaData.id);
      throw itemsError;
    }
  }

  // Cargar la factura con sus items
  return await obtenerFacturaPorId(facturaData.id);
}

/**
 * Obtiene una factura por ID con sus items
 */
export async function obtenerFacturaPorId(id: string): Promise<Factura> {
  const { data: factura, error: facturaError } = await supabase
    .from('facturas')
    .select('*')
    .eq('id', id)
    .single();

  if (facturaError) throw facturaError;

  // Cargar items
  const { data: items, error: itemsError } = await supabase
    .from('factura_items')
    .select('*')
    .eq('factura_id', id);

  if (itemsError) throw itemsError;

  return {
    ...factura,
    items: items || []
  } as Factura;
}

/**
 * Obtiene todas las facturas de una cotización
 */
export async function obtenerFacturasPorCotizacion(cotizacionId: string): Promise<Factura[]> {
  const { data: facturas, error: facturasError } = await supabase
    .from('facturas')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('fecha_factura', { ascending: false });

  if (facturasError) throw facturasError;

  // Cargar items para cada factura
  const facturasConItems = await Promise.all(
    (facturas || []).map(async (factura) => {
      const { data: items } = await supabase
        .from('factura_items')
        .select('*')
        .eq('factura_id', factura.id);

      return {
        ...factura,
        items: items || []
      } as Factura;
    })
  );

  return facturasConItems;
}

/**
 * Actualiza una factura
 */
export async function actualizarFactura(
  id: string,
  updates: Partial<{
    numero_factura: string;
    fecha_factura: string;
    proveedor: string;
    total: number;
    archivo_url: string;
    tipo: 'material' | 'mano_obra' | 'transporte' | 'gasto_hormiga' | 'mixta';
  }>
): Promise<Factura> {
  const { data, error } = await supabase
    .from('facturas')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return await obtenerFacturaPorId(id);
}

/**
 * Elimina una factura (y sus items)
 */
export async function eliminarFactura(id: string): Promise<void> {
  // Los items se eliminan automáticamente por CASCADE
  const { error } = await supabase
    .from('facturas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Agrega items a una factura existente
 */
export async function agregarItemsAFactura(
  facturaId: string,
  items: Array<{
    tipo_item: 'material_real' | 'mano_obra_real' | 'transporte_real' | 'gasto_hormiga';
    item_id: string;
  }>
): Promise<FacturaItem[]> {
  const itemsData = items.map(item => ({
    factura_id: facturaId,
    tipo_item: item.tipo_item,
    item_id: item.item_id,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('factura_items')
    .insert(itemsData)
    .select();

  if (error) throw error;
  return data as FacturaItem[];
}

/**
 * Elimina un item de una factura
 */
export async function eliminarItemDeFactura(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('factura_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

