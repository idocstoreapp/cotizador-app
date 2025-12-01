/**
 * API Endpoint para actualizar una cotización con materiales desde costos reales
 * POST /api/actualizar-cotizacion-costos-reales
 * Body: { numeroCotizacion: string }
 */
import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';
import { obtenerGastosRealesPorCotizacion } from '../../services/gastos-reales.service';
import { obtenerCotizacionPorId, actualizarCotizacion } from '../../services/cotizaciones.service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { numeroCotizacion } = await request.json();

    if (!numeroCotizacion) {
      return new Response(
        JSON.stringify({ error: 'Número de cotización requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Limpiar el número de cotización (trim y normalizar)
    const numeroLimpio = numeroCotizacion.trim().toUpperCase();
    console.log(`🔍 Buscando cotización: "${numeroLimpio}" (original: "${numeroCotizacion}")`);
    
    // 1. Buscar la cotización por número (case-insensitive)
    // Obtener todas las cotizaciones y buscar manualmente (más confiable)
    const { data: todasCotizaciones, error: errorLista } = await supabase
      .from('cotizaciones')
      .select('id, numero')
      .limit(1000);
    
    if (errorLista) {
      console.error('Error al obtener lista de cotizaciones:', errorLista);
    }
    
    let cotizacionData: any = null;
    let errorCotizacion: any = null;
    
    if (todasCotizaciones && todasCotizaciones.length > 0) {
      // Buscar manualmente (case-insensitive)
      const cotizacionEncontrada = todasCotizaciones.find(
        c => c.numero?.toUpperCase().trim() === numeroLimpio
      );
      
      if (cotizacionEncontrada) {
        console.log(`✅ Cotización encontrada por ID: ${cotizacionEncontrada.id}`);
        const { data: cotizacionCompleta, error: errorCompleta } = await supabase
          .from('cotizaciones')
          .select('*')
          .eq('id', cotizacionEncontrada.id)
          .single();
        
        if (!errorCompleta && cotizacionCompleta) {
          cotizacionData = cotizacionCompleta;
        } else {
          errorCotizacion = errorCompleta;
        }
      } else {
        console.log('⚠️ No se encontró la cotización. Primeras cotizaciones:', todasCotizaciones.slice(0, 10).map(c => c.numero));
        errorCotizacion = new Error('No encontrada');
      }
    } else {
      errorCotizacion = new Error('No se pudieron obtener las cotizaciones');
    }

    if (errorCotizacion || !cotizacionData) {
      // Obtener algunas cotizaciones para mostrar sugerencias
      const { data: sugerencias } = await supabase
        .from('cotizaciones')
        .select('numero')
        .ilike('numero', `%${numeroLimpio.replace(/[^A-Z0-9]/g, '')}%`)
        .limit(5);
      
      return new Response(
        JSON.stringify({ 
          error: `Cotización "${numeroCotizacion}" no encontrada`,
          numeroBuscado: numeroLimpio,
          sugerencias: sugerencias?.map(s => s.numero) || []
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Cotización encontrada: ${cotizacionData.id}`);
    console.log(`📋 Items actuales:`, cotizacionData.items?.length || 0);

    // 2. Obtener gastos reales de materiales
    const gastosReales = await obtenerGastosRealesPorCotizacion(cotizacionData.id);
    console.log(`💰 Gastos reales encontrados: ${gastosReales.length}`);

    if (gastosReales.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No hay gastos reales registrados para esta cotización',
          cotizacionId: cotizacionData.id
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Obtener la cantidad del item (asumimos que es 15, pero lo verificamos)
    const items = cotizacionData.items || [];
    let cantidadItem = 1;
    
    if (items.length > 0) {
      // Buscar el item manual o el primer item con cantidad
      const itemConCantidad = items.find((item: any) => item.cantidad && item.cantidad > 1);
      if (itemConCantidad) {
        cantidadItem = itemConCantidad.cantidad;
        console.log(`📦 Cantidad del item encontrada: ${cantidadItem}`);
      } else {
        // Si no hay cantidad explícita, asumimos 15 como el usuario indicó
        cantidadItem = 15;
        console.log(`📦 Usando cantidad por defecto: ${cantidadItem}`);
      }
    } else {
      cantidadItem = 15;
      console.log(`📦 Usando cantidad por defecto: ${cantidadItem}`);
    }

    // 4. Agrupar gastos reales por material (sumar cantidades si hay duplicados)
    const materialesAgrupados = new Map<string, {
      material_nombre: string;
      cantidad_total: number;
      precio_unitario: number;
      unidad: string;
    }>();

    gastosReales.forEach(gasto => {
      const key = gasto.material_nombre.toLowerCase();
      if (materialesAgrupados.has(key)) {
        const existente = materialesAgrupados.get(key)!;
        existente.cantidad_total += gasto.cantidad_real;
        // Usar el precio unitario más reciente
        existente.precio_unitario = gasto.precio_unitario_real;
      } else {
        materialesAgrupados.set(key, {
          material_nombre: gasto.material_nombre,
          cantidad_total: gasto.cantidad_real,
          precio_unitario: gasto.precio_unitario_real,
          unidad: gasto.unidad
        });
      }
    });

    console.log(`📊 Materiales agrupados: ${materialesAgrupados.size}`);

    // 5. Calcular cantidad por unidad del item (dividir por la cantidad del item)
    const materialesPorUnidad = Array.from(materialesAgrupados.values()).map(mat => ({
      ...mat,
      cantidad_por_unidad: mat.cantidad_total / cantidadItem,
      precio_unitario_por_unidad: mat.precio_unitario // El precio unitario ya es por unidad
    }));

    console.log('📋 Materiales calculados por unidad:');
    materialesPorUnidad.forEach(mat => {
      console.log(`  - ${mat.material_nombre}: ${mat.cantidad_por_unidad} ${mat.unidad} × $${mat.precio_unitario_por_unidad.toLocaleString('es-CO')}`);
    });

    // 6. Actualizar los items de la cotización con los materiales reales
    const itemsActualizados = items.map((item: any) => {
      let materialesActualizados = item.materiales || [];
      let precioTotalItem = item.precio_total || 0;
      
      // Si el item tiene materiales, actualizarlos
      if (item.materiales && Array.isArray(item.materiales) && item.materiales.length > 0) {
        materialesActualizados = item.materiales.map((mat: any) => {
          const materialReal = materialesPorUnidad.find(m => 
            m.material_nombre.toLowerCase() === (mat.material_nombre || mat.nombre || '').toLowerCase()
          );

          if (materialReal) {
            console.log(`  ✓ Actualizando material: ${mat.material_nombre || mat.nombre}`);
            console.log(`    - Cantidad: ${mat.cantidad || 0} → ${materialReal.cantidad_por_unidad}`);
            console.log(`    - Precio unitario: ${mat.precio_unitario || 0} → ${materialReal.precio_unitario_por_unidad}`);
            return {
              ...mat,
              cantidad: materialReal.cantidad_por_unidad,
              precio_unitario: materialReal.precio_unitario_por_unidad,
              // Mantener otros campos del material original
              material_id: mat.material_id,
              material_nombre: materialReal.material_nombre,
              unidad: materialReal.unidad
            };
          }
          return mat; // Mantener material si no hay gasto real
        });

        // Recalcular el precio total del item basado en los materiales actualizados
        const costoMateriales = materialesActualizados.reduce((sum: number, mat: any) => {
          return sum + ((mat.cantidad || 0) * (mat.precio_unitario || 0));
        }, 0);

        // Calcular costo de servicios si existen
        const costoServicios = (item.servicios || []).reduce((sum: number, serv: any) => {
          return sum + ((serv.horas || 0) * (serv.precio_por_hora || 0));
        }, 0);

        const costoBase = costoMateriales + costoServicios;
        const margenGanancia = item.margen_ganancia || cotizacionData.margen_ganancia || 30;
        const precioConMargen = costoBase * (1 + margenGanancia / 100);
        
        // Aplicar cantidad del item
        precioTotalItem = precioConMargen * (item.cantidad || 1);
        
        console.log(`  📊 Item "${item.nombre || 'Sin nombre'}":`);
        console.log(`    - Costo materiales: $${costoMateriales.toLocaleString('es-CO')}`);
        console.log(`    - Costo servicios: $${costoServicios.toLocaleString('es-CO')}`);
        console.log(`    - Costo base: $${costoBase.toLocaleString('es-CO')}`);
        console.log(`    - Precio con margen (${margenGanancia}%): $${precioConMargen.toLocaleString('es-CO')}`);
        console.log(`    - Precio total (×${item.cantidad || 1}): $${precioTotalItem.toLocaleString('es-CO')}`);
      }

      return {
        ...item,
        materiales: materialesActualizados,
        precio_total: precioTotalItem
      };
    });

    // 7. Recalcular totales desde items
    const subtotal = itemsActualizados.reduce((sum: number, item: any) => {
      return sum + (item.precio_total || 0);
    }, 0);

    const descuento = (cotizacionData as any).descuento || 0;
    const descuentoMonto = subtotal * (descuento / 100);
    const subtotalConDescuento = subtotal - descuentoMonto;
    const ivaPorcentaje = (cotizacionData as any).iva_porcentaje || 19;
    const iva = subtotalConDescuento * (ivaPorcentaje / 100);
    const total = subtotalConDescuento + iva;

    console.log(`💰 Nuevos totales:`);
    console.log(`  - Subtotal: $${subtotal.toLocaleString('es-CO')}`);
    console.log(`  - Descuento (${descuento}%): $${descuentoMonto.toLocaleString('es-CO')}`);
    console.log(`  - IVA (${ivaPorcentaje}%): $${iva.toLocaleString('es-CO')}`);
    console.log(`  - Total: $${total.toLocaleString('es-CO')}`);

    // 8. Actualizar la cotización
    await actualizarCotizacion(
      cotizacionData.id,
      {},
      itemsActualizados,
      subtotal,
      descuento,
      iva,
      total
    );

    console.log(`✅ Cotización ${numeroCotizacion} actualizada exitosamente`);
    console.log(`📝 Resumen de actualización:`);
    console.log(`  - Items actualizados: ${itemsActualizados.length}`);
    console.log(`  - Materiales actualizados: ${materialesPorUnidad.length}`);
    console.log(`  - Total anterior: $${cotizacionData.total?.toLocaleString('es-CO') || '0'}`);
    console.log(`  - Total nuevo: $${total.toLocaleString('es-CO')}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cotización ${numeroCotizacion} actualizada exitosamente`,
        cotizacionId: cotizacionData.id,
        cantidadItem,
        materialesActualizados: materialesPorUnidad.length,
        itemsActualizados: itemsActualizados.length,
        totalAnterior: cotizacionData.total || 0,
        totales: {
          subtotal,
          descuento: descuentoMonto,
          iva,
          total
        },
        materiales: materialesPorUnidad.map(m => ({
          nombre: m.material_nombre,
          cantidad_por_unidad: m.cantidad_por_unidad,
          precio_unitario: m.precio_unitario_por_unidad,
          unidad: m.unidad
        }))
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error al actualizar cotización:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al actualizar cotización',
        message: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

