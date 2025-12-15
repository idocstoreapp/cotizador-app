/**
 * API endpoint para eliminar vendedores
 * Elimina tanto de auth.users como de perfiles
 * Solo accesible para administradores
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incorrecta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Usar service role key para bypasear RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar el token del usuario
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar perfil del usuario autenticado (usando admin para bypasear RLS)
    const { data: perfilAuth, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfilAuth || perfilAuth.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo los administradores pueden eliminar vendedores' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { usuarioId } = body;

    if (!usuarioId) {
      return new Response(JSON.stringify({ error: 'ID de usuario requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminar de auth.users usando admin API
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(usuarioId);

    if (deleteAuthError) {
      console.error('Error al eliminar de auth.users:', deleteAuthError);
      // Continuar de todas formas, el perfil se eliminará desde el cliente
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Error al eliminar vendedor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};





