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

interface CotizacionStore extends EstadoCotizacion {
  // Acciones para muebles del catálogo
  agregarMueble: (mueble: Mueble, opciones: OpcionesMueble, cantidad: number) => void;
  
  // Acciones para items manuales
  agregarItemManual: (item: Omit<ItemManualCotizacion, 'id' | 'precio_unitario' | 'precio_total'>) => void;
  
  // Acciones generales
  eliminarItem: (id: string) => void;
  actualizarCantidad: (id: string, cantidad: number) => void;
  actualizarOpciones: (id: string, opciones: OpcionesMueble) => void;
  actualizarItemManual: (id: string, updates: Partial<ItemManualCotizacion>) => void;
  setDescuento: (descuento: number) => void;
  limpiarCotizacion: () => void;
  calcularTotales: () => void;
}

/**
 * Calcula el precio de un item manual basado en materiales y servicios
 */
function calcularPrecioItemManual(
  materiales: MaterialMueble[],
  servicios?: Array<{ horas: number; precio_por_hora: number }>,
  margenGanancia: number = 30,
  gastosExtras?: Array<{ concepto: string; monto: number }>,
  descuento?: number
): number {
  // Costo de materiales
  const costoMateriales = materiales.reduce((sum, mat) => {
    return sum + (mat.cantidad * (mat.precio_unitario || 0));
  }, 0);

  // Costo de servicios (mano de obra)
  const costoServicios = servicios?.reduce((sum, serv) => {
    return sum + (serv.horas * serv.precio_por_hora);
  }, 0) || 0;

  // Costo de gastos extras
  const costoGastosExtras = gastosExtras?.reduce((sum, gasto) => {
    return sum + (gasto.monto || 0);
  }, 0) || 0;

  // Costo total (materiales + servicios + gastos extras)
  const costoTotal = costoMateriales + costoServicios + costoGastosExtras;

  // Aplicar margen de ganancia
  const precioConMargen = costoTotal * (1 + margenGanancia / 100);

  // Aplicar descuento si existe
  const precioFinal = descuento && descuento > 0
    ? precioConMargen * (1 - descuento / 100)
    : precioConMargen;

  return Math.round(precioFinal * 100) / 100; // Redondear a 2 decimales
}

const calcularTotales = (items: ItemCotizacion[], descuento: number, iva: number = 19): Partial<EstadoCotizacion> => {
  const subtotal = items.reduce((sum, item) => sum + item.precio_total, 0);
  const descuentoMonto = subtotal * (descuento / 100);
  const subtotalConDescuento = subtotal - descuentoMonto;
  const ivaMonto = subtotalConDescuento * (iva / 100);
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
      id: `catalogo-${mueble.id}-${Date.now()}`,
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
      const totales = calcularTotales(nuevosItems, state.descuento);
      return {
        items: nuevosItems,
        ...totales
      };
    });
  },

  // Agregar item manual a la cotización
  agregarItemManual: (itemData) => {
    const precioUnitario = calcularPrecioItemManual(
      itemData.materiales,
      itemData.servicios,
      itemData.margen_ganancia || 30,
      itemData.gastos_extras,
      itemData.descuento
    );
    const precioTotal = precioUnitario * itemData.cantidad;

    const nuevoItem: ItemManualCotizacion = {
      id: `manual-${Date.now()}`,
      tipo: 'manual',
      ...itemData,
      precio_unitario: precioUnitario,
      precio_total: precioTotal
    };

    set((state) => {
      const nuevosItems = [...state.items, nuevoItem];
      const totales = calcularTotales(nuevosItems, state.descuento);
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
      const totales = calcularTotales(nuevosItems, state.descuento);
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
      const totales = calcularTotales(nuevosItems, state.descuento);
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
      const totales = calcularTotales(nuevosItems, state.descuento);
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
          
          // Recalcular precio si se modificaron materiales o servicios
          if (updates.materiales || updates.servicios || updates.margen_ganancia !== undefined) {
            const nuevoPrecioUnitario = calcularPrecioItemManual(
              itemActualizado.materiales,
              itemActualizado.servicios,
              itemActualizado.margen_ganancia || 30
            );
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
      const totales = calcularTotales(nuevosItems, state.descuento);
      return {
        items: nuevosItems,
        ...totales
      };
    });
  },

  // Establecer descuento
  setDescuento: (descuento) => {
    set((state) => {
      const totales = calcularTotales(state.items, descuento);
      return {
        descuento,
        ...totales
      };
    });
  },

  // Limpiar cotización
  limpiarCotizacion: () => {
    set({
      items: [],
      subtotal: 0,
      descuento: 0,
      iva: 0,
      total: 0
    });
  },

  // Recalcular totales
  calcularTotales: () => {
    set((state) => {
      const totales = calcularTotales(state.items, state.descuento);
      return { ...totales };
    });
  }
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
        descuento: state.descuento
      }),
      // Recalcular totales al cargar desde localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          const totales = calcularTotales(state.items, state.descuento);
          state.subtotal = totales.subtotal || 0;
          state.iva = totales.iva || 0;
          state.total = totales.total || 0;
        }
      }
    }
  )
);


