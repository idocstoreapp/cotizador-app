/**
 * Servicio para gestión de materiales
 * CRUD completo de materiales
 */
import { supabase } from '../utils/supabase';
import type { Material, MaterialInput } from '../types/database';
import type { MaterialInput as MaterialSchemaInput } from '../schemas/validations';

/**
 * Obtiene todos los materiales
 * @returns Lista de materiales
 */
export async function obtenerMateriales(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materiales')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data as Material[];
}

/**
 * Obtiene un material por ID
 * @param id - ID del material
 * @returns Material o null
 */
export async function obtenerMaterialPorId(id: string): Promise<Material | null> {
  const { data, error } = await supabase
    .from('materiales')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Material | null;
}

/**
 * Crea un nuevo material
 * @param material - Datos del material
 * @returns Material creado
 */
export async function crearMaterial(material: MaterialSchemaInput): Promise<Material> {
  const { data, error } = await supabase
    .from('materiales')
    .insert({
      ...material,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data as Material;
}

/**
 * Actualiza un material existente
 * @param id - ID del material
 * @param material - Datos actualizados
 * @returns Material actualizado
 */
export async function actualizarMaterial(
  id: string,
  material: Partial<MaterialSchemaInput>
): Promise<Material> {
  const { data, error } = await supabase
    .from('materiales')
    .update({
      ...material,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Material;
}

/**
 * Elimina un material
 * @param id - ID del material
 */
export async function eliminarMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from('materiales')
    .delete()
    .eq('id', id);

  if (error) throw error;
}


