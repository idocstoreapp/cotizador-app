/**
 * API Endpoint para sincronizar una factura con Bsale
 * POST /api/sincronizar-factura-bsale
 * Body: { facturaId: string } o { numeroFactura: string }
 */
import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';
import { sincronizarFacturaConBsale, generarUrlBsale } from '../../services/bsale.service';
import { obtenerFacturaPorId, actualizarFactura } from '../../services/facturas.service';

export const POST: APIRoute = async ({ request }) => {
  console.log('🚀 ====== ENDPOINT /api/sincronizar-factura-bsale LLAMADO ======');
  
  try {
    const body = await request.json();
    const { facturaId, numeroFactura } = body;

    if (!facturaId && !numeroFactura) {
      return new Response(
        JSON.stringify({ error: 'Se requiere facturaId o numeroFactura' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let factura;
    let numeroFacturaABuscar: string;

    if (facturaId) {
      // Obtener factura por ID
      factura = await obtenerFacturaPorId(facturaId);
      numeroFacturaABuscar = factura.numero_factura;
    } else {
      // Buscar factura por número
      const { data: facturas, error } = await supabase
        .from('facturas')
        .select('*')
        .eq('numero_factura', numeroFactura)
        .limit(1)
        .single();

      if (error || !facturas) {
        return new Response(
          JSON.stringify({ error: `Factura con número ${numeroFactura} no encontrada` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      factura = facturas as any;
      numeroFacturaABuscar = numeroFactura;
    }

    // Si ya tiene bsale_document_id, verificar que sigue siendo válido
    if (factura.bsale_document_id) {
      console.log(`✅ Factura ${factura.numero_factura} ya tiene bsale_document_id: ${factura.bsale_document_id}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Factura ya sincronizada',
          factura: {
            ...factura,
            bsale_url: generarUrlBsale(factura.bsale_document_id)
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sincronizar con Bsale
    console.log(`🔍 Buscando documento en Bsale para factura: ${numeroFacturaABuscar}`);
    const bsaleDocumentId = await sincronizarFacturaConBsale(numeroFacturaABuscar);

    if (!bsaleDocumentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No se encontró el documento ${numeroFacturaABuscar} en Bsale`,
          message: 'El número de factura no existe en Bsale o no tienes acceso a él'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar factura con el ID de Bsale
    console.log(`✅ Documento encontrado en Bsale con ID: ${bsaleDocumentId}`);
    const facturaActualizada = await actualizarFactura(factura.id, {
      bsale_document_id: bsaleDocumentId
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Factura sincronizada exitosamente',
        factura: {
          ...facturaActualizada,
          bsale_url: generarUrlBsale(bsaleDocumentId)
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error al sincronizar factura con Bsale:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error al sincronizar factura con Bsale'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};







