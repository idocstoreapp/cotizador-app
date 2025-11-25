/**
 * Endpoint API para generar PDF de cotización profesional usando Puppeteer
 * Convierte el componente React QuotePDF a PDF
 */
import type { APIRoute } from 'astro';
import puppeteer from 'puppeteer';
import { renderQuoteToHTML } from '../../utils/renderQuoteToHTML';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// Crear cliente de Supabase para el servidor con cookies del request
function getSupabaseClient(request: Request) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  
  // Obtener cookies del request
  const cookies = request.headers.get('cookie') || '';
  
  // Crear cliente con cookies
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        cookie: cookies
      }
    }
  });
  
  return supabase;
}

export const POST: APIRoute = async ({ request }) => {
  let browser;
  
  try {
    // Crear cliente de Supabase con cookies del request
    const supabase = getSupabaseClient(request);
    
    // Verificar autenticación desde las cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Obtener perfil del usuario
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (perfilError || !perfil) {
      return new Response(JSON.stringify({ error: 'No se pudo obtener el perfil del usuario' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del body
    const body = await request.json();
    const {
      clientName,
      date,
      quoteNumber,
      model,
      dimensions,
      items,
      total,
      image,
      companyName,
      companyLogo
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

    // Renderizar React a HTML
    const html = renderQuoteToHTML({
      clientName,
      date,
      quoteNumber,
      model,
      dimensions,
      items,
      total,
      image,
      companyName,
      companyLogo
    });

    // Iniciar Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Configurar el contenido HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

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
      await browser.close();
    }

    console.error('Error al generar PDF:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Error al generar PDF',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

