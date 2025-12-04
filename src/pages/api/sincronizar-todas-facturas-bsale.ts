/**
 * API Endpoint para sincronizar todas las facturas sin bsale_document_id con Bsale
 * POST /api/sincronizar-todas-facturas-bsale
 * Body: { limit?: number } (opcional, por defecto 100)
 */
import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';
import { sincronizarFacturaConBsale, generarUrlBsale } from '../../services/bsale.service';
import { actualizarFactura } from '../../services/facturas.service';

export const POST: APIRoute = async ({ request }) => {
  console.log('🚀 ====== ENDPOINT /api/sincronizar-todas-facturas-bsale LLAMADO ======');
  
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 100;

    // Obtener todas las facturas sin bsale_document_id
    const { data: facturas, error } = await supabase
      .from('facturas')
      .select('*')
      .is('bsale_document_id', null)
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!facturas || facturas.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No hay facturas pendientes de sincronizar',
          sincronizadas: 0,
          no_encontradas: 0,
          errores: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Procesando ${facturas.length} facturas...`);

    let sincronizadas = 0;
    let noEncontradas = 0;
    let errores = 0;
    const resultados: Array<{
      factura_id: string;
      numero_factura: string;
      estado: 'sincronizada' | 'no_encontrada' | 'error';
      bsale_document_id?: number;
      error?: string;
    }> = [];

    // Procesar cada factura
    for (const factura of facturas) {
      try {
        console.log(`🔍 Sincronizando factura: ${factura.numero_factura}`);
        
        const bsaleDocumentId = await sincronizarFacturaConBsale(factura.numero_factura);

        if (bsaleDocumentId) {
          await actualizarFactura(factura.id, {
            bsale_document_id: bsaleDocumentId
          });
          
          sincronizadas++;
          resultados.push({
            factura_id: factura.id,
            numero_factura: factura.numero_factura,
            estado: 'sincronizada',
            bsale_document_id: bsaleDocumentId
          });
          console.log(`✅ Factura ${factura.numero_factura} sincronizada con ID: ${bsaleDocumentId}`);
        } else {
          noEncontradas++;
          resultados.push({
            factura_id: factura.id,
            numero_factura: factura.numero_factura,
            estado: 'no_encontrada'
          });
          console.log(`⚠️ Factura ${factura.numero_factura} no encontrada en Bsale`);
        }
      } catch (error: any) {
        errores++;
        resultados.push({
          factura_id: factura.id,
          numero_factura: factura.numero_factura,
          estado: 'error',
          error: error.message
        });
        console.error(`❌ Error al sincronizar factura ${factura.numero_factura}:`, error.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronización completada: ${sincronizadas} sincronizadas, ${noEncontradas} no encontradas, ${errores} errores`,
        sincronizadas,
        no_encontradas: noEncontradas,
        errores,
        total_procesadas: facturas.length,
        resultados
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error al sincronizar facturas con Bsale:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error al sincronizar facturas con Bsale'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};





