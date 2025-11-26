/**
 * Convierte items del cotizador al formato requerido por QuotePDF
 */
import type { ItemCotizacion } from '../types/muebles';

interface EmpresaInfo {
  nombre: string;
  nombreCompleto?: string;
  logo?: string;
  rut?: string;
  direccion?: string;
  emails?: string[];
  telefonos?: string[];
  sitioWeb?: string;
  descripcion?: string;
}

interface QuotePDFData {
  clientName: string;
  date: string;
  quoteNumber: string;
  model: string;
  dimensions: string;
  items: Array<{ concepto: string; precio: number }>;
  total: number;
  image?: string;
  companyName?: string;
  companyLogo?: string;
  empresaInfo?: EmpresaInfo;
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
  total: number,
  companyName?: string,
  companyLogo?: string,
  empresaInfo?: EmpresaInfo
): QuotePDFData {
  // Determinar modelo y dimensiones desde los items
  let model = 'Cocina Integral';
  let dimensions = 'Dimensiones del proyecto';
  let image: string | undefined;

  // Buscar el primer item de cocina para obtener modelo e imagen
  const cocinaItem = items.find(item => 
    item.tipo === 'catalogo' && 
    'mueble' in item && 
    item.mueble?.categoria === 'cocina'
  );

  if (cocinaItem && 'mueble' in cocinaItem && cocinaItem.mueble) {
    model = cocinaItem.mueble.nombre;
    
    // Construir dimensiones desde las medidas
    if (cocinaItem.medidas) {
      const medidas = cocinaItem.medidas;
      dimensions = `${medidas.ancho || 'N/A'}cm × ${medidas.alto || 'N/A'}cm × ${medidas.profundidad || 'N/A'}cm`;
    }

    // Obtener imagen del mueble
    image = cocinaItem.mueble.imagen;
  } else if (items.length > 0 && items[0].tipo === 'catalogo' && 'mueble' in items[0]) {
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
    let detalles: any = undefined;

    if (item.tipo === 'catalogo') {
      concepto = item.mueble?.nombre || 'Mueble del catálogo';
      
      // Agregar detalles de opciones si existen
      const detallesTexto: string[] = [];
      if (item.opciones.color) detallesTexto.push(`Color: ${item.opciones.color}`);
      if (item.opciones.material) detallesTexto.push(`Material: ${item.opciones.material}`);
      if (item.opciones.material_puertas) detallesTexto.push(`Puertas: ${item.opciones.material_puertas}`);
      if (item.opciones.tipo_topes) detallesTexto.push(`Topes: ${item.opciones.tipo_topes}`);
      
      if (item.medidas) {
        detallesTexto.push(`${item.medidas.ancho || ''}×${item.medidas.alto || ''}×${item.medidas.profundidad || ''} cm`);
      }

      if (detallesTexto.length > 0) {
        concepto += ` (${detallesTexto.join(', ')})`;
      }

      if (item.cantidad > 1) {
        concepto += ` x${item.cantidad}`;
      }

      // Agregar detalles si hay materiales o servicios
      if (item.materiales && item.materiales.length > 0) {
        detalles = {
          materiales: item.materiales.map(mat => ({
            nombre: mat.material_nombre || 'Material',
            cantidad: mat.cantidad,
            unidad: mat.unidad,
            precio_unitario: mat.precio_unitario || 0,
            subtotal: (mat.precio_unitario || 0) * mat.cantidad
          }))
        };
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

      // Agregar detalles completos para items manuales
      detalles = {};
      
      // Materiales
      if (item.materiales && item.materiales.length > 0) {
        detalles.materiales = item.materiales.map(mat => ({
          nombre: mat.material_nombre || 'Material',
          cantidad: mat.cantidad,
          unidad: mat.unidad,
          precio_unitario: mat.precio_unitario || 0,
          subtotal: (mat.precio_unitario || 0) * mat.cantidad
        }));
      }

      // Servicios
      if (item.servicios && item.servicios.length > 0) {
        detalles.servicios = item.servicios.map(serv => ({
          nombre: serv.servicio_nombre || 'Servicio',
          horas: serv.horas,
          precio_por_hora: serv.precio_por_hora,
          subtotal: serv.horas * serv.precio_por_hora
        }));
      }

      // Gastos extras
      if (item.gastos_extras && item.gastos_extras.length > 0) {
        detalles.gastos_extras = item.gastos_extras;
      }

      // Margen de ganancia y subtotal antes de margen
      if (item.margen_ganancia !== undefined) {
        detalles.margen_ganancia = item.margen_ganancia;
        
        // Calcular subtotal antes de margen
        const subtotalMateriales = (detalles.materiales || []).reduce((sum: number, m: any) => sum + m.subtotal, 0);
        const subtotalServicios = (detalles.servicios || []).reduce((sum: number, s: any) => sum + s.subtotal, 0);
        const subtotalGastos = (detalles.gastos_extras || []).reduce((sum: number, g: any) => sum + g.monto, 0);
        detalles.subtotal_antes_margen = subtotalMateriales + subtotalServicios + subtotalGastos;
      }
    }

    return { concepto, precio, detalles };
  });

  // Agregar subtotales y totales si hay descuento o IVA
  if (descuento > 0) {
    itemsPDF.push({
      concepto: 'Subtotal',
      precio: subtotal,
      detalles: undefined
    });
    itemsPDF.push({
      concepto: `Descuento (${descuento}%)`,
      precio: -(subtotal * (descuento / 100)),
      detalles: undefined
    });
  }

  if (iva > 0) {
    const subtotalConDescuento = descuento > 0 
      ? subtotal - (subtotal * (descuento / 100))
      : subtotal;
    
    itemsPDF.push({
      concepto: 'IVA (19%)',
      precio: iva,
      detalles: undefined
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
    image,
    companyName,
    companyLogo,
    empresaInfo
  };
}

