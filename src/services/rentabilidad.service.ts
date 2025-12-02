/**
 * Servicio para calcular rentabilidad de proyectos
 */
import { obtenerCotizacionPorId } from './cotizaciones.service';
import { obtenerGastosRealesPorCotizacion } from './gastos-reales.service';
import { obtenerManoObraRealPorCotizacion } from './mano-obra-real.service';
import { obtenerGastosHormigaPorCotizacion } from './gastos-hormiga.service';
import { obtenerTransportesRealesPorCotizacion } from './transporte-real.service';
import type { Cotizacion } from '../types/database';

/**
 * Resumen de costos reales de una cotización
 */
export interface ResumenCostosReales {
  materiales: {
    total: number;
    items: number;
  };
  manoObra: {
    total: number;
    registros: number;
  };
  gastosHormiga: {
    total: number;
    registros: number;
  };
  transporte: {
    total: number;
    registros: number;
  };
  totalReal: number;
}

/**
 * Comparación presupuesto vs real
 */
export interface ComparacionPresupuestoReal {
  cotizacion: Cotizacion;
  costosReales: ResumenCostosReales;
  // Presupuestado (desde cotización)
  totalPresupuestado: number;
  subtotalMaterialesPresupuestado: number;
  subtotalServiciosPresupuestado: number;
  // Real
  totalReal: number;
  // Diferencia
  diferencia: number;
  diferenciaPorcentaje: number;
  // Utilidad
  utilidadPresupuestada: number;
  utilidadReal: number;
  diferenciaUtilidad: number;
  // Desglose por categoría
  materiales: {
    presupuestado: number;
    real: number;
    diferencia: number;
    diferenciaPorcentaje: number;
  };
  servicios: {
    presupuestado: number;
    real: number;
    diferencia: number;
    diferenciaPorcentaje: number;
  };
  gastosHormiga: {
    presupuestado: number; // Siempre 0
    real: number;
    diferencia: number;
  };
  transporte: {
    presupuestado: number; // Puede estar en servicios o ser 0
    real: number;
    diferencia: number;
  };
}

/**
 * Obtiene el resumen de costos reales de una cotización
 */
export async function obtenerResumenCostosReales(cotizacionId: string): Promise<ResumenCostosReales> {
  // Obtener la cotización para saber la cantidad del item
  const cotizacion = await obtenerCotizacionPorId(cotizacionId);
  
  // Obtener la cantidad del item (los gastos reales están registrados para 1 unidad)
  let cantidadItem = 1;
  if (cotizacion?.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    const itemConCantidad = cotizacion.items.find((item: any) => item.cantidad && item.cantidad > 1);
    if (itemConCantidad) {
      cantidadItem = itemConCantidad.cantidad;
    }
  }
  
  const [
    gastosMateriales,
    manoObra,
    gastosHormiga,
    transportes
  ] = await Promise.all([
    obtenerGastosRealesPorCotizacion(cotizacionId),
    obtenerManoObraRealPorCotizacion(cotizacionId),
    obtenerGastosHormigaPorCotizacion(cotizacionId),
    obtenerTransportesRealesPorCotizacion(cotizacionId)
  ]);

  // IMPORTANTE: Los gastos reales están registrados para 1 unidad
  // Necesitamos multiplicarlos por la cantidad del item
  const totalMaterialesPorUnidad = gastosMateriales.reduce((sum, g) => {
    return sum + (g.cantidad_real * g.precio_unitario_real);
  }, 0);
  const totalMateriales = totalMaterialesPorUnidad * cantidadItem;

  const totalManoObraPorUnidad = manoObra.reduce((sum, m) => sum + m.total_pagado, 0);
  const totalManoObra = totalManoObraPorUnidad * cantidadItem;
  
  const totalGastosHormigaPorUnidad = gastosHormiga.reduce((sum, g) => sum + g.monto, 0);
  const totalGastosHormiga = totalGastosHormigaPorUnidad * cantidadItem;
  
  const totalTransportePorUnidad = transportes.reduce((sum, t) => sum + t.costo, 0);
  const totalTransporte = totalTransportePorUnidad * cantidadItem;

  return {
    materiales: {
      total: totalMateriales,
      items: gastosMateriales.length
    },
    manoObra: {
      total: totalManoObra,
      registros: manoObra.length
    },
    gastosHormiga: {
      total: totalGastosHormiga,
      registros: gastosHormiga.length
    },
    transporte: {
      total: totalTransporte,
      registros: transportes.length
    },
    totalReal: totalMateriales + totalManoObra + totalGastosHormiga + totalTransporte
  };
}

