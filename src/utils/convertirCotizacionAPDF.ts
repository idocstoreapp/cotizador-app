/**
 * Convierte una cotización guardada en la BD al formato requerido por QuotePDF
 */
import type { Cotizacion } from '../types/database';
import { EMPRESAS } from '../types/empresas';

/**
 * Convierte una cotización guardada al formato del PDF profesional
 */
export function convertirCotizacionAPDF(cotizacion: Cotizacion) {
  // Construir items del PDF
  const items: Array<{ concepto: string; precio: number; detalles?: any }> = [];

  // PRIORIDAD: Si hay items guardados en la cotización, usarlos directamente
  if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    // Convertir items guardados al formato del PDF
    cotizacion.items.forEach((item: any) => {
      let concepto = '';
      let precio = 0;

      if (item.tipo === 'catalogo' && item.mueble) {
        // Item del catálogo
        concepto = item.mueble.nombre || 'Mueble del catálogo';
        
        // Agregar detalles de opciones si existen
        const detallesTexto: string[] = [];
        if (item.opciones?.color) detallesTexto.push(`Color: ${item.opciones.color}`);
        if (item.opciones?.material) detallesTexto.push(`Material: ${item.opciones.material}`);
        if (item.opciones?.material_puertas) detallesTexto.push(`Puertas: ${item.opciones.material_puertas}`);
        if (item.opciones?.tipo_topes) detallesTexto.push(`Topes: ${item.opciones.tipo_topes}`);
        
        if (item.medidas) {
          detallesTexto.push(`${item.medidas.ancho || ''}×${item.medidas.alto || ''}×${item.medidas.profundidad || ''} cm`);
        }

        if (detallesTexto.length > 0) {
          concepto += ` (${detallesTexto.join(', ')})`;
        }

        if (item.cantidad > 1) {
          concepto += ` x${item.cantidad}`;
        }

        precio = item.precio_total || 0;
      } else if (item.tipo === 'manual') {
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
        precio = item.precio_total || 0;
      }

      if (concepto && precio > 0) {
        items.push({
          concepto,
          precio
        });
      }
    });
  } else {
    // Fallback: Si no hay items guardados, usar materiales y servicios
    const materiales = cotizacion.materiales && Array.isArray(cotizacion.materiales) 
      ? cotizacion.materiales.map((material: any) => {
          const nombreMaterial = material.material?.nombre || material.nombre || 'Material';
          const cantidad = material.cantidad || 1;
          const precioUnitario = material.precio_unitario || 0;
          const subtotal = cantidad * precioUnitario;
          
          return {
            nombre: nombreMaterial,
            cantidad,
            unidad: material.unidad || 'unidad',
            precio_unitario: precioUnitario,
            subtotal
          };
        })
      : [];

    const servicios = cotizacion.servicios && Array.isArray(cotizacion.servicios)
      ? cotizacion.servicios.map((servicio: any) => {
          const nombreServicio = servicio.servicio?.nombre || servicio.nombre || 'Servicio';
          const horas = servicio.horas || 0;
          const precioPorHora = servicio.precio_por_hora || 0;
          const subtotal = horas * precioPorHora;
          
          return {
            nombre: nombreServicio,
            horas,
            precio_por_hora: precioPorHora,
            subtotal
          };
        })
      : [];

    // Agregar items individuales
    materiales.forEach((mat: any) => {
      items.push({
        concepto: `${mat.nombre}${mat.cantidad > 1 ? ` x${mat.cantidad}` : ''}`,
        precio: mat.subtotal
      });
    });

    servicios.forEach((serv: any) => {
      items.push({
        concepto: `${serv.nombre}${serv.horas > 0 ? ` (${serv.horas}h)` : ''}`,
        precio: serv.subtotal
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

  // Obtener información de la empresa si está disponible
  let companyName: string | undefined;
  let companyLogo: string | undefined;
  let empresaInfo: any = undefined;
  
  if (cotizacion.empresa) {
    const empresa = EMPRESAS[cotizacion.empresa];
    if (empresa) {
      companyName = empresa.nombre;
      companyLogo = empresa.logo;
      empresaInfo = {
        nombre: empresa.nombre,
        nombreCompleto: empresa.nombreCompleto,
        logo: empresa.logo,
        rut: empresa.rut,
        direccion: empresa.direccion,
        emails: empresa.emails,
        telefonos: empresa.telefonos,
        sitioWeb: empresa.sitioWeb,
        descripcion: empresa.descripcion
      };
    }
  }

  // Obtener nombre del vendedor
  let vendedorName: string | undefined;
  if (cotizacion.vendedor) {
    vendedorName = `${cotizacion.vendedor.nombre || ''} ${cotizacion.vendedor.apellido || ''}`.trim();
  }

  // Extraer cantidad y precio unitario de los items
  const itemsConDetalles = items.map((item: any) => {
    // Buscar en los items originales para obtener cantidad
    if (cotizacion.items && Array.isArray(cotizacion.items)) {
      const itemOriginal = cotizacion.items.find((it: any) => {
        const conceptoItem = it.tipo === 'catalogo' 
          ? (it.mueble?.nombre || '')
          : (it.nombre || '');
        return item.concepto.includes(conceptoItem);
      });
      
      if (itemOriginal) {
        const cantidad = itemOriginal.cantidad || 1;
        const precioTotal = item.precio;
        const precioUnitario = precioTotal / cantidad;
        
        return {
          ...item,
          cantidad,
          precio_unitario: precioUnitario
        };
      }
    }
    
    // Si no se encuentra, asumir cantidad 1
    return {
      ...item,
      cantidad: 1,
      precio_unitario: item.precio
    };
  });

  return {
    clientName: cotizacion.cliente_nombre,
    clientEmail: cotizacion.cliente_email,
    clientPhone: cotizacion.cliente_telefono,
    clientAddress: cotizacion.cliente_direccion,
    vendedorName,
    date: fecha,
    quoteNumber: cotizacion.numero,
    model,
    dimensions,
    items: itemsConDetalles,
    total: cotizacion.total,
    image,
    companyName,
    companyLogo,
    empresaInfo
  };
}

