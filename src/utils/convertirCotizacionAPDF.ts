/**
 * Convierte una cotización guardada en la BD al formato requerido por QuotePDF
 */
import type { Cotizacion } from '../types/database';

/**
 * Convierte una cotización guardada al formato del PDF profesional
 */
export function convertirCotizacionAPDF(cotizacion: Cotizacion) {
  // Construir items del PDF desde materiales y servicios
  const items: Array<{ concepto: string; precio: number }> = [];

  // Agregar materiales
  if (cotizacion.materiales && Array.isArray(cotizacion.materiales)) {
    cotizacion.materiales.forEach((material: any) => {
      const nombreMaterial = material.material?.nombre || material.nombre || 'Material';
      const cantidad = material.cantidad || 1;
      const precioUnitario = material.precio_unitario || 0;
      const subtotal = cantidad * precioUnitario;

      items.push({
        concepto: `${nombreMaterial}${cantidad > 1 ? ` x${cantidad}` : ''}`,
        precio: subtotal
      });
    });
  }

  // Agregar servicios
  if (cotizacion.servicios && Array.isArray(cotizacion.servicios)) {
    cotizacion.servicios.forEach((servicio: any) => {
      const nombreServicio = servicio.servicio?.nombre || servicio.nombre || 'Servicio';
      const horas = servicio.horas || 0;
      const precioPorHora = servicio.precio_por_hora || 0;
      const subtotal = horas * precioPorHora;

      items.push({
        concepto: `${nombreServicio}${horas > 0 ? ` (${horas}h)` : ''}`,
        precio: subtotal
      });
    });
  }

  // Agregar subtotales y totales
  if (cotizacion.subtotal_materiales > 0) {
    items.push({
      concepto: 'Subtotal Materiales',
      precio: cotizacion.subtotal_materiales
    });
  }

  if (cotizacion.subtotal_servicios > 0) {
    items.push({
      concepto: 'Subtotal Servicios',
      precio: cotizacion.subtotal_servicios
    });
  }

  items.push({
    concepto: 'Subtotal',
    precio: cotizacion.subtotal
  });

  if (cotizacion.margen_ganancia > 0) {
    const margenGanancia = (cotizacion.subtotal * cotizacion.margen_ganancia) / 100;
    items.push({
      concepto: `Margen de Ganancia (${cotizacion.margen_ganancia}%)`,
      precio: margenGanancia
    });
  }

  if (cotizacion.iva > 0) {
    items.push({
      concepto: 'IVA (19%)',
      precio: cotizacion.iva
    });
  }

  // Determinar modelo y dimensiones desde los materiales/servicios
  let model = 'Cocina Integral';
  let dimensions = 'Dimensiones del proyecto';
  let image: string | undefined;

  // Intentar obtener información del primer material o servicio
  if (cotizacion.materiales && cotizacion.materiales.length > 0) {
    const primerMaterial = cotizacion.materiales[0];
    if (primerMaterial.material?.nombre) {
      model = primerMaterial.material.nombre;
    }
  }

  // Formatear fecha
  const fecha = new Date(cotizacion.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return {
    clientName: cotizacion.cliente_nombre,
    date: fecha,
    quoteNumber: cotizacion.numero,
    model,
    dimensions,
    items,
    total: cotizacion.total,
    image
  };
}