/**
 * Calcula el total desde los items (igual que en HistorialCotizaciones)
 */
function calcularTotalDesdeItems(cotizacion: any): number {
  // Si hay items guardados, calcular desde items (más preciso)
  if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    const subtotal = cotizacion.items.reduce((sum: number, item: any) => {
      return sum + (item.precio_total || 0);
    }, 0);
    
    // Aplicar descuento si existe
    const descuento = cotizacion.descuento || 0;
    const descuentoMonto = subtotal * (descuento / 100);
    const subtotalConDescuento = subtotal - descuentoMonto;
    
    // Calcular IVA (usar el IVA de la cotización o 19% por defecto)
    const ivaPorcentaje = cotizacion.iva_porcentaje || 19;
    const iva = subtotalConDescuento * (ivaPorcentaje / 100);
    
    // Total final
    return subtotalConDescuento + iva;
  }
  
  // Fallback: usar total guardado
  return cotizacion.total || 0;
}

/**
 * Calcula subtotales de materiales y servicios desde los items
 * IMPORTANTE: Multiplica por la cantidad del item
 */
function calcularSubtotalesDesdeItems(cotizacion: any): {
  subtotalMateriales: number;
  subtotalServicios: number;
  costoBase: number;
} {
  console.log('🔧 [calcularSubtotalesDesdeItems] Iniciando cálculo...');
  let subtotalMateriales = 0;
  let subtotalServicios = 0;

  if (cotizacion.items && Array.isArray(cotizacion.items)) {
    cotizacion.items.forEach((item: any, itemIndex: number) => {
      // Obtener la cantidad del item (por defecto 1)
      const cantidadItem = item.cantidad || 1;
      
      console.log(`  📦 Item ${itemIndex + 1} "${item.nombre || 'Sin nombre'}": cantidad = ${cantidadItem}`);
      
      // IMPORTANTE: Los materiales en los items están guardados con cantidades POR UNIDAD
      // Necesitamos multiplicar por la cantidad del item para obtener el total
      if (item.materiales && Array.isArray(item.materiales)) {
        // Calcular costo de materiales del item
        let costoMaterialesItemPorUnidad = 0;
        item.materiales.forEach((mat: any, matIndex: number) => {
          const cantidadMat = mat.cantidad || 0;
          const precioUnitario = mat.precio_unitario || 0;
          const costoMat = cantidadMat * precioUnitario;
          costoMaterialesItemPorUnidad += costoMat;
          console.log(`      Material ${matIndex + 1} "${mat.material_nombre || mat.nombre || 'Sin nombre'}":`);
          console.log(`        - Cantidad por unidad: ${cantidadMat} ${mat.unidad || 'unidad'}`);
          console.log(`        - Precio unitario: $${precioUnitario.toLocaleString('es-CO')}`);
          console.log(`        - Costo por unidad: $${costoMat.toLocaleString('es-CO')}`);
        });
        
        const costoMaterialesItemTotal = costoMaterialesItemPorUnidad * cantidadItem;
        console.log(`    - Materiales por unidad (suma): $${costoMaterialesItemPorUnidad.toLocaleString('es-CO')}`);
        console.log(`    - Materiales total (×${cantidadItem} unidades): $${costoMaterialesItemTotal.toLocaleString('es-CO')}`);
        // Multiplicar por la cantidad del item para obtener el costo total de materiales
        subtotalMateriales += costoMaterialesItemTotal;
      } else {
        console.log(`    - Item sin materiales`);
      }

      // IMPORTANTE: Los servicios en los items están guardados con horas POR UNIDAD
      // Necesitamos multiplicar por la cantidad del item para obtener el total
      if (item.servicios && Array.isArray(item.servicios)) {
        const costoServiciosItemPorUnidad = item.servicios.reduce((sum: number, serv: any) => {
          // serv.horas es las horas por unidad del item
          return sum + ((serv.horas || 0) * (serv.precio_por_hora || 0));
        }, 0);
        const costoServiciosItemTotal = costoServiciosItemPorUnidad * cantidadItem;
        console.log(`    - Servicios por unidad: $${costoServiciosItemPorUnidad.toLocaleString('es-CO')}`);
        console.log(`    - Servicios total (×${cantidadItem}): $${costoServiciosItemTotal.toLocaleString('es-CO')}`);
        // Multiplicar por la cantidad del item para obtener el costo total de servicios
        subtotalServicios += costoServiciosItemTotal;
      }
    });
    
    console.log(`  📊 Totales calculados:`);
    console.log(`    - Subtotal Materiales: $${subtotalMateriales.toLocaleString('es-CO')}`);
    console.log(`    - Subtotal Servicios: $${subtotalServicios.toLocaleString('es-CO')}`);
  } else {
    // Fallback: usar valores guardados
    subtotalMateriales = cotizacion.subtotal_materiales || 0;
    subtotalServicios = cotizacion.subtotal_servicios || 0;
  }

  const costoBase = subtotalMateriales + subtotalServicios;

  return {
    subtotalMateriales,
    subtotalServicios,
    costoBase
  };
}

