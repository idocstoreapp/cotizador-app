/**
 * Utilidades para generar y descargar PDFs de cotización
 */

interface QuoteItem {
  concepto: string;
  precio: number;
}

interface QuotePDFData {
  clientName: string;
  date: string;
  quoteNumber: string;
  model: string;
  dimensions: string;
  items: QuoteItem[];
  total: number;
  image?: string;
  companyName?: string;
  companyLogo?: string;
}

/**
 * Descarga el PDF de cotización desde el servidor
 * @param data - Datos de la cotización
 * @returns Promise que se resuelve cuando el PDF se descarga
 */
export async function downloadQuotePDF(data: QuotePDFData): Promise<void> {
  try {
    // Llamar al endpoint API
    const response = await fetch('/api/generate-quote-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    // Obtener el blob del PDF
    const blob = await response.blob();

    // Crear URL temporal para el blob
    const url = window.URL.createObjectURL(blob);

    // Crear elemento <a> para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = `cotizacion-${data.quoteNumber}.pdf`;
    
    // Agregar al DOM, hacer click y remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar la URL temporal
    window.URL.revokeObjectURL(url);

  } catch (error: any) {
    console.error('Error al descargar PDF:', error);
    throw error;
  }
}

/**
 * Genera el PDF y lo abre en una nueva ventana
 * @param data - Datos de la cotización
 */
export async function openQuotePDF(data: QuotePDFData): Promise<void> {
  try {
    const response = await fetch('/api/generate-quote-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Abrir en nueva ventana
    window.open(url, '_blank');
    
    // Liberar la URL después de un tiempo
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);

  } catch (error: any) {
    console.error('Error al abrir PDF:', error);
    throw error;
  }
}

