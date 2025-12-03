/**
 * Servicio para gestión de muebles del catálogo
 * Obtiene muebles desde Supabase
 */
import { supabase } from '../utils/supabase';
import type { Mueble } from '../types/muebles';

// Tipo para mueble en la base de datos
interface MuebleDB {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen: string;
  precio_base: number;
  categoria: 'closet' | 'cocina' | 'bano' | 'sensorial' | 'otros';
  medidas?: any;
  materiales_predeterminados?: any;
  servicios_predeterminados?: any;
  opciones_disponibles?: any;
  imagenes_adicionales?: any;
  imagenes_por_variante?: any;
  dias_fabricacion?: number;
  horas_mano_obra?: number;
  margen_ganancia?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Convierte un MuebleDB a Mueble
 * Asegura que los campos JSONB se parseen correctamente
 */
function convertirMuebleDB(muebleDB: MuebleDB): Mueble {
  // Parsear opciones_disponibles - asegurar que sea un objeto válido
  let opcionesDisponibles: any = {
    colores: [] as string[],
    materiales: [] as string[],
    encimeras: [] as string[],
    canteados: [] as string[]
  };

  console.log(`🔄 [convertirMuebleDB] Convirtiendo mueble: ${muebleDB.nombre}`);
  console.log(`🔄 [convertirMuebleDB] opciones_disponibles raw:`, muebleDB.opciones_disponibles);
  console.log(`🔄 [convertirMuebleDB] opciones_disponibles type:`, typeof muebleDB.opciones_disponibles);

  if (muebleDB.opciones_disponibles) {
    if (typeof muebleDB.opciones_disponibles === 'string') {
      try {
        const parsed = JSON.parse(muebleDB.opciones_disponibles);
        console.log(`✅ [convertirMuebleDB] Parseado desde string:`, parsed);
        opcionesDisponibles = parsed;
      } catch (e) {
        console.warn('❌ Error al parsear opciones_disponibles desde string:', e);
      }
    } else if (typeof muebleDB.opciones_disponibles === 'object') {
      console.log(`✅ [convertirMuebleDB] Es objeto, procesando directamente`);
      opcionesDisponibles = {
        colores: Array.isArray(muebleDB.opciones_disponibles.colores) 
          ? muebleDB.opciones_disponibles.colores 
          : (muebleDB.opciones_disponibles.colores ? [muebleDB.opciones_disponibles.colores] : []),
        materiales: Array.isArray(muebleDB.opciones_disponibles.materiales) 
          ? muebleDB.opciones_disponibles.materiales 
          : (muebleDB.opciones_disponibles.materiales ? [muebleDB.opciones_disponibles.materiales] : []),
        encimeras: Array.isArray(muebleDB.opciones_disponibles.encimeras) 
          ? muebleDB.opciones_disponibles.encimeras 
          : (muebleDB.opciones_disponibles.encimeras ? [muebleDB.opciones_disponibles.encimeras] : []),
        canteados: Array.isArray(muebleDB.opciones_disponibles.canteados) 
          ? muebleDB.opciones_disponibles.canteados 
          : (muebleDB.opciones_disponibles.canteados ? [muebleDB.opciones_disponibles.canteados] : []),
        // Preservar opciones_personalizadas si existen
        opciones_personalizadas: muebleDB.opciones_disponibles.opciones_personalizadas || undefined
      };
      console.log(`✅ [convertirMuebleDB] Opciones procesadas:`, opcionesDisponibles);
    } else {
      console.warn(`⚠️ [convertirMuebleDB] opciones_disponibles tiene tipo inesperado:`, typeof muebleDB.opciones_disponibles);
    }
  } else {
    console.warn(`⚠️ [convertirMuebleDB] No hay opciones_disponibles para ${muebleDB.nombre}`);
  }

  // Parsear imagenes_por_variante - asegurar que sea un array válido
  let imagenesPorVariante: Array<{
    color?: string;
    material?: string;
    encimera?: string;
    imagen_url: string;
  }> = [];

  if (muebleDB.imagenes_por_variante) {
    let parsed: any[] = [];
    
    if (typeof muebleDB.imagenes_por_variante === 'string') {
      try {
        parsed = JSON.parse(muebleDB.imagenes_por_variante);
      } catch (e) {
        console.warn('Error al parsear imagenes_por_variante:', e);
      }
    } else if (Array.isArray(muebleDB.imagenes_por_variante)) {
      parsed = muebleDB.imagenes_por_variante;
    }

    // Normalizar: asegurar que cada variante tenga imagen_url (puede venir como 'url' o 'imagen_url')
    imagenesPorVariante = parsed
      .filter((v: any) => v && (v.imagen_url || v.url))
      .map((v: any) => ({
        color: v.color || undefined,
        material: v.material || undefined,
        encimera: v.encimera || undefined,
        imagen_url: v.imagen_url || v.url || ''
      }));
  }

  // Parsear imagenes_adicionales
  let imagenesAdicionales: string[] = [];
  if (muebleDB.imagenes_adicionales) {
    if (typeof muebleDB.imagenes_adicionales === 'string') {
      try {
        const parsed = JSON.parse(muebleDB.imagenes_adicionales);
        imagenesAdicionales = Array.isArray(parsed) 
          ? parsed.map((img: any) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
          : [];
      } catch (e) {
        console.warn('Error al parsear imagenes_adicionales:', e);
      }
    } else if (Array.isArray(muebleDB.imagenes_adicionales)) {
      imagenesAdicionales = muebleDB.imagenes_adicionales.map((img: any) => 
        typeof img === 'string' ? img : img.url
      ).filter(Boolean);
    }
  }

  return {
    id: muebleDB.id,
    nombre: muebleDB.nombre,
    descripcion: muebleDB.descripcion,
    imagen: muebleDB.imagen || '',
    precio_base: Number(muebleDB.precio_base) || 0,
    categoria: muebleDB.categoria,
    medidas: muebleDB.medidas,
    materiales_predeterminados: muebleDB.materiales_predeterminados,
    dias_fabricacion: muebleDB.dias_fabricacion,
    horas_mano_obra: muebleDB.horas_mano_obra,
    margen_ganancia: muebleDB.margen_ganancia,
    opciones_disponibles: opcionesDisponibles,
    imagenes_adicionales: imagenesAdicionales,
    imagenes_por_variante: imagenesPorVariante
  };
}

// Datos de ejemplo (fallback si no hay muebles en Supabase)
const mueblesEjemplo: Mueble[] = [
  {
    id: '1',
    nombre: 'CLÓSET MODULAR',
    descripcion: 'Sistema modular de clóset con múltiples opciones de configuración',
    imagen: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e4?w=600&h=600&fit=crop',
    precio_base: 1800000,
    categoria: 'closet',
    opciones_disponibles: {
      colores: ['Blanco', 'Melanina', 'Marrón', 'Negro', 'Gris'],
      materiales: ['Melamina', 'Madera Sólida', 'MDF'],
      encimeras: [],
      canteados: []
    },
    // Valores predeterminados para cotización
    medidas: {
      ancho: 200,
      alto: 240,
      profundidad: 60,
      unidad: 'cm'
    },
    materiales_predeterminados: [
      {
        material_id: 'mat-melamina-1', // ID de ejemplo
        material_nombre: 'Melamina 18mm',
        cantidad: 8.5,
        unidad: 'm²',
        precio_unitario: 45000
      },
      {
        material_id: 'mat-bisagras-1',
        material_nombre: 'Bisagras cierre suave',
        cantidad: 12,
        unidad: 'unidad',
        precio_unitario: 8500
      },
      {
        material_id: 'mat-guias-1',
        material_nombre: 'Guías para cajones',
        cantidad: 6,
        unidad: 'par',
        precio_unitario: 25000
      }
    ],
    dias_fabricacion: 10,
    horas_mano_obra: 16,
    margen_ganancia: 30
  },
  {
    id: '2',
    nombre: 'COCINA INTEGRAL',
    descripcion: 'Cocina integral moderna con acabados de alta calidad',
    imagen: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=600&fit=crop',
    precio_base: 4500000,
    categoria: 'cocina',
    opciones_disponibles: {
      colores: ['Blanco', 'Negro', 'Gris'],
      materiales: ['Melamina', 'Lacado Brillante', 'Madera Sólida'],
      encimeras: ['Quartz Blanco', 'Mármol Negro', 'Granito'],
      canteados: ['PVC', 'Aluminio']
    },
    medidas: {
      ancho: 300,
      alto: 90,
      profundidad: 60,
      unidad: 'cm'
    },
    materiales_predeterminados: [
      {
        material_id: 'mat-melamina-2',
        material_nombre: 'Melamina 18mm',
        cantidad: 12,
        unidad: 'm²',
        precio_unitario: 45000
      },
      {
        material_id: 'mat-encimera-1',
        material_nombre: 'Quartz Blanco',
        cantidad: 3,
        unidad: 'm²',
        precio_unitario: 250000
      },
      {
        material_id: 'mat-bisagras-2',
        material_nombre: 'Bisagras cierre suave',
        cantidad: 20,
        unidad: 'unidad',
        precio_unitario: 8500
      }
    ],
    dias_fabricacion: 15,
    horas_mano_obra: 24,
    margen_ganancia: 35
  },
  {
    id: '3',
    nombre: 'MUEBLE DE BAÑO',
    descripcion: 'Mueble de baño elegante con espejo y acabados premium',
    imagen: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop',
    precio_base: 1950000,
    categoria: 'bano',
    opciones_disponibles: {
      colores: ['Blanco', 'Marrón', 'Negro'],
      materiales: ['Lacado Brillante', 'Melamina', 'Madera Sólida'],
      encimeras: ['Quartz Blanco', 'Mármol Negro'],
      canteados: ['PVC']
    },
    medidas: {
      ancho: 120,
      alto: 85,
      profundidad: 45,
      unidad: 'cm'
    },
    materiales_predeterminados: [
      {
        material_id: 'mat-lacado-1',
        material_nombre: 'Lacado Brillante',
        cantidad: 2.5,
        unidad: 'm²',
        precio_unitario: 85000
      },
      {
        material_id: 'mat-encimera-2',
        material_nombre: 'Quartz Blanco',
        cantidad: 1.2,
        unidad: 'm²',
        precio_unitario: 250000
      }
    ],
    dias_fabricacion: 8,
    horas_mano_obra: 12,
    margen_ganancia: 30
  },
  {
    id: '4',
    nombre: 'ESTACIÓN SENSORIAL MADERA',
    descripcion: 'Estación sensorial educativa en madera natural',
    imagen: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
    precio_base: 1200000,
    categoria: 'sensorial',
    opciones_disponibles: {
      colores: ['Marrón', 'Blanco'],
      materiales: ['Madera Sólida', 'MDF'],
      encimeras: [],
      canteados: []
    }
  }
];

/**
 * Obtiene todos los muebles del catálogo desde Supabase
 */
export async function obtenerMuebles(): Promise<Mueble[]> {
  try {
    const { data, error } = await supabase
      .from('muebles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener muebles:', error);
      // Si hay error, retornar datos de ejemplo como fallback
      return mueblesEjemplo;
    }

    // Si hay datos, convertir y retornar
    if (data && data.length > 0) {
      const mueblesConvertidos = data.map(convertirMuebleDB);
      // Log para depuración
      console.log('Muebles obtenidos desde Supabase:', mueblesConvertidos.length);
      mueblesConvertidos.forEach(m => {
        console.log(`- ${m.nombre}:`, {
          imagen: m.imagen,
          colores: m.opciones_disponibles?.colores?.length || 0,
          imagenes_variante: m.imagenes_por_variante?.length || 0
        });
      });
      return mueblesConvertidos;
    }

    // Si no hay datos, retornar ejemplos
    return mueblesEjemplo;
  } catch (error) {
    console.error('Error en obtenerMuebles:', error);
    return mueblesEjemplo;
  }
}

/**
 * Obtiene un mueble por ID desde Supabase
 */
export async function obtenerMueblePorId(id: string): Promise<Mueble | null> {
  try {
    const { data, error } = await supabase
      .from('muebles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener mueble:', error);
      // Fallback a datos de ejemplo
      return mueblesEjemplo.find(m => m.id === id) || null;
    }

    return data ? convertirMuebleDB(data) : null;
  } catch (error) {
    console.error('Error en obtenerMueblePorId:', error);
    return mueblesEjemplo.find(m => m.id === id) || null;
  }
}