/**
 * Obtiene la comparación completa presupuesto vs real
 */
export async function obtenerComparacionPresupuestoReal(cotizacionId: string): Promise<ComparacionPresupuestoReal> {
  const cotizacion = await obtenerCotizacionPorId(cotizacionId);
  if (!cotizacion) {
    throw new Error('Cotización no encontrada');
  }

  const costosReales = await obtenerResumenCostosReales(cotizacionId);

  // Calcular presupuestado desde items (igual que en historial)
  const totalPresupuestado = calcularTotalDesdeItems(cotizacion);
  
  // Calcular subtotales desde items
  const { subtotalMateriales: subtotalMaterialesPresupuestado, subtotalServicios: subtotalServiciosPresupuestado, costoBase: costoBasePresupuestado } = calcularSubtotalesDesdeItems(cotizacion);
  
  // Debug: Log de valores calculados
  console.log('🔍 [Rentabilidad] Valores calculados:');
  console.log('  - Subtotal Materiales Presupuestado:', subtotalMaterialesPresupuestado);
  console.log('  - Subtotal Servicios Presupuestado:', subtotalServiciosPresupuestado);
  console.log('  - Costo Base Presupuestado:', costoBasePresupuestado);
  console.log('  - Costos Reales Materiales:', costosReales.materiales.total);
  console.log('  - Costos Reales Mano Obra:', costosReales.manoObra.total);
  console.log('  - Costos Reales Total:', costosReales.totalReal);

  // Calcular IVA presupuestado
  const descuento = cotizacion.descuento || 0;
  const subtotal = cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0
    ? cotizacion.items.reduce((sum: number, item: any) => sum + (item.precio_total || 0), 0)
    : (cotizacion.subtotal || 0);
  const descuentoMonto = subtotal * (descuento / 100);
  const subtotalConDescuento = subtotal - descuentoMonto;
  const ivaPorcentaje = cotizacion.iva_porcentaje || 19;
  const ivaPresupuestado = subtotalConDescuento * (ivaPorcentaje / 100);

  // Utilidad presupuestada = total - costo base - IVA
  const utilidadPresupuestada = totalPresupuestado - costoBasePresupuestado - ivaPresupuestado;

  // Utilidad real = total cotizado - total real gastado (incluyendo todos los costos)
  const utilidadReal = totalPresupuestado - costosReales.totalReal;

  // Diferencia de costos base (solo materiales + servicios vs materiales + mano de obra)
  // NO incluir gastos hormiga ni transporte porque no están presupuestados
  const costoRealBase = costosReales.materiales.total + costosReales.manoObra.total;
  const diferencia = costoRealBase - costoBasePresupuestado;
  const diferenciaPorcentaje = costoBasePresupuestado > 0
    ? (diferencia / costoBasePresupuestado) * 100
    : 0;

  // Desglose por categoría
  const diferenciaMateriales = costosReales.materiales.total - subtotalMaterialesPresupuestado;
  const diferenciaServicios = costosReales.manoObra.total - subtotalServiciosPresupuestado;

  return {
    cotizacion,
    costosReales,
    totalPresupuestado,
    subtotalMaterialesPresupuestado,
    subtotalServiciosPresupuestado,
    totalReal: costosReales.totalReal,
    diferencia,
    diferenciaPorcentaje,
    utilidadPresupuestada,
    utilidadReal,
    diferenciaUtilidad: utilidadReal - utilidadPresupuestada,
    materiales: {
      presupuestado: subtotalMaterialesPresupuestado,
      real: costosReales.materiales.total,
      diferencia: diferenciaMateriales,
      diferenciaPorcentaje: subtotalMaterialesPresupuestado > 0
        ? (diferenciaMateriales / subtotalMaterialesPresupuestado) * 100
        : 0
    },
    servicios: {
      presupuestado: subtotalServiciosPresupuestado,
      real: costosReales.manoObra.total,
      diferencia: diferenciaServicios,
      diferenciaPorcentaje: subtotalServiciosPresupuestado > 0
        ? (diferenciaServicios / subtotalServiciosPresupuestado) * 100
        : 0
    },
    gastosHormiga: {
      presupuestado: 0,
      real: costosReales.gastosHormiga.total,
      diferencia: costosReales.gastosHormiga.total
    },
    transporte: {
      presupuestado: 0, // Asumimos que no está presupuestado por separado
      real: costosReales.transporte.total,
      diferencia: costosReales.transporte.total
    }
  };
}

