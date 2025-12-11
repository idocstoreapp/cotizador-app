/**
 * Tipos para el catálogo de muebles
 */

// Material predeterminado en un mueble del catálogo
export interface MaterialMueble {
  material_id?: string; // ID del material (UUID) - opcional porque puede no existir en materiales presupuestados
  material_nombre?: string; // Para mostrar
  cantidad: number;
  unidad: string; // m², metro lineal, unidad, etc.
  precio_unitario?: number; // Precio del material al momento de crear el mueble
  material_tipo?: string; // Tipo de material (opcional)
}

// Medidas predeterminadas de un mueble
export interface MedidasMueble {
  ancho?: number; // cm
  alto?: number; // cm
  profundidad?: number; // cm
  unidad?: string; // 'cm' por defecto
}

// Opción personalizada con imagen y precio
export interface OpcionPersonalizada {
  nombre: string;
  imagen_url: string;
  precio_adicional?: number; // Precio adicional por esta opción
  multiplicador?: number; // Multiplicador del precio base (alternativa a precio_adicional)
}

// Opciones de configuración de un mueble
export interface OpcionesMueble {
  color: string;
  material: string;
  encimera?: string;
  cantear?: string;
  // Opciones personalizadas para cocinas
  tipo_cocina?: string; // recta, cara_a_cara, en_L, irregular
  material_puertas?: string; // vidrio, brillantes, vintage, melamina
  tipo_topes?: string; // cuarzo, madera, granito, marmol, laminado
  [key: string]: string | undefined;
}

// Item de mueble en catálogo
export interface Mueble {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen: string;
  precio_base: number;
  categoria: 'closet' | 'cocina' | 'bano' | 'sensorial' | 'otros';
  opciones_disponibles: {
    colores: string[];
    materiales: string[];
    encimeras?: string[];
    canteados?: string[];
    // Opciones personalizadas por categoría
    opciones_personalizadas?: {
      tipo_cocina?: OpcionPersonalizada[];
      material_puertas?: OpcionPersonalizada[];
      tipo_topes?: OpcionPersonalizada[];
      [key: string]: OpcionPersonalizada[] | undefined;
    };
  };
  imagenes_adicionales?: string[];
  // Imágenes por variante: mapea combinaciones de opciones a URLs de imágenes
  imagenes_por_variante?: Array<{
    color?: string;
    material?: string;
    encimera?: string;
    imagen_url: string;
  }>;
  
  // Nuevos campos para cotización predeterminada
  medidas?: MedidasMueble;
  materiales_predeterminados?: MaterialMueble[]; // Materiales con cantidades específicas
  dias_fabricacion?: number; // Días estimados de fabricación
  horas_mano_obra?: number; // Horas de mano de obra estimadas
  margen_ganancia?: number; // Margen de ganancia predeterminado (%)
  servicios_predeterminados?: string[]; // IDs de servicios predeterminados
}

// Item manual en cotización (sin mueble del catálogo)
export interface ItemManualCotizacion {
  id: string;
  tipo: 'manual';
  nombre: string;
  descripcion?: string;
  medidas?: MedidasMueble;
  materiales: MaterialMueble[];
  servicios?: Array<{
    servicio_id: string;
    servicio_nombre?: string;
    horas: number;
    precio_por_hora: number;
  }>;
  gastos_extras?: Array<{
    concepto: string;
    monto: number;
  }>;
  porcentaje_mano_obra?: number; // Porcentaje adicional sobre mano de obra (no suma a utilidad)
  monto_pintura?: number; // Monto total de pintura
  descuento?: number; // Porcentaje de descuento
  dias_fabricacion?: number;
  margen_ganancia?: number;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
}

// Item de mueble configurado en cotización (desde catálogo)
export interface MuebleCotizacion {
  id: string;
  tipo: 'catalogo';
  mueble_id: string;
  mueble?: Mueble; // Relación cargada
  opciones: OpcionesMueble;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  
  // Valores modificables (pueden diferir de los predeterminados)
  medidas?: MedidasMueble;
  materiales?: MaterialMueble[]; // Si se modifican los materiales predeterminados
  dias_fabricacion?: number;
  horas_mano_obra?: number;
  margen_ganancia?: number;
}

// Tipo unión para items de cotización
export type ItemCotizacion = MuebleCotizacion | ItemManualCotizacion;

// Estado de la cotización en el carrito
export interface EstadoCotizacion {
  items: ItemCotizacion[]; // Puede incluir muebles del catálogo e items manuales
  subtotal: number;
  descuento: number; // Porcentaje
  iva: number; // Porcentaje (19%)
  total: number;
}


