/**
 * Utilidades para calcular el precio de un mueble según sus opciones
 */

import type { Mueble, OpcionesMueble } from '../types/muebles';

// Multiplicadores de precio según opciones (puedes ajustar estos valores)
const MULTIPLICADORES = {
  materiales: {
    'Melamina': 1.0,
    'Madera Sólida': 1.3,
    'Lacado Brillante': 1.2,
    'Lacado Brilla': 1.2,
    'MDF': 1.1
  },
  encimeras: {
    'Mármol Negro': 1.5,
    'Marrha Negro': 1.5,
    'Quartz Blanco': 1.4,
    'Quart Blanco': 1.4,
    'Granito': 1.3,
    'Formica': 1.0
  },
  colores: {
    'Blanco': 1.0,
    'Melanina': 1.0,
    'Negro': 1.1,
    'Marrón': 1.05,
    'Gris': 1.05
  }
};

/**
 * Obtiene el precio adicional o multiplicador de una opción personalizada
 */
function obtenerPrecioOpcionPersonalizada(
  mueble: Mueble,
  tipoOpcion: string,
  valorSeleccionado: string
): { precioAdicional: number; multiplicador: number } {
  const opcionesPersonalizadas = mueble.opciones_disponibles?.opciones_personalizadas;
  if (!opcionesPersonalizadas || !opcionesPersonalizadas[tipoOpcion]) {
    return { precioAdicional: 0, multiplicador: 1.0 };
  }

  const opciones = opcionesPersonalizadas[tipoOpcion];
  if (!opciones) {
    return { precioAdicional: 0, multiplicador: 1.0 };
  }

  const opcion = opciones.find(op => op.nombre === valorSeleccionado);
  if (!opcion) {
    return { precioAdicional: 0, multiplicador: 1.0 };
  }

  return {
    precioAdicional: opcion.precio_adicional || 0,
    multiplicador: opcion.multiplicador || 1.0
  };
}

/**
 * Calcula el precio final de un mueble según sus opciones seleccionadas
 * El precio_base del catálogo ya tiene todo calculado, solo se aplican multiplicadores de opciones
 * @param mueble - El mueble base (precio_base ya calculado)
 * @param opciones - Las opciones seleccionadas (color, material, encimera, etc.)
 * @returns Precio final calculado
 */
export function calcularPrecioFinal(mueble: Mueble, opciones: OpcionesMueble): number {
  // El precio_base del catálogo ya tiene todo calculado
  let precio = mueble.precio_base;

  // Solo aplicar multiplicadores si hay opciones seleccionadas y diferentes a las predeterminadas
  // Aplicar multiplicador de material (solo si es diferente al predeterminado)
  if (opciones.material && MULTIPLICADORES.materiales[opciones.material as keyof typeof MULTIPLICADORES.materiales]) {
    const multiplicador = MULTIPLICADORES.materiales[opciones.material as keyof typeof MULTIPLICADORES.materiales];
    // Solo aplicar si el multiplicador es diferente de 1.0 (precio base)
    if (multiplicador !== 1.0) {
      precio *= multiplicador;
    }
  }

  // Aplicar multiplicador de encimera (solo si es diferente al predeterminado)
  if (opciones.encimera && MULTIPLICADORES.encimeras[opciones.encimera as keyof typeof MULTIPLICADORES.encimeras]) {
    const multiplicador = MULTIPLICADORES.encimeras[opciones.encimera as keyof typeof MULTIPLICADORES.encimeras];
    // Solo aplicar si el multiplicador es diferente de 1.0 (precio base)
    if (multiplicador !== 1.0) {
      precio *= multiplicador;
    }
  }

  // Aplicar multiplicador de color (solo si es diferente al predeterminado)
  if (opciones.color && MULTIPLICADORES.colores[opciones.color as keyof typeof MULTIPLICADORES.colores]) {
    const multiplicador = MULTIPLICADORES.colores[opciones.color as keyof typeof MULTIPLICADORES.colores];
    // Solo aplicar si el multiplicador es diferente de 1.0 (precio base)
    if (multiplicador !== 1.0) {
      precio *= multiplicador;
    }
  }

  // Aplicar opciones personalizadas de cocina
  if (mueble.categoria === 'cocina') {
    // Tipo de cocina
    if (opciones.tipo_cocina) {
      const { precioAdicional, multiplicador } = obtenerPrecioOpcionPersonalizada(mueble, 'tipo_cocina', opciones.tipo_cocina);
      precio += precioAdicional;
      if (multiplicador !== 1.0) {
        precio *= multiplicador;
      }
    }

    // Material de puertas
    if (opciones.material_puertas) {
      const { precioAdicional, multiplicador } = obtenerPrecioOpcionPersonalizada(mueble, 'material_puertas', opciones.material_puertas);
      precio += precioAdicional;
      if (multiplicador !== 1.0) {
        precio *= multiplicador;
      }
    }

    // Tipo de topes
    if (opciones.tipo_topes) {
      const { precioAdicional, multiplicador } = obtenerPrecioOpcionPersonalizada(mueble, 'tipo_topes', opciones.tipo_topes);
      precio += precioAdicional;
      if (multiplicador !== 1.0) {
        precio *= multiplicador;
      }
    }
  }

  // Redondear a miles
  return Math.round(precio / 1000) * 1000;
}


