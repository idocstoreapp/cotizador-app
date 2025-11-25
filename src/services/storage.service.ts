/**
 * Servicio para gestión de archivos en Supabase Storage
 */
import { supabase } from '../utils/supabase';

const BUCKET_NAME = 'muebles-imagenes';

/**
 * Sube una imagen al storage de Supabase
 * @param file - Archivo de imagen
 * @param folder - Carpeta donde guardar (opcional)
 * @returns URL pública de la imagen subida
 */
export async function subirImagen(
  file: File,
  folder: string = 'muebles'
): Promise<string> {
  try {
    // Intentar listar buckets para verificar (pero no fallar si no tenemos permisos)
    let bucketExists = false;
    let bucketsList: string[] = [];
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (!bucketsError && buckets) {
        bucketsList = buckets.map(b => b.name);
        bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
        console.log('📦 Buckets disponibles:', bucketsList);
        console.log(`🔍 Buscando bucket "${BUCKET_NAME}":`, bucketExists ? '✅ Encontrado' : '❌ No encontrado');
      } else {
        console.warn('⚠️ No se pudo listar buckets (puede ser un problema de permisos):', bucketsError);
        // Continuar de todas formas, intentaremos subir directamente
      }
    } catch (listError) {
      console.warn('⚠️ Error al listar buckets, continuando de todas formas:', listError);
      // Continuar de todas formas
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    console.log(`📤 Intentando subir archivo a bucket "${BUCKET_NAME}":`, fileName);

    // Intentar subir archivo directamente
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error al subir imagen:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        statusCode: (error as any).statusCode,
        error: (error as any).error
      });
      
      // Mensaje de error más descriptivo y útil
      if (error.message?.includes('Bucket not found') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('not found') ||
          (error as any).statusCode === 404) {
        
        const mensajeDetallado = `❌ El bucket "${BUCKET_NAME}" no existe o no tienes acceso.\n\n` +
          `📋 PASOS PARA SOLUCIONAR:\n\n` +
          `1. Ve a Supabase Dashboard: https://app.supabase.com\n` +
          `2. Selecciona tu proyecto\n` +
          `3. Ve a "Storage" en el menú lateral\n` +
          `4. Verifica que existe un bucket llamado exactamente "${BUCKET_NAME}"\n` +
          `5. Si no existe, créalo:\n` +
          `   - Haz clic en "New bucket"\n` +
          `   - Nombre: ${BUCKET_NAME}\n` +
          `   - Marca "Public bucket" ✅\n` +
          `   - Haz clic en "Create bucket"\n\n` +
          `🔍 Buckets encontrados: ${bucketsList.length > 0 ? bucketsList.join(', ') : 'No se pudieron listar'}\n\n` +
          `📄 Ver CREAR-BUCKET-STORAGE.md para más detalles.`;
        
        throw new Error(mensajeDetallado);
      }
      
      // Otros errores
      throw new Error(`Error al subir imagen: ${error.message || 'Error desconocido'}`);
    }

    console.log('✅ Archivo subido exitosamente:', fileName);

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('🔗 URL pública generada:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ Error completo en subirImagen:', error);
    throw error;
  }
}

/**
 * Sube múltiples imágenes
 * @param files - Array de archivos
 * @param folder - Carpeta donde guardar
 * @returns Array de URLs públicas
 */
export async function subirImagenes(
  files: File[],
  folder: string = 'muebles'
): Promise<string[]> {
  const uploadPromises = files.map(file => subirImagen(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Elimina una imagen del storage
 * @param url - URL de la imagen a eliminar
 */
export async function eliminarImagen(url: string): Promise<void> {
  try {
    // Extraer el path del archivo desde la URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folder = pathParts[pathParts.length - 2];
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error al eliminar imagen:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error en eliminarImagen:', error);
    throw error;
  }
}

/**
 * Valida que un archivo sea una imagen
 * @param file - Archivo a validar
 * @returns true si es una imagen válida
 */
export function validarImagen(file: File): boolean {
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const tamañoMaximo = 5 * 1024 * 1024; // 5MB

  if (!tiposPermitidos.includes(file.type)) {
    return false;
  }

  if (file.size > tamañoMaximo) {
    return false;
  }

  return true;
}

