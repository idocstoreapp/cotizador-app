/**
 * API endpoint para crear trabajadores de taller
 * Solo accesible para administradores
 * Los trabajadores de taller NO tienen usuario de autenticación
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

export const POST: APIRoute = async ({ request }) => {
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
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incorrecta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar perfil del usuario autenticado
    const { data: perfilAuth, error: perfilError } = await supabaseClient
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfilAuth || perfilAuth.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo los administradores pueden crear trabajadores de taller' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { nombre, apellido, especialidad } = body;

    if (!nombre || !apellido) {
      return new Response(JSON.stringify({ error: 'Nombre y apellido son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incorrecta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Crear perfil del trabajador de taller
    // Generar UUID manualmente ya que no tiene usuario de auth
    const nuevoId = randomUUID();

    // Crear perfil del trabajador de taller usando consulta SQL directa
    // para poder especificar el ID manualmente
    const { data: perfilNuevo, error: profileError } = await supabaseAdmin
      .from('perfiles')
      .insert({
        id: nuevoId,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        role: 'trabajador_taller',
        especialidad: especialidad?.trim() || null
      })
      .select()
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ usuario: perfilNuevo }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Error al crear trabajador de taller' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

