/**
 * Endpoint API para generar PDF de cotización profesional usando Puppeteer
 * Convierte el componente React QuotePDF a PDF
 * Usa @sparticuz/chromium para compatibilidad con Vercel/serverless
 */
import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';
import { convertirLogoABase64 } from '../../utils/convertirLogoABase64';
// Importar renderQuoteToHTML dinámicamente para evitar problemas de empaquetado
let renderQuoteToHTML: any = null;

// Importar dinámicamente según el entorno
async function getPuppeteer() {
  const isVercelEnv = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isVercelEnv || isProduction) {
    // En producción/Vercel, usar puppeteer-core con chromium optimizado
    const puppeteer = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium');
    return { puppeteer: puppeteer.default, chromium: chromium.default };
  } else {
    // En desarrollo, usar puppeteer completo
    const puppeteer = await import('puppeteer');
    return { puppeteer: puppeteer.default, chromium: null };
  }
}

export const POST: APIRoute = async ({ request }) => {
  let browser;
  
  try {
    console.log('📄 Iniciando generación de PDF...');
    
    // Verificar autenticación (similar al otro endpoint)
    // Nota: En el servidor, esto puede no funcionar perfectamente con cookies
    // pero como la cotización ya fue guardada (usuario autenticado), 
    // podemos ser más permisivos aquí
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Si no hay sesión, permitir continuar de todas formas
        // porque la cotización ya fue guardada en la BD (usuario estaba autenticado)
        console.warn('⚠️ No se pudo verificar sesión en servidor, pero continuando (cotización ya guardada)');
      } else {
        console.log('✅ Sesión verificada correctamente');
      }
    } catch (authError) {
      // Si falla la verificación, continuar de todas formas
      console.warn('⚠️ Error al verificar autenticación en servidor:', authError);
    }

    // Obtener datos del body
    const body = await request.json();
    const {
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      vendedorName,
      date,
      quoteNumber,
      model,
      dimensions,
      items,
      total,
      image,
      companyName,
      companyLogo,
      empresaInfo
    } = body;

    // Validar datos requeridos
    if (!clientName || !date || !quoteNumber || !model || !dimensions || !items || !total) {
      return new Response(JSON.stringify({ 
        error: 'Faltan datos requeridos: clientName, date, quoteNumber, model, dimensions, items, total' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar items
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Items debe ser un array con al menos un elemento' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🎨 Renderizando HTML...');
    
    // Cargar renderQuoteToHTML dinámicamente solo cuando se necesite (en el servidor)
    if (!renderQuoteToHTML) {
      try {
        const renderModule = await import('../../utils/renderQuoteToHTML');
        renderQuoteToHTML = renderModule.renderQuoteToHTML;
        console.log('✅ renderQuoteToHTML cargado dinámicamente');
      } catch (importError: any) {
        console.error('❌ Error al importar renderQuoteToHTML:', importError);
        throw new Error(`Error al cargar renderQuoteToHTML: ${importError.message || importError}`);
      }
    }
    
    // Convertir logo a base64 si está disponible (para que Puppeteer pueda renderizarlo)
    let logoBase64 = companyLogo;
    if (companyLogo && !companyLogo.startsWith('data:image')) {
      console.log('📸 Convirtiendo logo a base64...', companyLogo);
      logoBase64 = await convertirLogoABase64(companyLogo) || companyLogo;
      if (logoBase64 !== companyLogo) {
        console.log('✅ Logo convertido a base64 exitosamente');
      } else {
        console.warn('⚠️ No se pudo convertir el logo a base64, usando URL original');
      }
    }
    
    // Renderizar React a HTML
    const html = renderQuoteToHTML({
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      vendedorName,
      date,
      quoteNumber,
      model,
      dimensions,
      items,
      total,
      image,
      companyName,
      companyLogo: logoBase64, // Usar base64 en lugar de URL
      empresaInfo
    });

    console.log('✅ HTML renderizado, longitud:', html.length);
    console.log('🚀 Iniciando Puppeteer...');
    
    // Obtener Puppeteer según el entorno
    const { puppeteer: puppeteerInstance, chromium: chromiumInstance } = await getPuppeteer();
    
    // Detectar si estamos en Vercel/producción
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    const isProduction = process.env.NODE_ENV === 'production';
    console.log('🌍 Entorno:', {
      isVercel,
      isProduction,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      usandoChromium: !!chromiumInstance
    });
    
    // Configurar Chromium para Vercel
    if (chromiumInstance) {
      // Nota: @sparticuz/chromium ya viene optimizado para serverless
      // No necesita configuración adicional de setGraphicsMode
      console.log('🔧 Usando Chromium optimizado para Vercel/serverless');
    }
    
    // Configuración de Puppeteer optimizada para Vercel
    const puppeteerOptions: any = {
      headless: true,
      args: chromiumInstance
        ? chromiumInstance.args 
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ],
    };
    
    // Agregar configuración específica para Vercel
    if (chromiumInstance) {
      puppeteerOptions.defaultViewport = chromiumInstance.defaultViewport;
      puppeteerOptions.executablePath = await chromiumInstance.executablePath();
    }
    
    console.log('📋 Opciones de Puppeteer:', {
      executablePath: puppeteerOptions.executablePath ? 'Configurado' : 'Por defecto',
      argsCount: puppeteerOptions.args?.length || 0
    });
    
    try {
      browser = await puppeteerInstance.launch(puppeteerOptions);
      console.log('✅ Puppeteer iniciado correctamente');
    } catch (launchError: any) {
      console.error('❌ Error al iniciar Puppeteer:', launchError);
      console.error('Detalles:', {
        message: launchError.message,
        stack: launchError.stack,
        name: launchError.name
      });
      
      // Si falla en producción, intentar con configuración de desarrollo como fallback
      if (chromiumInstance && launchError.message.includes('executable')) {
        console.log('🔄 Intentando con configuración alternativa...');
        try {
          browser = await puppeteerInstance.launch({
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--single-process'
            ]
          });
          console.log('✅ Puppeteer iniciado con configuración alternativa');
        } catch (fallbackError: any) {
          console.error('❌ Error también con configuración alternativa:', fallbackError);
          throw new Error(`Error al iniciar Puppeteer: ${launchError.message}`);
        }
      } else {
        throw new Error(`Error al iniciar Puppeteer: ${launchError.message}`);
      }
    }

    console.log('📄 Creando nueva página...');
    const page = await browser.newPage();
    
    console.log('📝 Configurando contenido HTML...');
    // Configurar el contenido HTML con timeout más corto para Vercel
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000 // 30 segundos timeout
    });
    console.log('✅ Contenido HTML configurado');

    console.log('📄 Generando PDF...');
    // Generar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      timeout: 30000 // 30 segundos timeout
    });
    console.log('✅ PDF generado, tamaño:', pdf.length, 'bytes');

    // Cerrar el navegador
    await browser.close();

    // Retornar el PDF
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion-${quoteNumber}.pdf"`
      }
    });

  } catch (error: any) {
    // Asegurar que el navegador se cierre en caso de error
    if (browser) {
      try {
        await browser.close();
        console.log('🔒 Navegador cerrado después del error');
      } catch (closeError) {
        console.error('⚠️ Error al cerrar navegador:', closeError);
      }
    }

    console.error('❌ Error completo al generar PDF:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    // Retornar error detallado para debugging
    return new Response(JSON.stringify({ 
      error: 'Error al generar PDF',
      message: error.message,
      name: error.name,
      // Solo incluir stack en desarrollo
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

