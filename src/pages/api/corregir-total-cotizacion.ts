/**
 * API Endpoint para corregir SOLO el total de una cotización
 * NO modifica items ni materiales, solo actualiza subtotal, iva y total
 * POST /api/corregir-total-cotizacion
 * Body: { numeroCotizacion: string }
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuración de Supabase incompleta');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const POST: APIRoute = async ({ request }) => {
  console.log('🔧 ====== CORREGIR TOTAL DE COTIZACIÓN ======');
  
  try {
    const body = await request.json();
    const { numeroCotizacion } = body;

    if (!numeroCotizacion) {
      return new Response(
        JSON.stringify({ error: 'Número de cotización requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const numeroLimpio = numeroCotizacion.trim().toUpperCase();
    const supabaseAdmin = getSupabaseAdmin();
    
    // Buscar cotización
    const { data: todasCotizaciones } = await supabaseAdmin
      .from('cotizaciones')
      .select('id, numero')
      .limit(1000);
    
    const normalizarNumero = (num: string | null | undefined): string => {
      if (!num) return '';
      return num.toUpperCase().replace(/\s+/g, '').replace(/-/g, '').trim();
    };
    
    const numeroBuscadoNormalizado = normalizarNumero(numeroLimpio);
    const cotizacionEncontrada = todasCotizaciones?.find(
      c => normalizarNumero(c.numero) === numeroBuscadoNormalizado
    );
    
    if (!cotizacionEncontrada) {
      return new Response(
        JSON.stringify({ error: `Cotización "${numeroCotizacion}" no encontrada` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener cotización completa
    const { data: cotizacionData, error: errorCotizacion } = await supabaseAdmin
      .from('cotizaciones')
      .select('*')
      .eq('id', cotizacionEncontrada.id)
      .single();
    
    if (errorCotizacion || !cotizacionData) {
      return new Response(
        JSON.stringify({ error: `Error al obtener cotización: ${errorCotizacion?.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const items = cotizacionData.items || [];
    
    console.log(`📋 Items encontrados: ${items.length}`);
    items.forEach((item: any, idx: number) => {
      console.log(`  Item ${idx + 1}: "${item.nombre || 'Sin nombre'}"`);
      console.log(`    - Cantidad: ${item.cantidad || 1}`);
      console.log(`    - Precio unitario: $${(item.precio_unitario || 0).toLocaleString('es-CO')}`);
      console.log(`    - Precio total guardado: $${(item.precio_total || 0).toLocaleString('es-CO')}`);
      
      // Verificar si el precio_total está correcto
      if (item.precio_unitario && item.cantidad) {
        const precioTotalEsperado = item.precio_unitario * item.cantidad;
        const diferencia = Math.abs(precioTotalEsperado - (item.precio_total || 0));
        console.log(`    - Precio total esperado (unitario × cantidad): $${precioTotalEsperado.toLocaleString('es-CO')}`);
        console.log(`    - Diferencia: $${diferencia.toLocaleString('es-CO')}`);
        if (diferencia > 100) {
          console.log(`    ⚠️ El precio_total del item está incorrecto, necesita corrección`);
        }
      }
    });
    
    // Corregir precio_total de items si está incorrecto
    const itemsCorregidos = items.map((item: any) => {
      // Si tiene precio_unitario y cantidad, calcular precio_total correcto
      if (item.precio_unitario && item.cantidad && item.cantidad > 0) {
        const precioTotalCorrecto = item.precio_unitario * item.cantidad;
        const precioTotalGuardado = item.precio_total || 0;
        const diferencia = Math.abs(precioTotalCorrecto - precioTotalGuardado);
        
        // Si la diferencia es significativa (más de $100), corregir
        if (diferencia > 100) {
          console.log(`  ✅ Corrigiendo precio_total del item "${item.nombre || 'Sin nombre'}":`);
          console.log(`    - De: $${precioTotalGuardado.toLocaleString('es-CO')}`);
          console.log(`    - A: $${precioTotalCorrecto.toLocaleString('es-CO')}`);
          return {
            ...item,
            precio_total: precioTotalCorrecto
          };
        }
      }
      return item;
    });
    
    // Calcular subtotal desde precio_total de items (usando items corregidos)
    const subtotal = itemsCorregidos.reduce((sum: number, item: any) => {
      return sum + (item.precio_total || 0);
    }, 0);
    
    // Calcular IVA
    const ivaPorcentaje = (cotizacionData as any).iva_porcentaje || 19;
    const iva = subtotal * (ivaPorcentaje / 100);
    
    // Calcular total
    const total = subtotal + iva;
    
    console.log(`📊 Totales actuales vs calculados:`);
    console.log(`  - Subtotal guardado: $${(cotizacionData.subtotal || 0).toLocaleString('es-CO')}`);
    console.log(`  - Subtotal calculado: $${subtotal.toLocaleString('es-CO')}`);
    console.log(`  - IVA guardado: $${(cotizacionData.iva || 0).toLocaleString('es-CO')}`);
    console.log(`  - IVA calculado: $${iva.toLocaleString('es-CO')}`);
    console.log(`  - Total guardado: $${(cotizacionData.total || 0).toLocaleString('es-CO')}`);
    console.log(`  - Total calculado: $${total.toLocaleString('es-CO')}`);
    
    // Verificar si hay diferencia significativa
    const totalGuardado = cotizacionData.total || 0;
    const diferencia = Math.abs(total - totalGuardado);
    console.log(`  - Diferencia: $${diferencia.toLocaleString('es-CO')}`);
    
    if (diferencia < 100) {
      console.log(`ℹ️ La diferencia es menor a $100, no se actualizará`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `El total ya está correcto (diferencia menor a $100)`,
          cotizacionId: cotizacionData.id,
          totalesAnteriores: {
            subtotal: cotizacionData.subtotal || 0,
            iva: cotizacionData.iva || 0,
            total: cotizacionData.total || 0
          },
          totalesNuevos: {
            subtotal,
            iva,
            total
          },
          diferencia: diferencia
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar si los items necesitan corrección
    const itemsNecesitanCorreccion = items.some((item: any, idx: number) => {
      if (item.precio_unitario && item.cantidad && item.cantidad > 0) {
        const precioTotalCorrecto = item.precio_unitario * item.cantidad;
        const precioTotalGuardado = item.precio_total || 0;
        return Math.abs(precioTotalCorrecto - precioTotalGuardado) > 100;
      }
      return false;
    });
    
    // Actualizar items si necesitan corrección, y actualizar totales
    const datosActualizacion: any = {
      subtotal: subtotal,
      iva: iva,
      total: total,
      updated_at: new Date().toISOString()
    };
    
    if (itemsNecesitanCorreccion) {
      console.log(`🔧 Actualizando items con precios corregidos...`);
      datosActualizacion.items = itemsCorregidos;
    }
    
    const { data: cotizacionActualizada, error: errorActualizacion } = await supabaseAdmin
      .from('cotizaciones')
      .update(datosActualizacion)
      .eq('id', cotizacionData.id)
      .select('*')
      .single();
    
    if (errorActualizacion) {
      return new Response(
        JSON.stringify({ error: `Error al actualizar: ${errorActualizacion.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ Cotización actualizada exitosamente`);
    console.log(`  - Total anterior: $${totalGuardado.toLocaleString('es-CO')}`);
    console.log(`  - Total nuevo: $${total.toLocaleString('es-CO')}`);
    console.log(`  - Diferencia: $${diferencia.toLocaleString('es-CO')}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Total de cotización ${numeroCotizacion} corregido de $${totalGuardado.toLocaleString('es-CO')} a $${total.toLocaleString('es-CO')}`,
        cotizacionId: cotizacionData.id,
        totalesAnteriores: {
          subtotal: cotizacionData.subtotal || 0,
          iva: cotizacionData.iva || 0,
          total: totalGuardado
        },
        totalesNuevos: {
          subtotal,
          iva,
          total
        },
        diferencia: diferencia,
        itemsCorregidos: itemsNecesitanCorreccion,
        items: itemsCorregidos.map((item: any) => ({
          nombre: item.nombre || 'Sin nombre',
          cantidad: item.cantidad || 1,
          precio_unitario: item.precio_unitario || 0,
          precio_total_anterior: items.find((i: any) => i.id === item.id || i.nombre === item.nombre)?.precio_total || 0,
          precio_total_nuevo: item.precio_total || 0
        }))
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error desconocido' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

