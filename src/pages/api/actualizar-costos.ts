/**
 * API Endpoint para actualizar una cotización con materiales desde costos reales
 * POST /api/actualizar-costos
 * Body: { numeroCotizacion: string }
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
// Nota: Usamos cliente admin directamente para bypass RLS en lugar de los servicios

// Crear cliente de Supabase con service role key para bypass RLS
function getSupabaseAdmin() {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Faltan variables de entorno para Supabase Admin');
    throw new Error('Configuración de Supabase incompleta');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Endpoint GET para verificar que el endpoint está disponible
export const GET: APIRoute = async ({ url }) => {
  return new Response(
    JSON.stringify({ 
      message: 'Endpoint /api/actualizar-costos está disponible',
      method: 'POST',
      body: { numeroCotizacion: 'string' }
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const POST: APIRoute = async ({ request, url }) => {
  console.log('🚀 ====== ENDPOINT /api/actualizar-costos LLAMADO ======');
  console.log('📥 Request recibido en:', url);
  console.log('📥 Method:', request.method);
  console.log('📥 Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json().catch((err) => {
      console.error('❌ Error al parsear body:', err);
      return {};
    });
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
    
    // Función para normalizar números de cotización (ignorar guiones, espacios, etc.)
    const normalizarNumero = (num: string | null | undefined): string => {
      if (!num) return '';
      return num.toUpperCase()
        .replace(/\s+/g, '') // Eliminar espacios
        .replace(/-/g, '') // Eliminar guiones
        .trim();
    };
    
    const numeroBuscadoNormalizado = normalizarNumero(numeroLimpio);
    console.log(`🔍 Número normalizado para búsqueda: "${numeroBuscadoNormalizado}"`);
    
    // 1. Buscar la cotización por número (case-insensitive y sin guiones/espacios)
    // Obtener todas las cotizaciones y buscar manualmente (más confiable)
    // Usar cliente admin para bypass RLS
    const supabaseAdmin = getSupabaseAdmin();
    const { data: todasCotizaciones, error: errorLista } = await supabaseAdmin
      .from('cotizaciones')
      .select('id, numero')
      .limit(1000);
    
    if (errorLista) {
      console.error('❌ Error al obtener lista de cotizaciones:', errorLista);
      return new Response(
        JSON.stringify({ 
          error: `Error al buscar cotizaciones: ${errorLista.message}`,
          numeroBuscado: numeroLimpio
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📋 Total de cotizaciones obtenidas: ${todasCotizaciones?.length || 0}`);
    if (todasCotizaciones && todasCotizaciones.length > 0) {
      console.log(`📋 Primeras 10 cotizaciones:`, todasCotizaciones.slice(0, 10).map(c => ({
        numero: c.numero,
        normalizado: normalizarNumero(c.numero)
      })));
    }
    
    let cotizacionData: any = null;
    let errorCotizacion: any = null;
    
    if (todasCotizaciones && todasCotizaciones.length > 0) {
      // Buscar manualmente (case-insensitive y sin guiones/espacios)
      const cotizacionEncontrada = todasCotizaciones.find(
        c => normalizarNumero(c.numero) === numeroBuscadoNormalizado
      );
      
      if (cotizacionEncontrada) {
        console.log(`✅ Cotización encontrada: "${cotizacionEncontrada.numero}" (ID: ${cotizacionEncontrada.id})`);
        const { data: cotizacionCompleta, error: errorCompleta } = await supabaseAdmin
          .from('cotizaciones')
          .select('*')
          .eq('id', cotizacionEncontrada.id)
          .single();
        
        if (!errorCompleta && cotizacionCompleta) {
          cotizacionData = cotizacionCompleta;
          console.log(`✅ Cotización completa cargada: ${cotizacionCompleta.numero}`);
        } else {
          console.error('❌ Error al cargar cotización completa:', errorCompleta);
          errorCotizacion = errorCompleta;
        }
      } else {
        console.log('⚠️ No se encontró la cotización con búsqueda exacta');
        console.log(`📋 Buscando coincidencias parciales...`);
        
        // Buscar coincidencias parciales
        const coincidenciasParciales = todasCotizaciones.filter(
          c => {
            const numNormalizado = normalizarNumero(c.numero);
            return numNormalizado.includes(numeroBuscadoNormalizado) || 
                   numeroBuscadoNormalizado.includes(numNormalizado);
          }
        ).slice(0, 10);
        
        if (coincidenciasParciales.length > 0) {
          console.log(`💡 Coincidencias parciales encontradas:`, coincidenciasParciales.map(c => c.numero));
        }
        
        errorCotizacion = new Error('No encontrada');
      }
    } else {
      console.error('❌ No se pudieron obtener las cotizaciones o la lista está vacía');
      errorCotizacion = new Error('No se pudieron obtener las cotizaciones');
    }

    if (errorCotizacion || !cotizacionData) {
      // Obtener algunas cotizaciones para mostrar sugerencias
      const todasNumeros = todasCotizaciones?.map(c => c.numero).filter(Boolean) || [];
      const sugerencias = todasNumeros
        .filter(num => {
          const numNorm = normalizarNumero(num);
          return numNorm.includes(numeroBuscadoNormalizado) || 
                 numeroBuscadoNormalizado.includes(numNorm) ||
                 num.toUpperCase().includes(numeroLimpio);
        })
        .slice(0, 10);
      
      console.log(`💡 Sugerencias generadas:`, sugerencias);
      
      return new Response(
        JSON.stringify({ 
          error: `Cotización "${numeroCotizacion}" no encontrada`,
          numeroBuscado: numeroLimpio,
          numeroBuscadoNormalizado: numeroBuscadoNormalizado,
          sugerencias: sugerencias,
          totalCotizaciones: todasCotizaciones?.length || 0,
          mensaje: `Se buscó "${numeroLimpio}" (normalizado: "${numeroBuscadoNormalizado}") pero no se encontró. 
          
Verifica que:
1. El número de cotización sea correcto (ej: KUB-1001, CASA-400)
2. La cotización exista en la base de datos
3. No haya espacios o caracteres extra en el número

Cotizaciones disponibles (primeras 20): ${todasNumeros.slice(0, 20).join(', ')}`
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Cotización encontrada: ${cotizacionData.id}`);
    console.log(`📋 Items actuales:`, cotizacionData.items?.length || 0);

    // 2. Obtener gastos reales de materiales usando cliente admin (bypass RLS)
    console.log(`🔍 Buscando gastos reales para cotización ID: ${cotizacionData.id}`);
    const { data: gastosRealesData, error: errorGastos } = await supabaseAdmin
      .from('gastos_reales_materiales')
      .select('*')
      .eq('cotizacion_id', cotizacionData.id)
      .order('fecha_compra', { ascending: false });
    
    if (errorGastos) {
      console.error('❌ Error al obtener gastos reales:', errorGastos);
      return new Response(
        JSON.stringify({ 
          error: `Error al obtener gastos reales: ${errorGastos.message}`,
          cotizacionId: cotizacionData.id
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const gastosReales = (gastosRealesData || []) as any[];
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
    // IMPORTANTE: Los gastos reales ya están registrados con la cantidad total (multiplicada por 15)
    // No necesitamos dividir y multiplicar de nuevo
    const materialesAgrupados = new Map<string, {
      material_nombre: string;
      cantidad_total: number; // Cantidad total ya multiplicada por 15
      precio_unitario: number;
      unidad: string;
    }>();

    gastosReales.forEach(gasto => {
      const key = gasto.material_nombre.toLowerCase();
      if (materialesAgrupados.has(key)) {
        const existente = materialesAgrupados.get(key)!;
        existente.cantidad_total += gasto.cantidad_real; // cantidad_real ya está multiplicada por 15
        // Usar el precio unitario más reciente
        existente.precio_unitario = gasto.precio_unitario_real;
      } else {
        materialesAgrupados.set(key, {
          material_nombre: gasto.material_nombre,
          cantidad_total: gasto.cantidad_real, // cantidad_real ya está multiplicada por 15
          precio_unitario: gasto.precio_unitario_real,
          unidad: gasto.unidad
        });
      }
    });

    console.log(`📊 Materiales agrupados de gastos reales: ${materialesAgrupados.size}`);
    console.log('📋 Lista de materiales en gastos reales (cantidad total para 15 unidades):');
    Array.from(materialesAgrupados.values()).forEach(mat => {
      console.log(`  - "${mat.material_nombre}" (${mat.cantidad_total} ${mat.unidad}) - Total para ${cantidadItem} unidades`);
    });

    // 5. Los materiales ya están con cantidad total (multiplicada por 15)
    // Solo calculamos cantidad por unidad para referencia, pero usamos cantidad_total para el costo
    const materialesPorUnidad = Array.from(materialesAgrupados.values()).map(mat => ({
      ...mat,
      cantidad_por_unidad: mat.cantidad_total / cantidadItem, // Solo para referencia
      cantidad_total: mat.cantidad_total, // Mantener cantidad total (ya multiplicada por 15)
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

    // 6. NO actualizar los items de la cotización - solo calcular comparación
    // Los materiales en la cotización deben mantenerse con sus valores cotizados originales
    // Solo calculamos los costos reales para comparación
    let materialesEncontrados = 0;
    let materialesNoEncontrados: string[] = [];
    
    // Calcular costos reales por item (sin modificar la cotización)
    const comparacionPorItem = items.map((item: any) => {
      const materialesCotizados = item.materiales || [];
      let costoMaterialesRealItem = 0;
      let materialesEncontradosItem = 0;
      
      // Si el item tiene materiales, buscar costos reales para comparación
      if (materialesCotizados.length > 0) {
        materialesCotizados.forEach((mat: any) => {
          const nombreMat = (mat.material_nombre || mat.nombre || '').trim();
          const nombreMatLower = nombreMat.toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/mm/g, 'mm')
            .replace(/litro/g, 'litro')
            .trim();
          
          const normalizarNombre = (nombre: string) => {
            return nombre.toLowerCase()
              .replace(/\s+/g, ' ')
              .replace(/mm/g, 'mm')
              .replace(/litro/g, 'litro')
              .trim();
          };
          
          // Buscar material real
          let materialReal = materialesPorUnidad.find(m => {
            return normalizarNombre(m.material_nombre) === nombreMatLower;
          });
          
          if (!materialReal) {
            materialReal = materialesPorUnidad.find(m => {
              const nombreReal = normalizarNombre(m.material_nombre);
              if (nombreMatLower.length >= 3 && nombreReal.length >= 3) {
                return nombreReal.includes(nombreMatLower) || nombreMatLower.includes(nombreReal);
              }
              return false;
            });
          }
          
          if (!materialReal) {
            const palabrasMat = nombreMatLower.split(/\s+/).filter(p => p.length >= 3);
            materialReal = materialesPorUnidad.find(m => {
              const nombreReal = normalizarNombre(m.material_nombre);
              const palabrasReal = nombreReal.split(/\s+/).filter(p => p.length >= 3);
              const coincidencias = palabrasMat.filter(p => palabrasReal.some(r => r.includes(p) || p.includes(r)));
              return coincidencias.length >= Math.min(2, palabrasMat.length);
            });
          }

          if (materialReal) {
            materialesEncontrados++;
            materialesEncontradosItem++;
            // IMPORTANTE: cantidad_total ya está multiplicada por 15 (viene de gastos reales)
            // No necesitamos multiplicar de nuevo
            const cantidadTotalMaterial = materialReal.cantidad_total; // Ya está multiplicada por 15
            const costoMaterial = cantidadTotalMaterial * materialReal.precio_unitario_por_unidad;
            costoMaterialesRealItem += costoMaterial;
            
            console.log(`  ✅ Item "${item.nombre || 'Sin nombre'}" - Material "${nombreMat}":`);
            console.log(`    - Cantidad por unidad (referencia): ${materialReal.cantidad_por_unidad} ${materialReal.unidad}`);
            console.log(`    - Cantidad total (ya multiplicada por ${cantidadItem}): ${cantidadTotalMaterial} ${materialReal.unidad}`);
            console.log(`    - Precio unitario real: $${materialReal.precio_unitario_por_unidad.toLocaleString('es-CO')}`);
            console.log(`    - Costo total material (${cantidadTotalMaterial} × $${materialReal.precio_unitario_por_unidad.toLocaleString('es-CO')}): $${costoMaterial.toLocaleString('es-CO')}`);
          } else {
            const nombreMat = (mat.material_nombre || mat.nombre || 'Sin nombre').trim();
            if (nombreMat && !materialesNoEncontrados.includes(nombreMat)) {
              materialesNoEncontrados.push(nombreMat);
            }
          }
        });
      }
      
      return {
        item_id: item.id || item.nombre,
        item_nombre: item.nombre || 'Sin nombre',
        precio_cotizado: item.precio_total || 0,
        costo_materiales_real: costoMaterialesRealItem,
        materiales_encontrados: materialesEncontradosItem
      };
    });

    // 7. NO recalcular desde materiales - usar el precio_total original del item
    // Los materiales pueden haber sido modificados, pero el precio_total del item es el que se cotizó
    console.log(`💰 Usando precio_total original de cada item (no recalcular desde materiales):`);
    
    items.forEach((item: any, idx: number) => {
      console.log(`  Item ${idx + 1} "${item.nombre || 'Sin nombre'}":`);
      console.log(`    - Precio total guardado: $${(item.precio_total || 0).toLocaleString('es-CO')}`);
      console.log(`    - Cantidad: ${item.cantidad || 1}`);
      if (item.precio_total && item.cantidad) {
        const precioUnitario = item.precio_total / item.cantidad;
        console.log(`    - Precio unitario (calculado): $${precioUnitario.toLocaleString('es-CO')}`);
      }
    });
    
    // Calcular subtotal desde items usando precio_total original (NO modificar items)
    const subtotalDesdeItems = items.reduce((sum: number, item: any) => {
      return sum + (item.precio_total || 0);
    }, 0);
    
    // Calcular IVA desde el subtotal
    const ivaPorcentaje = (cotizacionData as any).iva_porcentaje || 19;
    const iva = subtotalDesdeItems * (ivaPorcentaje / 100);
    
    // Calcular total final
    const total = subtotalDesdeItems + iva;
    
    const subtotal = subtotalDesdeItems;
    
    console.log(`💰 Recalculando totales desde items:`);
    console.log(`  - Subtotal desde items: $${subtotalDesdeItems.toLocaleString('es-CO')}`);
    console.log(`  - Subtotal guardado: $${(cotizacionData.subtotal || 0).toLocaleString('es-CO')}`);
    console.log(`  - Subtotal usado: $${subtotal.toLocaleString('es-CO')}`);
    console.log(`  - IVA (${ivaPorcentaje}%): $${iva.toLocaleString('es-CO')}`);
    console.log(`  - Total calculado: $${total.toLocaleString('es-CO')}`);
    console.log(`  - Total guardado: $${(cotizacionData.total || 0).toLocaleString('es-CO')}`);
    
    // Calcular costos reales totales desde la comparación
    const costoMaterialesRealTotal = comparacionPorItem.reduce((sum: number, comp: any) => {
      return sum + (comp.costo_materiales_real || 0);
    }, 0);
    
    // Calcular utilidad real (precio cotizado - costos reales)
    const utilidadReal = total - costoMaterialesRealTotal;

    console.log(`💰 Totales (mantienen precio cotizado original):`);
    console.log(`  - Subtotal cotizado: $${subtotal.toLocaleString('es-CO')}`);
    console.log(`  - IVA cotizado: $${iva.toLocaleString('es-CO')}`);
    console.log(`  - Total cotizado: $${total.toLocaleString('es-CO')}`);
    console.log(`  - Costo materiales real (×15 unidades): $${costoMaterialesRealTotal.toLocaleString('es-CO')}`);
    console.log(`  - Utilidad real (hasta ahora, solo materiales): $${utilidadReal.toLocaleString('es-CO')}`);

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

    // 8. PRIMERO: Actualizar la cotización con el total correcto calculado desde items
    // Esto corrige el problema de que el total guardado esté incorrecto
    console.log(`🔧 Actualizando cotización con total correcto calculado desde items...`);
    
    // Solo actualizar totales si el total calculado es diferente al guardado
    // NO modificar los items porque pueden tener materiales modificados
    const totalGuardado = cotizacionData.total || 0;
    const diferencia = Math.abs(total - totalGuardado);
    
    console.log(`📊 Comparación de totales:`);
    console.log(`  - Total guardado: $${totalGuardado.toLocaleString('es-CO')}`);
    console.log(`  - Total calculado desde items: $${total.toLocaleString('es-CO')}`);
    console.log(`  - Diferencia: $${diferencia.toLocaleString('es-CO')}`);
    
    // Solo actualizar si hay una diferencia significativa (más de $1000)
    const datosActualizacion: any = {
      // NO modificar items - mantenerlos como están
      subtotal: subtotal,
      iva: iva,
      total: total, // Actualizar total calculado desde precio_total de items
      updated_at: new Date().toISOString()
    };
    
    const { data: cotizacionActualizada, error: errorActualizacion } = await supabaseAdmin
      .from('cotizaciones')
      .update(datosActualizacion)
      .eq('id', cotizacionData.id)
      .select('*')
      .single();
    
    if (errorActualizacion) {
      console.error('❌ Error al actualizar cotización:', errorActualizacion);
      return new Response(
        JSON.stringify({ 
          error: `Error al actualizar la cotización: ${errorActualizacion.message}`,
          cotizacionId: cotizacionData.id
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ Cotización actualizada con total correcto: $${total.toLocaleString('es-CO')}`);

    console.log(`✅ Comparación calculada para cotización ${numeroCotizacion}`);
    console.log(`📝 Resumen de comparación:`);
    console.log(`  - Items analizados: ${items.length}`);
    console.log(`  - Materiales en gastos reales: ${materialesPorUnidad.length}`);
    console.log(`  - Materiales encontrados para comparación: ${materialesEncontrados}`);
    if (materialesNoEncontrados.length > 0) {
      console.log(`  - Materiales NO encontrados en items: ${materialesNoEncontrados.length}`);
      materialesNoEncontrados.forEach(nombre => {
        console.log(`    ⚠️ "${nombre}"`);
      });
    }
    console.log(`  - Total cotizado (mantiene original): $${total.toLocaleString('es-CO')}`);
    console.log(`  - Costo materiales real (×15 unidades): $${costoMaterialesRealTotal.toLocaleString('es-CO')}`);
    console.log(`  - Utilidad real (hasta ahora): $${utilidadReal.toLocaleString('es-CO')}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cotización ${numeroCotizacion} actualizada: Total corregido a $${total.toLocaleString('es-CO')} (calculado desde items)`,
        cotizacionId: cotizacionData.id,
        cantidadItem,
        materialesEnGastosReales: materialesPorUnidad.length,
        materialesActualizados: materialesEncontrados,
        materialesNoEncontrados: materialesNoEncontrados,
        comparacionPorItem: comparacionPorItem,
        totalCotizado: total, // Precio cotizado original (no cambia)
        costoMaterialesReal: costoMaterialesRealTotal, // Costo real de materiales (×15 unidades)
        utilidadReal: utilidadReal, // Utilidad real hasta ahora (solo materiales)
        totales: {
          subtotal,
          iva,
          total
        },
        materiales: materialesPorUnidad.map(m => ({
          nombre: m.material_nombre,
          cantidad_por_unidad: m.cantidad_por_unidad, // Solo para referencia
          cantidad_total: m.cantidad_total, // Cantidad total (multiplicada por 15)
          precio_unitario: m.precio_unitario_por_unidad,
          unidad: m.unidad,
          costo_total: m.cantidad_total * m.precio_unitario_por_unidad // Costo total del material
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

