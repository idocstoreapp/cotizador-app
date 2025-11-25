/**
 * Servicio para gestión de muebles del catálogo (solo para admins)
 * CRUD completo de muebles
 */
import { supabase } from '../utils/supabase';
import type { Mueble } from '../types/muebles';
import { subirImagen, subirImagenes } from './storage.service';

// Tipo para mueble en la base de datos (con campos JSONB)
export interface MuebleDB {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen: string;
  precio_base: number;
  categoria: 'closet' | 'cocina' | 'bano' | 'sensorial' | 'otros';
  medidas?: any; // JSONB
  materiales_predeterminados?: any; // JSONB array
  servicios_predeterminados?: any; // JSONB array
  opciones_disponibles?: any; // JSONB
  imagenes_adicionales?: any; // JSONB array
  imagenes_por_variante?: any; // JSONB array
  dias_fabricacion?: number;
  horas_mano_obra?: number;
  margen_ganancia?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Tipo para crear/actualizar mueble
export interface MuebleInput {
  nombre: string;
  descripcion?: string;
  imagen?: File | string; // File si es nueva, string si es URL existente
  precio_base: number;
  categoria: 'closet' | 'cocina' | 'bano' | 'sensorial' | 'otros';
  medidas?: {
    ancho?: number;
    alto?: number;
    profundidad?: number;
    unidad?: string;
  };
  materiales_predeterminados?: Array<{
    material_id: string;
    material_nombre?: string;
    cantidad: number;
    unidad: string;
    precio_unitario?: number;
  }>;
  servicios_predeterminados?: Array<{
    servicio_id: string;
    servicio_nombre?: string;
    horas: number;
    precio_por_hora: number;
  }>;
  opciones_disponibles?: {
    colores: string[];
    materiales: string[];
    encimeras?: string[];
    canteados?: string[];
  };
  imagenes_adicionales?: Array<{
    url: string;
    color: string;
    descripcion?: string;
  }>;
  imagenes_por_variante?: Array<{
    color?: string;
    material?: string;
    encimera?: string;
    imagen_url: string;
  }>;
  dias_fabricacion?: number;
  horas_mano_obra?: number;
  margen_ganancia?: number;
}

/**
 * Convierte un MuebleDB a Mueble
 */
function convertirMuebleDB(muebleDB: MuebleDB): Mueble {
  return {
    id: muebleDB.id,
    nombre: muebleDB.nombre,
    descripcion: muebleDB.descripcion,
    imagen: muebleDB.imagen,
    precio_base: muebleDB.precio_base,
    categoria: muebleDB.categoria,
    medidas: muebleDB.medidas,
    materiales_predeterminados: muebleDB.materiales_predeterminados,
    dias_fabricacion: muebleDB.dias_fabricacion,
    horas_mano_obra: muebleDB.horas_mano_obra,
    margen_ganancia: muebleDB.margen_ganancia,
    opciones_disponibles: {
      ...(muebleDB.opciones_disponibles || {
        colores: [],
        materiales: [],
        encimeras: [],
        canteados: []
      }),
      // Preservar opciones_personalizadas si existen
      opciones_personalizadas: (muebleDB.opciones_disponibles as any)?.opciones_personalizadas || undefined
    },
    imagenes_adicionales: muebleDB.imagenes_adicionales?.map((img: any) => img.url) || [],
    imagenes_por_variante: muebleDB.imagenes_por_variante || []
  };
}

/**
 * Obtiene todos los muebles del catálogo
 */
export async function obtenerMueblesAdmin(): Promise<Mueble[]> {
  const { data, error } = await supabase
    .from('muebles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(convertirMuebleDB);
}

/**
 * Obtiene un mueble por ID
 */
export async function obtenerMueblePorIdAdmin(id: string): Promise<Mueble | null> {
  const { data, error } = await supabase
    .from('muebles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? convertirMuebleDB(data) : null;
}

/**
 * Crea un nuevo mueble en el catálogo
 */
export async function crearMuebleAdmin(muebleInput: MuebleInput): Promise<Mueble> {
  // Subir imagen principal si es un archivo
  let imagenUrl = muebleInput.imagen as string;
  if (muebleInput.imagen instanceof File) {
    imagenUrl = await subirImagen(muebleInput.imagen);
  }

  // Preparar datos para insertar
  const muebleData: any = {
    nombre: muebleInput.nombre,
    descripcion: muebleInput.descripcion,
    imagen: imagenUrl,
    precio_base: muebleInput.precio_base,
    categoria: muebleInput.categoria,
    medidas: muebleInput.medidas || null,
    materiales_predeterminados: muebleInput.materiales_predeterminados || [],
    servicios_predeterminados: muebleInput.servicios_predeterminados || [],
    opciones_disponibles: muebleInput.opciones_disponibles || {
      colores: [],
      materiales: [],
      encimeras: [],
      canteados: []
    },
    imagenes_adicionales: muebleInput.imagenes_adicionales || [],
    imagenes_por_variante: muebleInput.imagenes_por_variante || [],
    dias_fabricacion: muebleInput.dias_fabricacion || 0,
    horas_mano_obra: muebleInput.horas_mano_obra || 0,
    margen_ganancia: muebleInput.margen_ganancia || 30
  };

  const { data, error } = await supabase
    .from('muebles')
    .insert(muebleData)
    .select()
    .single();

  if (error) throw error;
  return convertirMuebleDB(data);
}

/**
 * Actualiza un mueble existente
 */
export async function actualizarMuebleAdmin(
  id: string,
  muebleInput: Partial<MuebleInput>
): Promise<Mueble> {
  // Si hay una nueva imagen, subirla
  const updateData: any = { ...muebleInput };
  
  if (muebleInput.imagen instanceof File) {
    updateData.imagen = await subirImagen(muebleInput.imagen);
  } else if (typeof muebleInput.imagen === 'string') {
    updateData.imagen = muebleInput.imagen;
  } else {
    delete updateData.imagen; // No actualizar imagen si no se proporciona
  }

  // Convertir arrays a JSONB si existen
  if (updateData.materiales_predeterminados) {
    updateData.materiales_predeterminados = updateData.materiales_predeterminados;
  }
  if (updateData.servicios_predeterminados) {
    updateData.servicios_predeterminados = updateData.servicios_predeterminados;
  }
  if (updateData.imagenes_adicionales) {
    updateData.imagenes_adicionales = updateData.imagenes_adicionales;
  }
  if (updateData.imagenes_por_variante) {
    updateData.imagenes_por_variante = updateData.imagenes_por_variante;
  }
  if (updateData.opciones_disponibles) {
    updateData.opciones_disponibles = updateData.opciones_disponibles;
  }

  const { data, error } = await supabase
    .from('muebles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return convertirMuebleDB(data);
}

/**
 * Elimina un mueble del catálogo
 */
export async function eliminarMuebleAdmin(id: string): Promise<void> {
  // Obtener el mueble primero para eliminar sus imágenes
  const mueble = await obtenerMueblePorIdAdmin(id);
  
  if (mueble) {
    // TODO: Eliminar imágenes del storage si es necesario
    // Por ahora solo eliminamos el registro
  }

  const { error } = await supabase
    .from('muebles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}


