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
    // Llamar al endpoint API con credenciales para enviar cookies
    const response = await fetch('/api/generate-quote-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Incluir cookies en la petición
      body: JSON.stringify(data)
    });

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      let errorDetails: any = {};
      
      try {
        // Intentar obtener el error como JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = errorData;
        } else {
          // Si no es JSON, intentar leer como texto
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch (parseError) {
        console.error('Error al parsear respuesta de error:', parseError);
      }
      
      console.error('❌ Error del servidor al generar PDF:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        details: errorDetails
      });
      
      throw new Error(errorMessage);
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
    console.error('❌ Error completo al descargar PDF:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
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
      credentials: 'include', // Incluir cookies en la petición
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      let errorDetails: any = {};
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = errorData;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch (parseError) {
        console.error('Error al parsear respuesta de error:', parseError);
      }
      
      console.error('❌ Error del servidor al generar PDF:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        details: errorDetails
      });
      
      throw new Error(errorMessage);
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