/**
 * Obtiene estadísticas de rentabilidad de todas las cotizaciones aceptadas
 */
export async function obtenerEstadisticasRentabilidad(): Promise<{
  totalProyectos: number;
  proyectosConCostos: number;
  utilidadTotal: number;
  utilidadPromedio: number;
  proyectosRentables: number;
  proyectosConPerdidas: number;
  totalGastosHormiga: number;
  proyectos: Array<{
    cotizacion_id: string;
    numero: string;
    cliente_nombre: string;
    total_cotizado: number;
    total_real: number;
    utilidad: number;
    porcentaje_utilidad: number;
  }>;
}> {
  // Obtener todas las cotizaciones aceptadas
  const { obtenerCotizaciones } = await import('./cotizaciones.service');
  const cotizaciones = await obtenerCotizaciones();
  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada');

  // Calcular rentabilidad para cada una
  const proyectos = await Promise.all(
    cotizacionesAceptadas.map(async (cotizacion) => {
      try {
        const costosReales = await obtenerResumenCostosReales(cotizacion.id);
        const totalCotizado = cotizacion.total || 0;
        const totalReal = costosReales.totalReal;
        const utilidad = totalCotizado - totalReal;
        const porcentajeUtilidad = totalCotizado > 0
          ? (utilidad / totalCotizado) * 100
          : 0;

        return {
          cotizacion_id: cotizacion.id,
          numero: cotizacion.numero,
          cliente_nombre: cotizacion.cliente_nombre,
          total_cotizado: totalCotizado,
          total_real: totalReal,
          utilidad,
          porcentaje_utilidad: porcentajeUtilidad
        };
      } catch (error) {
        // Si hay error, retornar datos básicos
        return {
          cotizacion_id: cotizacion.id,
          numero: cotizacion.numero,
          cliente_nombre: cotizacion.cliente_nombre,
          total_cotizado: cotizacion.total || 0,
          total_real: 0,
          utilidad: cotizacion.total || 0,
          porcentaje_utilidad: 100
        };
      }
    })
  );

  const proyectosConCostos = proyectos.filter(p => p.total_real > 0);
  const utilidadTotal = proyectos.reduce((sum, p) => sum + p.utilidad, 0);
  const utilidadPromedio = proyectos.length > 0 ? utilidadTotal / proyectos.length : 0;
  const proyectosRentables = proyectos.filter(p => p.utilidad > 0).length;
  const proyectosConPerdidas = proyectos.filter(p => p.utilidad < 0).length;

  // Calcular total de gastos hormiga
  let totalGastosHormiga = 0;
  for (const cotizacion of cotizacionesAceptadas) {
    try {
      const gastos = await obtenerGastosHormigaPorCotizacion(cotizacion.id);
      totalGastosHormiga += gastos.reduce((sum, g) => sum + g.monto, 0);
    } catch (error) {
      // Continuar si hay error
    }
  }

  return {
    totalProyectos: cotizacionesAceptadas.length,
    proyectosConCostos: proyectosConCostos.length,
    utilidadTotal,
    utilidadPromedio,
    proyectosRentables,
    proyectosConPerdidas,
    totalGastosHormiga,
    proyectos: proyectos.sort((a, b) => b.utilidad - a.utilidad) // Ordenar por utilidad descendente
  };
}

