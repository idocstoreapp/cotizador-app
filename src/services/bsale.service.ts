/**
 * Servicio para integrar con la API de Bsale
 * Documentación: https://docs.bsale.dev/documentos-de-terceros
 */
import type { APIRoute } from 'astro';

interface BsaleConfig {
  accessToken: string;
  baseUrl?: string;
}

interface BsaleThirdPartyDocument {
  id: number;
  number: number;
  codeSii: string;
  emissionDate: number;
  totalAmount: number;
  clientCode?: string;
  clientActivity?: string;
  urlPdf?: string;
  urlXml?: string;
  // ... otros campos según la documentación
}

interface BsaleApiResponse<T> {
  href?: string;
  count?: number;
  items?: T[];
  [key: string]: any;
}

/**
 * Obtiene la configuración de Bsale desde variables de entorno
 * En el servidor (API routes), usa import.meta.env
 * En el cliente, usa import.meta.env.PUBLIC_*
 */
function getBsaleConfig(): BsaleConfig | null {
  // Intentar obtener el token desde variables de entorno
  // En Astro, las variables sin PUBLIC_ solo están disponibles en el servidor
  const accessToken = 
    (typeof process !== 'undefined' && process.env?.BSALE_ACCESS_TOKEN) ||
    import.meta.env.BSALE_ACCESS_TOKEN ||
    import.meta.env.PUBLIC_BSALE_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.warn('⚠️ BSALE_ACCESS_TOKEN no configurado en variables de entorno');
    return null;
  }

  const baseUrl = 
    (typeof process !== 'undefined' && process.env?.BSALE_BASE_URL) ||
    import.meta.env.BSALE_BASE_URL ||
    import.meta.env.PUBLIC_BSALE_BASE_URL ||
    'https://api.bsale.io/v1';

  return {
    accessToken,
    baseUrl
  };
}

/**
 * Realiza una petición autenticada a la API de Bsale
 */
async function bsaleRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getBsaleConfig();
  
  if (!config) {
    throw new Error('Bsale no está configurado. Configura BSALE_ACCESS_TOKEN en las variables de entorno.');
  }

  const url = `${config.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': config.accessToken,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en API Bsale (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Busca un documento de terceros en Bsale por número de factura
 * @param numeroFactura Número de factura a buscar (ej: "20925")
 * @returns Documento encontrado o null si no existe
 */
export async function buscarDocumentoPorNumero(
  numeroFactura: string | number
): Promise<BsaleThirdPartyDocument | null> {
  try {
    const numero = typeof numeroFactura === 'string' ? parseInt(numeroFactura, 10) : numeroFactura;
    
    if (isNaN(numero)) {
      console.warn(`⚠️ Número de factura inválido: ${numeroFactura}`);
      return null;
    }

    // Buscar por número de folio
    const response = await bsaleRequest<BsaleApiResponse<BsaleThirdPartyDocument>>(
      `/third_party_documents.json?number=${numero}&limit=1`
    );

    // La API puede devolver un objeto con 'items' o directamente el documento
    if (response.items && response.items.length > 0) {
      return response.items[0];
    }

    // Si no hay items, puede que el documento esté en la respuesta directa
    if (response.id && response.number === numero) {
      return response as BsaleThirdPartyDocument;
    }

    return null;
  } catch (error: any) {
    console.error(`❌ Error al buscar documento ${numeroFactura} en Bsale:`, error.message);
    return null;
  }
}

/**
 * Obtiene un documento de terceros por su ID en Bsale
 * @param documentId ID del documento en Bsale (ej: 34758)
 * @returns Documento encontrado o null si no existe
 */
export async function obtenerDocumentoPorId(
  documentId: number
): Promise<BsaleThirdPartyDocument | null> {
  try {
    const response = await bsaleRequest<BsaleThirdPartyDocument>(
      `/third_party_documents/${documentId}.json`
    );

    return response;
  } catch (error: any) {
    console.error(`❌ Error al obtener documento ${documentId} de Bsale:`, error.message);
    return null;
  }
}

/**
 * Genera la URL del documento en Bsale
 * @param documentId ID del documento en Bsale
 * @returns URL completa del documento
 */
export function generarUrlBsale(documentId: number): string {
  return `https://www.bsale.cl/document/${documentId}`;
}

/**
 * Sincroniza una factura con Bsale buscando por número de factura
 * @param numeroFactura Número de factura a sincronizar
 * @returns ID del documento en Bsale o null si no se encontró
 */
export async function sincronizarFacturaConBsale(
  numeroFactura: string | number
): Promise<number | null> {
  const documento = await buscarDocumentoPorNumero(numeroFactura);
  
  if (documento) {
    return documento.id;
  }

  return null;
}

