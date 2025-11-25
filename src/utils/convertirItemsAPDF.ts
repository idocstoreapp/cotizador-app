/**
 * Convierte items del cotizador al formato requerido por QuotePDF
 */
import type { ItemCotizacion } from '../types/muebles';

interface QuotePDFData {
  clientName: string;
  date: string;
  quoteNumber: string;
  model: string;
  dimensions: string;
  items: Array<{ concepto: string; precio: number }>;
  total: number;
  image?: string;
}

interface DatosCliente {
  nombre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

/**
 * Convierte items del cotizador al formato del PDF profesional
 */
export function convertirItemsAPDF(
  items: ItemCotizacion[],
  cliente: DatosCliente,
  numero: string,
  fecha: string,
  subtotal: number,
  descuento: number,
  iva: number,
  total: number
): QuotePDFData {
  // Determinar modelo y dimensiones desde los items
  let model = 'Cocina Integral';
  let dimensions = 'Dimensiones del proyecto';
  let image: string | undefined;

  // Buscar el primer item de cocina para obtener modelo e imagen
  const cocinaItem = items.find(item => 
    item.tipo === 'catalogo' && 
    item.mueble?.categoria === 'cocina'
  );

  if (cocinaItem?.mueble) {
    model = cocinaItem.mueble.nombre;
    
    // Construir dimensiones desde las medidas
    if (cocinaItem.medidas) {
      const medidas = cocinaItem.medidas;
      dimensions = `${medidas.ancho || 'N/A'}cm × ${medidas.alto || 'N/A'}cm × ${medidas.profundidad || 'N/A'}cm`;
    }

    // Obtener imagen del mueble
    image = cocinaItem.mueble.imagen;
  } else if (items.length > 0 && items[0].tipo === 'catalogo') {
    // Si no hay cocina, usar el primer mueble
    model = items[0].mueble?.nombre || 'Proyecto Personalizado';
    if (items[0].mueble?.imagen) {
      image = items[0].mueble.imagen;
    }
  }

  // Convertir items a formato del PDF
  const itemsPDF = items.map(item => {
    let concepto = '';
    let precio = item.precio_total;

    if (item.tipo === 'catalogo') {
      concepto = item.mueble?.nombre || 'Mueble del catálogo';
      
      // Agregar detalles de opciones si existen
      const detalles: string[] = [];
      if (item.opciones.color) detalles.push(`Color: ${item.opciones.color}`);
      if (item.opciones.material) detalles.push(`Material: ${item.opciones.material}`);
      if (item.opciones.material_puertas) detalles.push(`Puertas: ${item.opciones.material_puertas}`);
      if (item.opciones.tipo_topes) detalles.push(`Topes: ${item.opciones.tipo_topes}`);
      
      if (item.medidas) {
        detalles.push(`${item.medidas.ancho || ''}×${item.medidas.alto || ''}×${item.medidas.profundidad || ''} cm`);
      }

      if (detalles.length > 0) {
        concepto += ` (${detalles.join(', ')})`;
      }

      if (item.cantidad > 1) {
        concepto += ` x${item.cantidad}`;
      }
    } else {
      // Item manual
      concepto = item.nombre || 'Item manual';
      if (item.descripcion) {
        concepto += ` - ${item.descripcion}`;
      }
      if (item.medidas) {
        concepto += ` (${item.medidas.ancho || ''}×${item.medidas.alto || ''}×${item.medidas.profundidad || ''} cm)`;
      }
      if (item.cantidad > 1) {
        concepto += ` x${item.cantidad}`;
      }
    }

    return { concepto, precio };
  });

  // Agregar subtotales y totales si hay descuento o IVA
  if (descuento > 0) {
    itemsPDF.push({
      concepto: 'Subtotal',
      precio: subtotal
    });
    itemsPDF.push({
      concepto: `Descuento (${descuento}%)`,
      precio: -(subtotal * (descuento / 100))
    });
  }

  if (iva > 0) {
    const subtotalConDescuento = descuento > 0 
      ? subtotal - (subtotal * (descuento / 100))
      : subtotal;
    
    itemsPDF.push({
      concepto: 'IVA (19%)',
      precio: iva
    });
  }

  return {
    clientName: cliente.nombre || 'Cliente',
    date: fecha,
    quoteNumber: numero,
    model,
    dimensions,
    items: itemsPDF,
    total,
    image
  };
}

