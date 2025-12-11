/**
 * Script para actualizar una cotización con materiales desde costos reales
 * Aplica los materiales registrados en costos reales a la cotización original
 * Multiplicando por la cantidad del item (ej: 15 unidades)
 */
import { supabase } from '../utils/supabase';
import { obtenerGastosRealesPorCotizacion } from '../services/gastos-reales.service';
import { obtenerCotizacionPorId, actualizarCotizacion } from '../services/cotizaciones.service';

async function actualizarCotizacionDesdeCostosReales(numeroCotizacion: string) {
  try {
    console.log(`🔍 Buscando cotización: ${numeroCotizacion}`);
    
    // 1. Buscar la cotización por número
    const { data: cotizacionData, error: errorCotizacion } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('numero', numeroCotizacion)
      .single();

    if (errorCotizacion || !cotizacionData) {
      throw new Error(`Cotización ${numeroCotizacion} no encontrada: ${errorCotizacion?.message}`);
    }

    console.log(`✅ Cotización encontrada: ${cotizacionData.id}`);
    console.log(`📋 Items actuales:`, cotizacionData.items?.length || 0);

    // 2. Obtener gastos reales de materiales
    const gastosReales = await obtenerGastosRealesPorCotizacion(cotizacionData.id);
    console.log(`💰 Gastos reales encontrados: ${gastosReales.length}`);

    if (gastosReales.length === 0) {
      console.log('⚠️ No hay gastos reales registrados para esta cotización');
      return;
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
        // Usar el precio unitario más reciente o promedio
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
      console.log(`  - ${mat.material_nombre}: ${mat.cantidad_por_unidad} ${mat.unidad} × $${mat.precio_unitario_por_unidad.toLocaleString('es-CO')} = $${(mat.cantidad_por_unidad * mat.precio_unitario_por_unidad).toLocaleString('es-CO')}`);
    });

    // 6. Actualizar los items de la cotización con los materiales reales
    const itemsActualizados = items.map((item: any) => {
      // Si el item tiene materiales, actualizarlos
      if (item.materiales && Array.isArray(item.materiales)) {
        const materialesActualizados = item.materiales.map((mat: any) => {
          const materialReal = materialesPorUnidad.find(m => 
            m.material_nombre.toLowerCase() === (mat.material_nombre || mat.nombre || '').toLowerCase()
          );

          if (materialReal) {
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

        return {
          ...item,
          materiales: materialesActualizados
        };
      }
      return item;
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
    console.log(`📝 Materiales actualizados con valores reales (ajustados para ${cantidadItem} unidades)`);

  } catch (error: any) {
    console.error('❌ Error al actualizar cotización:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const numeroCotizacion = process.argv[2] || 'kub-1001';
  actualizarCotizacionDesdeCostosReales(numeroCotizacion)
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { actualizarCotizacionDesdeCostosReales };







