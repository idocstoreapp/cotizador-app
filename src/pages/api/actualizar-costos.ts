/**
 * API Endpoint para actualizar una cotización con materiales desde costos reales
 * POST /api/actualizar-costos
 * Body: { numeroCotizacion: string }
 */
import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';
import { obtenerGastosRealesPorCotizacion } from '../../services/gastos-reales.service';
import { obtenerCotizacionPorId, actualizarCotizacion } from '../../services/cotizaciones.service';

export const POST: APIRoute = async ({ request }) => {
  console.log('🚀 ====== ENDPOINT /api/actualizar-costos LLAMADO ======');
  console.log('📥 Request recibido');
  
  try {
    const body = await request.json();
    console.log('📦 Body recibido:', body);
    const { numeroCotizacion } = body;

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
    console.log(`🔍 Buscando gastos reales para cotización ID: ${cotizacionData.id}`);
    const gastosReales = await obtenerGastosRealesPorCotizacion(cotizacionData.id);
    console.log(`💰 Gastos reales encontrados: ${gastosReales.length}`);
    
    if (gastosReales.length > 0) {
      console.log('📋 Primeros gastos reales:');
      gastosReales.slice(0, 5).forEach((gasto, idx) => {
        console.log(`  ${idx + 1}. ${gasto.material_nombre} - ${gasto.cantidad_real} ${gasto.unidad} × $${gasto.precio_unitario_real}`);
      });
    }

    if (gastosReales.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: `No hay gastos reales registrados para la cotización ${numeroCotizacion}. 
          Ve a la sección de "Costos" de esta cotización y registra los gastos reales de materiales primero.`,
          cotizacionId: cotizacionData.id,
          numeroCotizacion: numeroCotizacion
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

    console.log(`📊 Materiales agrupados de gastos reales: ${materialesAgrupados.size}`);
    console.log('📋 Lista de materiales en gastos reales:');
    Array.from(materialesAgrupados.values()).forEach(mat => {
      console.log(`  - "${mat.material_nombre}" (${mat.cantidad_total} ${mat.unidad})`);
    });

    // 5. Calcular cantidad por unidad del item (dividir por la cantidad del item)
    const materialesPorUnidad = Array.from(materialesAgrupados.values()).map(mat => ({
      ...mat,
      cantidad_por_unidad: mat.cantidad_total / cantidadItem,
      precio_unitario_por_unidad: mat.precio_unitario // El precio unitario ya es por unidad
    }));

    console.log('📋 Materiales calculados por unidad:');
    materialesPorUnidad.forEach(mat => {
      console.log(`  - "${mat.material_nombre}": ${mat.cantidad_por_unidad} ${mat.unidad} × $${mat.precio_unitario_por_unidad.toLocaleString('es-CO')}`);
    });
    
    // Debug: Mostrar todos los nombres exactos de materiales en gastos reales
    console.log('📝 Nombres exactos de materiales en gastos reales:');
    materialesPorUnidad.forEach((mat, idx) => {
      console.log(`  ${idx + 1}. "${mat.material_nombre}" (${mat.cantidad_total} ${mat.unidad})`);
    });

    // Debug: Listar todos los materiales en los items
    console.log('🔍 Materiales en los items de la cotización:');
    items.forEach((item: any, idx: number) => {
      if (item.materiales && Array.isArray(item.materiales)) {
        console.log(`  Item ${idx + 1} (${item.nombre || 'Sin nombre'}):`);
        item.materiales.forEach((mat: any, matIdx: number) => {
          const nombreMat = mat.material_nombre || mat.nombre || 'Sin nombre';
          console.log(`    - Material ${matIdx + 1}: "${nombreMat}" (cantidad: ${mat.cantidad || 0}, precio: ${mat.precio_unitario || 0})`);
        });
      } else {
        console.log(`  Item ${idx + 1} (${item.nombre || 'Sin nombre'}): Sin materiales`);
      }
    });

    // 6. Actualizar los items de la cotización con los materiales reales
    let materialesEncontrados = 0;
    let materialesNoEncontrados: string[] = [];
    
    const itemsActualizados = items.map((item: any) => {
      let materialesActualizados = item.materiales || [];
      let precioTotalItem = item.precio_total || 0;
      
      // Si el item tiene materiales, actualizarlos
      if (item.materiales && Array.isArray(item.materiales) && item.materiales.length > 0) {
        materialesActualizados = item.materiales.map((mat: any) => {
          const nombreMat = (mat.material_nombre || mat.nombre || '').trim();
          const nombreMatLower = nombreMat.toLowerCase()
            .replace(/\s+/g, ' ') // Normalizar espacios múltiples
            .replace(/mm/g, 'mm') // Normalizar mm
            .replace(/litro/g, 'litro') // Normalizar litro
            .trim();
          
          // Función para normalizar nombres (eliminar espacios extra, normalizar mayúsculas)
          const normalizarNombre = (nombre: string) => {
            return nombre.toLowerCase()
              .replace(/\s+/g, ' ')
              .replace(/mm/g, 'mm')
              .replace(/litro/g, 'litro')
              .trim();
          };
          
          // Buscar material real con matching más flexible
          let materialReal = materialesPorUnidad.find(m => {
            const nombreReal = normalizarNombre(m.material_nombre);
            return nombreReal === nombreMatLower;
          });
          
          // Si no encuentra exacto, intentar búsqueda parcial (una contiene a la otra)
          if (!materialReal) {
            materialReal = materialesPorUnidad.find(m => {
              const nombreReal = normalizarNombre(m.material_nombre);
              // Una contiene a la otra (con un mínimo de 3 caracteres para evitar matches falsos)
              if (nombreMatLower.length >= 3 && nombreReal.length >= 3) {
                return nombreReal.includes(nombreMatLower) || nombreMatLower.includes(nombreReal);
              }
              return false;
            });
          }
          
          // Si aún no encuentra, intentar matching por palabras clave
          if (!materialReal) {
            const palabrasMat = nombreMatLower.split(/\s+/).filter(p => p.length >= 3);
            materialReal = materialesPorUnidad.find(m => {
              const nombreReal = normalizarNombre(m.material_nombre);
              const palabrasReal = nombreReal.split(/\s+/).filter(p => p.length >= 3);
              // Si al menos 2 palabras coinciden, considerarlo match
              const coincidencias = palabrasMat.filter(p => palabrasReal.some(r => r.includes(p) || p.includes(r)));
              return coincidencias.length >= Math.min(2, palabrasMat.length);
            });
          }

          if (materialReal) {
            materialesEncontrados++;
            console.log(`  ✅ MATCH ENCONTRADO: "${nombreMat}" → "${materialReal.material_nombre}"`);
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
          } else {
            // Material no encontrado en gastos reales
            const nombreMat = (mat.material_nombre || mat.nombre || 'Sin nombre').trim();
            if (nombreMat && !materialesNoEncontrados.includes(nombreMat)) {
              materialesNoEncontrados.push(nombreMat);
            }
            console.log(`  ❌ NO ENCONTRADO: "${nombreMat}"`);
            console.log(`    Buscando en: ${materialesPorUnidad.map(m => `"${m.material_nombre}"`).join(', ')}`);
            return mat; // Mantener material si no hay gasto real
          }
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

    // 7.5. Verificar que se haya actualizado algo antes de guardar
    if (materialesEncontrados === 0) {
      console.log(`⚠️ No se encontraron materiales para actualizar`);
      console.log(`  - Materiales en gastos reales: ${materialesPorUnidad.length}`);
      console.log(`  - Materiales en items: ${items.reduce((sum: number, item: any) => {
        return sum + (item.materiales?.length || 0);
      }, 0)}`);
      
      return new Response(
        JSON.stringify({ 
          error: `No se encontraron materiales para actualizar. 
          
Los materiales registrados en gastos reales no coinciden con los materiales en los items de la cotización.

Materiales en gastos reales (${materialesPorUnidad.length}): ${materialesPorUnidad.map(m => `"${m.material_nombre}"`).join(', ')}

Verifica que los nombres de los materiales en los items coincidan exactamente con los nombres registrados en gastos reales.`,
          cotizacionId: cotizacionData.id,
          materialesEnGastosReales: materialesPorUnidad.length,
          materialesEnGastosRealesLista: materialesPorUnidad.map(m => m.material_nombre),
          materialesNoEncontrados: materialesNoEncontrados,
          itemsCount: items.length,
          materialesEnItems: items.reduce((sum: number, item: any) => {
            return sum + (item.materiales?.length || 0);
          }, 0)
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
    console.log(`  - Materiales en gastos reales: ${materialesPorUnidad.length}`);
    console.log(`  - Materiales encontrados y actualizados: ${materialesEncontrados}`);
    if (materialesNoEncontrados.length > 0) {
      console.log(`  - Materiales NO encontrados en items: ${materialesNoEncontrados.length}`);
      materialesNoEncontrados.forEach(nombre => {
        console.log(`    ⚠️ "${nombre}"`);
      });
    }
    console.log(`  - Total anterior: $${cotizacionData.total?.toLocaleString('es-CO') || '0'}`);
    console.log(`  - Total nuevo: $${total.toLocaleString('es-CO')}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cotización ${numeroCotizacion} actualizada exitosamente`,
        cotizacionId: cotizacionData.id,
        cantidadItem,
        materialesEnGastosReales: materialesPorUnidad.length,
        materialesActualizados: materialesEncontrados,
        materialesNoEncontrados: materialesNoEncontrados,
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

