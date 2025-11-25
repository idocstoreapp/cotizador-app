/**
 * Utilidades para calcular los totales de una cotización
 * Esta lógica está separada para facilitar su mantenimiento y testing
 */
import type { CotizacionMaterial, CotizacionServicio } from '../types/database';

// Constantes de cálculo
export const IVA_PORCENTAJE = 19; // IVA en Colombia
export const MARGEN_GANANCIA_DEFAULT = 30; // 30% por defecto

/**
 * Calcula el subtotal de materiales
 * @param materiales - Array de materiales con cantidad y precio unitario
 * @returns Subtotal de materiales
 */
export function calcularSubtotalMateriales(
  materiales: CotizacionMaterial[]
): number {
  return materiales.reduce((total, item) => {
    return total + (item.cantidad * item.precio_unitario);
  }, 0);
}

/**
 * Calcula el subtotal de servicios/mano de obra
 * @param servicios - Array de servicios con horas y precio por hora
 * @returns Subtotal de servicios
 */
export function calcularSubtotalServicios(
  servicios: CotizacionServicio[]
): number {
  return servicios.reduce((total, item) => {
    return total + (item.horas * item.precio_por_hora);
  }, 0);
}

/**
 * Calcula el subtotal general (materiales + servicios)
 * @param subtotalMateriales - Subtotal de materiales
 * @param subtotalServicios - Subtotal de servicios
 * @returns Subtotal general
 */
export function calcularSubtotal(
  subtotalMateriales: number,
  subtotalServicios: number
): number {
  return subtotalMateriales + subtotalServicios;
}

/**
 * Calcula el IVA sobre el subtotal
 * @param subtotal - Subtotal general
 * @param ivaPorcentaje - Porcentaje de IVA (por defecto 19%)
 * @returns Monto del IVA
 */
export function calcularIVA(
  subtotal: number,
  ivaPorcentaje: number = IVA_PORCENTAJE
): number {
  return subtotal * (ivaPorcentaje / 100);
}

/**
 * Calcula el total con margen de ganancia
 * El margen se aplica sobre el subtotal (antes del IVA)
 * @param subtotal - Subtotal general
 * @param iva - Monto del IVA
 * @param margenGanancia - Porcentaje de margen de ganancia
 * @returns Total final de la cotización
 */
export function calcularTotal(
  subtotal: number,
  iva: number,
  margenGanancia: number = MARGEN_GANANCIA_DEFAULT
): number {
  // Aplicar margen de ganancia al subtotal
  const subtotalConMargen = subtotal * (1 + margenGanancia / 100);
  // Sumar el IVA
  const total = subtotalConMargen + iva;
  return Math.round(total * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcula todos los valores de una cotización
 * Esta es la función principal que se debe usar
 * @param materiales - Array de materiales
 * @param servicios - Array de servicios
 * @param margenGanancia - Porcentaje de margen de ganancia (opcional)
 * @param ivaPorcentaje - Porcentaje de IVA (opcional, por defecto 19%)
 * @returns Objeto con todos los cálculos
 */
export function calcularCotizacionCompleta(
  materiales: CotizacionMaterial[],
  servicios: CotizacionServicio[],
  margenGanancia: number = MARGEN_GANANCIA_DEFAULT,
  ivaPorcentaje: number = IVA_PORCENTAJE
) {
  // Calcular subtotales
  const subtotalMateriales = calcularSubtotalMateriales(materiales);
  const subtotalServicios = calcularSubtotalServicios(servicios);
  const subtotal = calcularSubtotal(subtotalMateriales, subtotalServicios);

  // Calcular IVA
  const iva = calcularIVA(subtotal, ivaPorcentaje);

  // Calcular total con margen
  const total = calcularTotal(subtotal, iva, margenGanancia);

  return {
    subtotalMateriales,
    subtotalServicios,
    subtotal,
    iva,
    margenGanancia,
    total
  };
}


