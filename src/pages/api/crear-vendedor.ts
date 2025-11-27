/**
 * API endpoint para crear vendedores con autenticación
 * Solo accesible para administradores
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar que el usuario esté autenticado
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extraer token del header
    const token = authHeader.replace('Bearer ', '');
    
    // Crear cliente de Supabase para verificar usuario
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incorrecta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verificar token y obtener usuario
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el usuario sea admin
    const { data: perfil, error: perfilError } = await supabaseClient
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil || perfil.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo los administradores pueden crear vendedores' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del body
    const body = await request.json();
    const { nombre, apellido, email, password } = body;

    // Validaciones
    if (!nombre || !apellido || !email || !password) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear cliente admin de Supabase (usar service role key)
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

    // Crear usuario en Supabase Auth (sin requerir confirmación de email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nombre,
        apellido,
        role: 'vendedor'
      }
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'No se pudo crear el usuario de autenticación' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear perfil en la tabla de perfiles
    const { data: perfil, error: profileError } = await supabaseAdmin
      .from('perfiles')
      .insert({
        id: authData.user.id,
        nombre,
        apellido,
        email: email.trim(),
        role: 'vendedor'
      })
      .select()
      .single();

    if (profileError) {
      // Si falla la creación del perfil, eliminar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {
        // Ignorar errores al eliminar
      });
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ usuario: perfil }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Error al crear vendedor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

