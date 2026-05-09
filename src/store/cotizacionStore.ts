/**
 * Store de Zustand para gestionar el estado de la cotización
 * Con persistencia en localStorage para que no se pierda al salir
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  ItemCotizacion, 
  MuebleCotizacion, 
  ItemManualCotizacion,
  EstadoCotizacion, 
  Mueble, 
  OpcionesMueble,
  MaterialMueble,
  MedidasMueble
} from '../types/muebles';
import { calcularPrecioFinal } from '../utils/calcularPrecioMueble';

type NuevoItemManualCotizacion = Omit<ItemManualCotizacion, 'id' | 'precio_unitario' | 'precio_total'> & Partial<Pick<ItemManualCotizacion, 'precio_unitario' | 'precio_total'>>;

interface CotizacionStore extends EstadoCotizacion {
  // Acciones para muebles del catálogo
  agregarMueble: (mueble: Mueble, opciones: OpcionesMueble, cantidad: number) => void;
  
  // Acciones para items manuales
  agregarItemManual: (item: NuevoItemManualCotizacion) => void;
  
  // Acciones generales
  eliminarItem: (id: string) => void;
  actualizarCantidad: (id: string, cantidad: number) => void;
  actualizarOpciones: (id: string, opciones: OpcionesMueble) => void;
  actualizarItemManual: (id: string, updates: Partial<ItemManualCotizacion>) => void;
  setDescuento: (descuento: number) => void;
  setAplicaIVA: (aplica: boolean) => void;
  limpiarCotizacion: () => void;
  calcularTotales: () => void;
}

/**
 * Calcula el precio de un item manual con la misma lógica del formulario.
 * La utilidad/margen se aplica solo sobre materiales + costos indirectos.
 */
function calcularPrecioItemManual(
  itemData: Pick<ItemManualCotizacion,
    'materiales' |
    'servicios' |
    'margen_ganancia' |
    'gastos_extras' |
    'descuento' |
    'costos_indirectos' |
    'porcentaje_mano_obra'
  >
): number {
  const costoMateriales = (itemData.materiales || []).reduce((sum, mat) => {
    return sum + ((mat.cantidad || 0) * (mat.precio_unitario || 0));
  }, 0);

  const costoServicios = (itemData.servicios || []).reduce((sum, serv) => {
    const montoManual = (serv as any).monto_manual;
    if (typeof montoManual === 'number' && montoManual > 0) {
      return sum + montoManual;
    }

    return sum + ((serv.horas || 0) * (serv.precio_por_hora || 0));
  }, 0);

  const costosIndirectos = itemData.costos_indirectos
    ? (itemData.costos_indirectos.transporte || 0) +
      (itemData.costos_indirectos.herramientas || 0) +
      (itemData.costos_indirectos.alquiler_espacio || 0) +
      (itemData.costos_indirectos.caja_chica || 0)
    : 0;

  const subtotalBaseUtilidad = costoMateriales + costosIndirectos;
  const porcentajeManoObraValor = costoServicios * ((itemData.porcentaje_mano_obra || 0) / 100);

  let gastosExtrasValor = 0;
  if (typeof itemData.gastos_extras === 'number') {
    gastosExtrasValor = subtotalBaseUtilidad * (itemData.gastos_extras / 100);
  } else if (Array.isArray(itemData.gastos_extras)) {
    gastosExtrasValor = itemData.gastos_extras.reduce((sum, gasto) => sum + (gasto.monto || 0), 0);
  }

  const margenGanancia = itemData.margen_ganancia ?? 30;
  const margenGananciaValor = subtotalBaseUtilidad * (margenGanancia / 100);

  const precioConMargen = subtotalBaseUtilidad + margenGananciaValor + costoServicios + porcentajeManoObraValor + gastosExtrasValor;
  const precioFinal = itemData.descuento && itemData.descuento > 0
    ? precioConMargen * (1 - itemData.descuento / 100)
    : precioConMargen;

  return Math.round(precioFinal * 100) / 100;
}

const calcularTotales = (
  items: ItemCotizacion[],
  descuento: number,
  aplicaIVA: boolean = true,
  ivaPorcentaje: number = 19
): Partial<EstadoCotizacion> => {
  const subtotal = items.reduce((sum, item) => sum + item.precio_total, 0);
  const descuentoMonto = subtotal * (descuento / 100);
  const subtotalConDescuento = subtotal - descuentoMonto;
  const ivaMonto = aplicaIVA ? (subtotalConDescuento * (ivaPorcentaje / 100)) : 0;
  const total = subtotalConDescuento + ivaMonto;

  return {
    subtotal,
    iva: ivaMonto,
    total
  };
};

