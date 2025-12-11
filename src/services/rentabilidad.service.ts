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
  // IVA
  ivaPresupuestado: number;
  ivaReal: number;
  // Desglose por categoría
  materiales: {
    presupuestado: number;
    real: number;
    diferencia: number;
    diferenciaPorcentaje: number | null; // null si no hay datos presupuestados
    sinDatosPresupuestados?: boolean;
  };
  servicios: {
    presupuestado: number;
    real: number;
    diferencia: number;
    diferenciaPorcentaje: number | null; // null si no hay datos presupuestados
    sinDatosPresupuestados?: boolean;
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

  // IMPORTANTE: Calcular totales considerando el alcance_gasto de cada gasto
  const totalMateriales = gastosMateriales.reduce((sum, g) => {
    const costoPorUnidad = g.cantidad_real * g.precio_unitario_real;
    let multiplicador = 1;
    
    if (g.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (g.alcance_gasto === 'parcial') {
      multiplicador = g.cantidad_items_aplicados || 1;
    } else if (g.alcance_gasto === 'total') {
      multiplicador = 1;
    } else {
      // Por defecto (gastos antiguos sin alcance_gasto): asumir total
      multiplicador = 1;
    }
    
    return sum + (costoPorUnidad * multiplicador);
  }, 0);

  const totalManoObra = manoObra.reduce((sum, m) => {
    // Usar monto_manual si está disponible y tipo_calculo es 'monto', sino usar total_pagado
    const costoPorUnidad = (m.tipo_calculo === 'monto' && m.monto_manual) 
      ? m.monto_manual 
      : (m.total_pagado || 0);
    let multiplicador = 1;
    
    if (m.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (m.alcance_gasto === 'parcial') {
      multiplicador = m.cantidad_items_aplicados || 1;
    } else if (m.alcance_gasto === 'total') {
      multiplicador = 1;
    } else {
      // Por defecto: asumir total
      multiplicador = 1;
    }
    
    return sum + (costoPorUnidad * multiplicador);
  }, 0);
  
  const totalGastosHormiga = gastosHormiga.reduce((sum, g) => {
    const costoPorUnidad = g.monto || 0;
    let multiplicador = 1;
    
    if (g.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (g.alcance_gasto === 'parcial') {
      multiplicador = g.cantidad_items_aplicados || 1;
    } else if (g.alcance_gasto === 'total') {
      multiplicador = 1;
    } else {
      // Por defecto: asumir total
      multiplicador = 1;
    }
    
    return sum + (costoPorUnidad * multiplicador);
  }, 0);
  
  const totalTransporte = transportes.reduce((sum, t) => {
    const costoPorUnidad = t.costo || 0;
    let multiplicador = 1;
    
    if (t.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (t.alcance_gasto === 'parcial') {
      multiplicador = t.cantidad_items_aplicados || 1;
    } else if (t.alcance_gasto === 'total') {
      multiplicador = 1;
    } else {
      // Por defecto: asumir total
      multiplicador = 1;
    }
    
    return sum + (costoPorUnidad * multiplicador);
  }, 0);
  
  console.log('📊 [rentabilidad.service] Costos calculados con alcance_gasto:');
  console.log('  - Materiales:', totalMateriales);
  console.log('  - Mano Obra:', totalManoObra);
  console.log('  - Gastos Hormiga:', totalGastosHormiga);
  console.log('  - Transporte:', totalTransporte);

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

  // PRIORIDAD 1: Usar materiales de la raíz de la cotización si están disponibles
  // Estos materiales ya tienen las cantidades totales (multiplicadas por la cantidad del item)
  if (cotizacion.materiales && Array.isArray(cotizacion.materiales) && cotizacion.materiales.length > 0) {
    console.log('📦 Usando materiales de la raíz de la cotización (cantidades totales)');
    subtotalMateriales = cotizacion.materiales.reduce((sum: number, mat: any) => {
      const cantidad = mat.cantidad || 0;
      const precioUnitario = mat.precio_unitario || 0;
      const costo = cantidad * precioUnitario;
      console.log(`  - ${mat.material_id || 'Material'}: ${cantidad} × $${precioUnitario.toLocaleString('es-CO')} = $${costo.toLocaleString('es-CO')}`);
      return sum + costo;
    }, 0);
    console.log(`  ✅ Subtotal Materiales (desde raíz): $${subtotalMateriales.toLocaleString('es-CO')}`);
  } else if (cotizacion.items && Array.isArray(cotizacion.items)) {
    // PRIORIDAD 2: Calcular desde items (multiplicar por cantidad del item)
    console.log(`📋 Total de items: ${cotizacion.items.length}`);
    cotizacion.items.forEach((item: any, itemIndex: number) => {
      // Obtener la cantidad del item (por defecto 1)
      let cantidadItem = item.cantidad;
      if (!cantidadItem || cantidadItem <= 0) {
        cantidadItem = item.cantidad_item || item.cantidadItem || 1;
      }
      if (!cantidadItem || cantidadItem <= 0) {
        cantidadItem = 1;
      }
      
      console.log(`  📦 Item ${itemIndex + 1} "${item.nombre || 'Sin nombre'}": cantidad = ${cantidadItem}`);
      
      // IMPORTANTE: Los materiales en los items están guardados con cantidades POR UNIDAD
      // Necesitamos multiplicar por la cantidad del item para obtener el total
      if (item.materiales && Array.isArray(item.materiales)) {
        console.log(`    📦 Total de materiales en item: ${item.materiales.length}`);
        // Calcular costo de materiales del item
        let costoMaterialesItemPorUnidad = 0;
        item.materiales.forEach((mat: any, matIndex: number) => {
          const cantidadMat = mat.cantidad || 0;
          const precioUnitario = mat.precio_unitario || 0;
          const costoMat = cantidadMat * precioUnitario;
          costoMaterialesItemPorUnidad += costoMat;
        });
        
        const costoMaterialesItemTotal = costoMaterialesItemPorUnidad * cantidadItem;
        console.log(`    - Materiales por unidad (suma): $${costoMaterialesItemPorUnidad.toLocaleString('es-CO')}`);
        console.log(`    - Materiales total (×${cantidadItem} unidades): $${costoMaterialesItemTotal.toLocaleString('es-CO')}`);
        // Multiplicar por la cantidad del item para obtener el costo total de materiales
        subtotalMateriales += costoMaterialesItemTotal;
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
  }

  // PRIORIDAD 3: Usar servicios de la raíz de la cotización si están disponibles
  if (cotizacion.servicios && Array.isArray(cotizacion.servicios) && cotizacion.servicios.length > 0) {
    console.log('🔧 Usando servicios de la raíz de la cotización (horas totales)');
    const costoServiciosDesdeRaiz = cotizacion.servicios.reduce((sum: number, serv: any) => {
      const horas = serv.horas || 0;
      const precioPorHora = serv.precio_por_hora || 0;
      const costo = horas * precioPorHora;
      return sum + costo;
    }, 0);
    // Solo usar si no se calculó desde items
    if (subtotalServicios === 0) {
      subtotalServicios = costoServiciosDesdeRaiz;
      console.log(`  ✅ Subtotal Servicios (desde raíz): $${subtotalServicios.toLocaleString('es-CO')}`);
    }
  }

  // Fallback: usar valores guardados en la base de datos
  if (subtotalMateriales === 0) {
    subtotalMateriales = cotizacion.subtotal_materiales || 0;
    console.log(`⚠️ Usando subtotal_materiales de DB: $${subtotalMateriales.toLocaleString('es-CO')}`);
  }
  if (subtotalServicios === 0) {
    subtotalServicios = cotizacion.subtotal_servicios || 0;
    console.log(`⚠️ Usando subtotal_servicios de DB: $${subtotalServicios.toLocaleString('es-CO')}`);
  }
    
  console.log(`  📊 Totales calculados:`);
  console.log(`    - Subtotal Materiales: $${subtotalMateriales.toLocaleString('es-CO')}`);
  console.log(`    - Subtotal Servicios: $${subtotalServicios.toLocaleString('es-CO')}`);

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

  // Calcular IVA presupuestado (valor fijo e inamovible)
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

  // IVA real = IVA presupuestado (valor fijo, no se calcula desde facturas)
  // Las facturas son solo registro administrativo, no afectan los cálculos
  const ivaReal = ivaPresupuestado;

  // Total real gastado = costos reales + IVA presupuestado
  // El IVA presupuestado se suma al total real gastado
  const totalRealGastado = costosReales.totalReal + ivaReal;

  // Utilidad real = total cotizado - total real gastado (incluyendo IVA)
  // El IVA se resta de la utilidad porque es parte del costo real
  const utilidadReal = totalPresupuestado - totalRealGastado;
  
  console.log('💰 [Rentabilidad] Cálculos con IVA:');
  console.log('  - IVA Presupuestado (fijo):', ivaPresupuestado);
  console.log('  - IVA Real (igual al presupuestado):', ivaReal);
  console.log('  - Total Real Gastado (con IVA):', totalRealGastado);
  console.log('  - Utilidad Real (después de IVA):', utilidadReal);

  // Verificar si hay datos presupuestados reales (no solo valores mínimos)
  // Si el presupuestado es muy bajo (< 1000), probablemente no hay datos reales
  const UMBRAL_SIN_DATOS = 1000; // Umbral para considerar que no hay datos presupuestados
  const tieneDatosMateriales = subtotalMaterialesPresupuestado >= UMBRAL_SIN_DATOS;
  const tieneDatosServicios = subtotalServiciosPresupuestado >= UMBRAL_SIN_DATOS;
  const tieneDatosCostos = costoBasePresupuestado >= UMBRAL_SIN_DATOS;

  // Verificar flags sin_datos_costos en items
  let sinDatosCostosMateriales = false;
  let sinDatosCostosManoObra = false;
  
  if (cotizacion?.items && Array.isArray(cotizacion.items)) {
    const itemsConSinDatos = cotizacion.items.filter((item: any) => item.sin_datos_costos);
    if (itemsConSinDatos.length > 0) {
      sinDatosCostosMateriales = itemsConSinDatos.some((item: any) => item.sin_datos_costos?.materiales);
      sinDatosCostosManoObra = itemsConSinDatos.some((item: any) => item.sin_datos_costos?.mano_obra);
    }
  }

  // Diferencia de costos base (solo materiales + servicios vs materiales + mano de obra)
  // NO incluir gastos hormiga ni transporte porque no están presupuestados
  const costoRealBase = costosReales.materiales.total + costosReales.manoObra.total;
  const diferencia = costoRealBase - costoBasePresupuestado;
  
  // Solo calcular diferencia porcentaje si hay datos presupuestados reales
  const diferenciaPorcentaje = (tieneDatosCostos && !sinDatosCostosMateriales && !sinDatosCostosManoObra && costoBasePresupuestado > 0)
    ? (diferencia / costoBasePresupuestado) * 100
    : null; // null indica que no hay datos para comparar

  // Desglose por categoría
  const diferenciaMateriales = costosReales.materiales.total - subtotalMaterialesPresupuestado;
  const diferenciaServicios = costosReales.manoObra.total - subtotalServiciosPresupuestado;

  return {
    cotizacion,
    costosReales,
    totalPresupuestado,
    subtotalMaterialesPresupuestado,
    subtotalServiciosPresupuestado,
    totalReal: totalRealGastado, // Incluye IVA real
    diferencia,
    diferenciaPorcentaje,
    sinDatosPresupuestados: !tieneDatosCostos || sinDatosCostosMateriales || sinDatosCostosManoObra,
    utilidadPresupuestada,
    utilidadReal, // Ya incluye la resta del IVA
    diferenciaUtilidad: utilidadReal - utilidadPresupuestada,
    ivaPresupuestado,
    ivaReal,
    materiales: {
      presupuestado: subtotalMaterialesPresupuestado,
      real: costosReales.materiales.total,
      diferencia: diferenciaMateriales,
      diferenciaPorcentaje: (tieneDatosMateriales && !sinDatosCostosMateriales && subtotalMaterialesPresupuestado > 0)
        ? (diferenciaMateriales / subtotalMaterialesPresupuestado) * 100
        : null, // null indica que no hay datos para comparar
      sinDatosPresupuestados: !tieneDatosMateriales || sinDatosCostosMateriales
    },
    servicios: {
      presupuestado: subtotalServiciosPresupuestado,
      real: costosReales.manoObra.total,
      diferencia: diferenciaServicios,
      diferenciaPorcentaje: (tieneDatosServicios && !sinDatosCostosManoObra && subtotalServiciosPresupuestado > 0)
        ? (diferenciaServicios / subtotalServiciosPresupuestado) * 100
        : null, // null indica que no hay datos para comparar
      sinDatosPresupuestados: !tieneDatosServicios || sinDatosCostosManoObra
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

