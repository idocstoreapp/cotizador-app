/**
 * Convierte una imagen a base64 para usar en PDFs generados con Puppeteer
 * Esto es necesario porque las rutas relativas no funcionan en el servidor
 */

/**
 * Convierte una URL de imagen a base64
 * @param imagePath - Ruta de la imagen (relativa o absoluta)
 * @returns Promise con el base64 de la imagen o null si falla
 */
export async function convertirLogoABase64(imagePath: string): Promise<string | null> {
  try {
    // Si ya es base64, retornarlo
    if (imagePath.startsWith('data:image')) {
      return imagePath;
    }

    // Si estamos en el servidor (Node.js), leer desde el sistema de archivos o fetch
    if (typeof window === 'undefined') {
      try {
        // Intentar leer desde el sistema de archivos primero (más rápido y confiable)
        const fs = await import('fs');
        const path = await import('path');
        
        // Si es una ruta relativa, intentar leer desde public
        if (imagePath.startsWith('/images/')) {
          const publicPath = path.join(process.cwd(), 'public', imagePath);
          if (fs.existsSync(publicPath)) {
            const imageBuffer = fs.readFileSync(publicPath);
            const base64 = imageBuffer.toString('base64');
            const ext = path.extname(publicPath).slice(1).toLowerCase();
            const contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
            return `data:${contentType};base64,${base64}`;
          }
        }
        
        // Si no se encontró en el sistema de archivos, intentar fetch
        let url = imagePath;
        if (imagePath.startsWith('/')) {
          // En producción (Vercel), usar la URL completa del sitio
          const baseUrl = 
            process.env.PUBLIC_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
            (process.env.VERCEL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}` : null) ||
            'http://localhost:4321';
          url = `${baseUrl}${imagePath}`;
          console.log(`🔗 Intentando cargar logo desde: ${url}`);
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`❌ Error al cargar imagen: ${url}`, response.status, response.statusText);
          // Intentar con URL absoluta si es una ruta relativa
          if (imagePath.startsWith('/images/')) {
            const fallbackUrl = `https://cotizador-app-two.vercel.app${imagePath}`;
            console.log(`🔄 Intentando URL alternativa: ${fallbackUrl}`);
            const fallbackResponse = await fetch(fallbackUrl);
            if (fallbackResponse.ok) {
              const arrayBuffer = await fallbackResponse.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const base64 = buffer.toString('base64');
              const contentType = fallbackResponse.headers.get('content-type') || 'image/png';
              return `data:${contentType};base64,${base64}`;
            }
          }
          return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        return `data:${contentType};base64,${base64}`;
      } catch (error) {
        console.error('Error al leer imagen del sistema de archivos:', error);
        return null;
      }
    }

    // Si estamos en el cliente, usar canvas (no recomendado para producción)
    return null;
  } catch (error) {
    console.error('Error al convertir logo a base64:', error);
    return null;
  }
}

/**
 * Convierte múltiples logos a base64
 */
export async function convertirLogosABase64(logos: string[]): Promise<Record<string, string | null>> {
  const resultados: Record<string, string | null> = {};
  
  await Promise.all(
    logos.map(async (logo) => {
      resultados[logo] = await convertirLogoABase64(logo);
    })
  );
  
  return resultados;
}

