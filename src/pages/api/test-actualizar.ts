/**
 * Endpoint de prueba para verificar que las rutas API funcionan
 */
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Endpoint funcionando',
        data: body 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};



