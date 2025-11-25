/**
 * Utilidad para importar datos del Excel de plantilla
 * Este archivo contiene funciones para procesar datos del Excel
 */

// Estructura esperada del Excel (basada en plantillas típicas de cotización)
export interface DatosExcelMaterial {
  nombre: string;
  tipo: string;
  unidad: string;
  costo_unitario: number;
  proveedor?: string;
}

export interface DatosExcelServicio {
  nombre: string;
  descripcion?: string;
  precio_por_hora: number;
  horas_estimadas: number;
}

/**
 * Datos de ejemplo basados en plantillas típicas de cotización de muebles
 * Estos datos deben ser reemplazados con los datos reales del Excel
 */
export const MATERIALES_EJEMPLO: DatosExcelMaterial[] = [
  // Maderas
  { nombre: 'MDF 18mm', tipo: 'madera', unidad: 'm²', costo_unitario: 45000, proveedor: 'Proveedor A' },
  { nombre: 'MDF 12mm', tipo: 'madera', unidad: 'm²', costo_unitario: 35000, proveedor: 'Proveedor A' },
  { nombre: 'Pino', tipo: 'madera', unidad: 'm²', costo_unitario: 55000, proveedor: 'Proveedor B' },
  { nombre: 'Roble', tipo: 'madera', unidad: 'm²', costo_unitario: 120000, proveedor: 'Proveedor C' },
  
  // Hierro y metales
  { nombre: 'Hierro 1/2"', tipo: 'hierro', unidad: 'metro lineal', costo_unitario: 15000, proveedor: 'Proveedor D' },
  { nombre: 'Hierro 1"', tipo: 'hierro', unidad: 'metro lineal', costo_unitario: 25000, proveedor: 'Proveedor D' },
  { nombre: 'Aluminio', tipo: 'metal', unidad: 'metro lineal', costo_unitario: 35000, proveedor: 'Proveedor E' },
  
  // Insumos
  { nombre: 'Bisagras', tipo: 'insumos', unidad: 'unidad', costo_unitario: 5000, proveedor: 'Proveedor F' },
  { nombre: 'Tornillos', tipo: 'insumos', unidad: 'unidad', costo_unitario: 500, proveedor: 'Proveedor F' },
  { nombre: 'Pegante', tipo: 'insumos', unidad: 'unidad', costo_unitario: 15000, proveedor: 'Proveedor G' },
  { nombre: 'Lijas', tipo: 'insumos', unidad: 'unidad', costo_unitario: 3000, proveedor: 'Proveedor G' },
  
  // Pintura y acabados
  { nombre: 'Pintura Base', tipo: 'pintura', unidad: 'galón', costo_unitario: 85000, proveedor: 'Proveedor H' },
  { nombre: 'Barniz', tipo: 'pintura', unidad: 'galón', costo_unitario: 95000, proveedor: 'Proveedor H' },
  { nombre: 'Laca', tipo: 'pintura', unidad: 'galón', costo_unitario: 120000, proveedor: 'Proveedor H' },
  
  // Accesorios
  { nombre: 'Manijas', tipo: 'accesorios', unidad: 'unidad', costo_unitario: 8000, proveedor: 'Proveedor I' },
  { nombre: 'Rieles', tipo: 'accesorios', unidad: 'unidad', costo_unitario: 25000, proveedor: 'Proveedor I' },
  { nombre: 'Cajones', tipo: 'accesorios', unidad: 'unidad', costo_unitario: 45000, proveedor: 'Proveedor J' },
];

export const SERVICIOS_EJEMPLO: DatosExcelServicio[] = [
  { nombre: 'Carpintero', descripcion: 'Trabajo de carpintería general', precio_por_hora: 35000, horas_estimadas: 8 },
  { nombre: 'Soldador', descripcion: 'Trabajo de soldadura', precio_por_hora: 40000, horas_estimadas: 6 },
  { nombre: 'Pintor', descripcion: 'Aplicación de pintura y acabados', precio_por_hora: 30000, horas_estimadas: 4 },
  { nombre: 'Instalador', descripcion: 'Instalación en sitio', precio_por_hora: 45000, horas_estimadas: 4 },
  { nombre: 'Diseñador', descripcion: 'Diseño y planos', precio_por_hora: 50000, horas_estimadas: 2 },
];

/**
 * Importa materiales desde un array de datos del Excel
 */
export async function importarMaterialesDesdeExcel(
  datos: DatosExcelMaterial[],
  crearMaterial: (material: any) => Promise<any>
): Promise<number> {
  let importados = 0;
  for (const material of datos) {
    try {
      await crearMaterial({
        nombre: material.nombre,
        tipo: material.tipo,
        unidad: material.unidad,
        costo_unitario: material.costo_unitario,
        proveedor: material.proveedor
      });
      importados++;
    } catch (error) {
      console.error(`Error al importar material ${material.nombre}:`, error);
    }
  }
  return importados;
}

/**
 * Importa servicios desde un array de datos del Excel
 */
export async function importarServiciosDesdeExcel(
  datos: DatosExcelServicio[],
  crearServicio: (servicio: any) => Promise<any>
): Promise<number> {
  let importados = 0;
  for (const servicio of datos) {
    try {
      await crearServicio({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio_por_hora: servicio.precio_por_hora,
        horas_estimadas: servicio.horas_estimadas
      });
      importados++;
    } catch (error) {
      console.error(`Error al importar servicio ${servicio.nombre}:`, error);
    }
  }
  return importados;
}