/**
 * Obtiene muebles por categoría desde Supabase
 */
export async function obtenerMueblesPorCategoria(categoria: Mueble['categoria']): Promise<Mueble[]> {
  try {
    console.log(`🔍 [muebles.service] Obteniendo muebles de categoría: ${categoria}`);
    
    const { data, error } = await supabase
      .from('muebles')
      .select('*')
      .eq('categoria', categoria)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al obtener muebles por categoría:', error);
      return mueblesEjemplo.filter(m => m.categoria === categoria);
    }

    if (!data || data.length === 0) {
      console.log(`⚠️ [muebles.service] No se encontraron muebles de categoría ${categoria}`);
      return mueblesEjemplo.filter(m => m.categoria === categoria);
    }

    console.log(`✅ [muebles.service] Se encontraron ${data.length} muebles de categoría ${categoria}`);
    
    // Log detallado de los datos crudos antes de convertir
    data.forEach((muebleDB, index) => {
      console.log(`📦 [muebles.service] Mueble ${index + 1}:`, {
        id: muebleDB.id,
        nombre: muebleDB.nombre,
        categoria: muebleDB.categoria,
        opciones_disponibles_raw: muebleDB.opciones_disponibles,
        opciones_disponibles_type: typeof muebleDB.opciones_disponibles,
        tiene_colores: Array.isArray(muebleDB.opciones_disponibles?.colores),
        colores_count: Array.isArray(muebleDB.opciones_disponibles?.colores) 
          ? muebleDB.opciones_disponibles.colores.length 
          : 0,
        tiene_materiales: Array.isArray(muebleDB.opciones_disponibles?.materiales),
        materiales_count: Array.isArray(muebleDB.opciones_disponibles?.materiales) 
          ? muebleDB.opciones_disponibles.materiales.length 
          : 0
      });
    });

    const mueblesConvertidos = data.map(convertirMuebleDB);
    
    // Log después de convertir
    mueblesConvertidos.forEach((mueble, index) => {
      console.log(`✨ [muebles.service] Mueble convertido ${index + 1}:`, {
        id: mueble.id,
        nombre: mueble.nombre,
        colores: mueble.opciones_disponibles?.colores?.length || 0,
        materiales: mueble.opciones_disponibles?.materiales?.length || 0,
        encimeras: mueble.opciones_disponibles?.encimeras?.length || 0,
        canteados: mueble.opciones_disponibles?.canteados?.length || 0,
        valores_colores: mueble.opciones_disponibles?.colores || [],
        valores_materiales: mueble.opciones_disponibles?.materiales || []
      });
    });

    return mueblesConvertidos;
  } catch (error) {
    console.error('❌ Error en obtenerMueblesPorCategoria:', error);
    return mueblesEjemplo.filter(m => m.categoria === categoria);
  }
}