export const useCotizacionStore = create<CotizacionStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      subtotal: 0,
      descuento: 0,
      aplica_iva: true,
      iva: 0,
      total: 0,

  // Agregar mueble del catálogo a la cotización
  agregarMueble: (mueble, opciones, cantidad) => {
    // El precio_base del catálogo ya tiene todo calculado
    // Solo aplicar multiplicadores de opciones (color, material, encimera) si hay opciones seleccionadas
    // NO recalcular basándose en materiales_predeterminados - esos son solo informativos
    let precioUnitario = calcularPrecioFinal(mueble, opciones);

    const precioTotal = precioUnitario * cantidad;

    const nuevoItem: MuebleCotizacion = {
      id: `catalogo-${mueble.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tipo: 'catalogo',
      mueble_id: mueble.id,
      mueble,
      opciones,
      cantidad,
      precio_unitario: precioUnitario,
      precio_total: precioTotal,
      // Copiar valores predeterminados del mueble
      medidas: mueble.medidas,
      materiales: mueble.materiales_predeterminados,
      dias_fabricacion: mueble.dias_fabricacion,
      horas_mano_obra: mueble.horas_mano_obra,
      margen_ganancia: mueble.margen_ganancia
    };

    set((state) => {
      const nuevosItems = [...state.items, nuevoItem];
      const totales = calcularTotales(nuevosItems, state.descuento, state.aplica_iva);
      return {
        items: nuevosItems,
        ...totales
      };
    });
  },

  // Agregar item manual a la cotización
  agregarItemManual: (itemData) => {
    // El formulario puede enviar un precio unitario final calculado manualmente.
    // Si existe, debe respetarse como fuente de verdad para no recalcularlo a $0
    // cuando el item todavía no tiene materiales/costos cargados.
    const precioUnitario = typeof itemData.precio_unitario === 'number'
      ? itemData.precio_unitario
      : calcularPrecioItemManual(itemData);
    const precioTotal = typeof itemData.precio_total === 'number'
      ? itemData.precio_total
      : precioUnitario * itemData.cantidad;

    const nuevoItem: ItemManualCotizacion = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...itemData,
      tipo: 'manual',
      precio_unitario: precioUnitario,
      precio_total: precioTotal
    };

    set((state) => {
      const nuevosItems = [...state.items, nuevoItem];
      const totales = calcularTotales(nuevosItems, state.descuento, state.aplica_iva);
      return {
        items: nuevosItems,
        ...totales
      };
    });
  },

  // Eliminar item de la cotización (funciona para ambos tipos)
  eliminarItem: (id) => {
    set((state) => {
      const nuevosItems = state.items.filter(item => item.id !== id);
      const totales = calcularTotales(nuevosItems, state.descuento, state.aplica_iva);
      return {
        items: nuevosItems,
        ...totales
      };
    });
  },

  // Actualizar cantidad de un item (funciona para ambos tipos)
  actualizarCantidad: (id, cantidad) => {
    if (cantidad <= 0) {
      get().eliminarItem(id);
      return;
    }

    set((state) => {
      const nuevosItems = state.items.map(item => {
        if (item.id === id) {
          const precioTotal = item.precio_unitario * cantidad;
          return { ...item, cantidad, precio_total: precioTotal };
        }
        return item;
      });
      const totales = calcularTotales(nuevosItems, state.descuento, state.aplica_iva);
      return {
        items: nuevosItems,
        ...totales
      };
    });
  },

  // Actualizar opciones de un mueble del catálogo
  actualizarOpciones: (id, opciones) => {
    set((state) => {
      const nuevosItems = state.items.map(item => {
        if (item.id === id && item.tipo === 'catalogo' && item.mueble) {
          const nuevoPrecioUnitario = calcularPrecioFinal(item.mueble, opciones);
          const precioTotal = nuevoPrecioUnitario * item.cantidad;
          return {
            ...item,
            opciones,
            precio_unitario: nuevoPrecioUnitario,
            precio_total: precioTotal
          };
        }
        return item;
      });
      const totales = calcularTotales(nuevosItems, state.descuento, state.aplica_iva);
      return {
        items: nuevosItems,
        ...totales
      };
    });
  },

  // Actualizar item manual
  actualizarItemManual: (id, updates) => {
    set((state) => {
      const nuevosItems = state.items.map(item => {
        if (item.id === id && item.tipo === 'manual') {
          const itemActualizado = { ...item, ...updates } as ItemManualCotizacion;
          
          // Recalcular precio si se modificaron materiales, servicios, costos indirectos, gastos extras o margen de ganancia
          if (updates.precio_unitario !== undefined || updates.precio_total !== undefined) {
            const nuevoPrecioUnitario = updates.precio_unitario ?? itemActualizado.precio_unitario;
            itemActualizado.precio_unitario = nuevoPrecioUnitario;
            itemActualizado.precio_total = updates.precio_total ?? (nuevoPrecioUnitario * itemActualizado.cantidad);
          } else if (updates.materiales || updates.servicios || updates.costos_indirectos || 
              updates.gastos_extras !== undefined || updates.margen_ganancia !== undefined) {
            const nuevoPrecioUnitario = calcularPrecioItemManual(itemActualizado);
            itemActualizado.precio_unitario = nuevoPrecioUnitario;
            itemActualizado.precio_total = nuevoPrecioUnitario * itemActualizado.cantidad;
          } else if (updates.cantidad !== undefined) {
            // Solo actualizar cantidad
            itemActualizado.precio_total = itemActualizado.precio_unitario * itemActualizado.cantidad;
          }
          
          return itemActualizado;
        }
        return item;
      });
      const totales = calcularTotales(nuevosItems, state.descuento, state.aplica_iva);
      return {
        items: nuevosItems,
        ...totales
      };
    });
  },

  // Establecer descuento
  setDescuento: (descuento) => {
    set((state) => {
      const totales = calcularTotales(state.items, descuento, state.aplica_iva);
      return {
        descuento,
        ...totales
      };
    });
  },

  setAplicaIVA: (aplica) => {
    set((state) => {
      const totales = calcularTotales(state.items, state.descuento, aplica);
      return {
        aplica_iva: aplica,
        ...totales
      };
    });
  },

  // Limpiar cotización
  limpiarCotizacion: () => {
    console.log('🧹 Limpiando cotización...');

    const estadoLimpio = {
      items: [],
      subtotal: 0,
      descuento: 0,
      aplica_iva: true,
      iva: 0,
      total: 0
    };

    // Primero limpiar el estado; el middleware persist sincroniza este cambio.
    set(estadoLimpio);

    // Reforzar la limpieza persistida para que una recarga o redirección inmediata
    // no pueda rehidratar items antiguos del carrito.
    try {
      localStorage.setItem(
        'cotizacion-storage',
        JSON.stringify({
          state: {
            items: [],
            descuento: 0,
            aplica_iva: true
          },
          version: 0
        })
      );
      console.log('✅ localStorage sincronizado con carrito vacío');
    } catch (error) {
      console.error('❌ Error al limpiar localStorage:', error);
    }

    console.log('✅ Estado del store limpiado');
  },

  // Recalcular totales
  calcularTotales: () => {
    set((state) => {
      const totales = calcularTotales(state.items, state.descuento, state.aplica_iva);
      return { ...totales };
    });
  },

    }),
    {
      name: 'cotizacion-storage', // Nombre de la clave en localStorage
      // Solo persistir items y descuento, los totales se recalculan
      partialize: (state) => ({
        items: state.items.map(item => {
          // Limpiar referencias circulares y solo guardar datos esenciales
          if (item.tipo === 'catalogo') {
            return {
              ...item,
              mueble: item.mueble ? {
                id: item.mueble.id,
                nombre: item.mueble.nombre,
                precio_base: item.mueble.precio_base,
                medidas: item.mueble.medidas,
                materiales_predeterminados: item.mueble.materiales_predeterminados,
                horas_mano_obra: item.mueble.horas_mano_obra,
                margen_ganancia: item.mueble.margen_ganancia,
                dias_fabricacion: item.mueble.dias_fabricacion
              } : undefined
            };
          }
          return item;
        }),
        descuento: state.descuento,
        aplica_iva: state.aplica_iva
      }),
      // Recalcular totales al cargar desde localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          const totales = calcularTotales(state.items, state.descuento, state.aplica_iva);
          state.subtotal = totales.subtotal || 0;
          state.iva = totales.iva || 0;
          state.total = totales.total || 0;
        }
      }
    }
  )
);


