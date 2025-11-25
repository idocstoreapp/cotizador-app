/**
 * Hook personalizado para cálculos de cotización
 * Centraliza la lógica de cálculo de precios y totales
 */
import { useMemo } from 'react';
import { useCotizacionStore } from '../store/cotizacionStore';
import { calcularPrecioFinal } from '../utils/calcularPrecioMueble';
import type { Mueble, OpcionesMueble } from '../types/muebles';

/**
 * Hook para calcular el precio de un mueble con opciones
 */
export function useMueblePrice(mueble: Mueble, opciones: OpcionesMueble) {
  return useMemo(() => {
    return calcularPrecioFinal(mueble, opciones);
  }, [mueble, opciones]);
}

/**
 * Hook para obtener estadísticas de la cotización actual
 */
export function useQuotationStats() {
  const { items, subtotal, descuento, iva, total } = useCotizacionStore();

  const stats = useMemo(() => {
    const cantidadItems = items.reduce((sum, item) => sum + item.cantidad, 0);
    const descuentoMonto = subtotal * (descuento / 100);
    const subtotalConDescuento = subtotal - descuentoMonto;

    return {
      cantidadItems,
      cantidadProductos: items.length,
      subtotal,
      descuentoMonto,
      subtotalConDescuento,
      iva,
      total,
      promedioPorItem: items.length > 0 ? subtotal / items.length : 0
    };
  }, [items, subtotal, descuento, iva, total]);

  return stats;
}

/**
 * Hook para calcular el precio total de un item específico
 */
export function useItemTotal(precioUnitario: number, cantidad: number) {
  return useMemo(() => {
    return precioUnitario * cantidad;
  }, [precioUnitario, cantidad]);
}


