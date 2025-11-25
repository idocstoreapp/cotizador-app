/**
 * Utilidad para convertir items del store de cotización al formato de CotizacionInput
 */
import type { ItemCotizacion, MuebleCotizacion, ItemManualCotizacion } from '../types/muebles';
import type { CotizacionInput, CotizacionMaterialInput, CotizacionServicioInput } from '../schemas/validations';

/**
 * Convierte items del store a formato CotizacionInput
 * Los items del catálogo se convierten a materiales/servicios basándose en materiales_predeterminados
 */
export function convertirItemsACotizacionInput(
  items: ItemCotizacion[],
  cliente: {
    nombre: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  },
  margenGanancia: number = 30
): CotizacionInput {
  const materiales: CotizacionMaterialInput[] = [];
  const servicios: CotizacionServicioInput[] = [];

  // Procesar cada item
  items.forEach((item) => {
    if (item.tipo === 'catalogo') {
      const muebleItem = item as MuebleCotizacion;
      
      // Si el mueble tiene materiales_predeterminados, agregarlos
      if (muebleItem.materiales && muebleItem.materiales.length > 0) {
        muebleItem.materiales.forEach((mat) => {
          // Buscar si ya existe este material
          const materialExistente = materiales.find(m => m.material_id === mat.material_id);
          if (materialExistente) {
            // Sumar cantidad
            materialExistente.cantidad += mat.cantidad * muebleItem.cantidad;
          } else {
            // Agregar nuevo material
            materiales.push({
              material_id: mat.material_id || `mat-${Date.now()}-${Math.random()}`,
              cantidad: mat.cantidad * muebleItem.cantidad,
              precio_unitario: mat.precio_unitario || 0
            });
          }
        });
      }

      // Si el mueble tiene horas_mano_obra, agregar como servicio
      if (muebleItem.horas_mano_obra && muebleItem.horas_mano_obra > 0) {
        servicios.push({
          servicio_id: `servicio-mano-obra-${muebleItem.mueble_id}`,
          horas: muebleItem.horas_mano_obra * muebleItem.cantidad,
          precio_por_hora: 50000 // Precio por defecto de mano de obra
        });
      }
    } else {
      // Item manual
      const manualItem = item as ItemManualCotizacion;
      
      // Agregar materiales del item manual
      if (manualItem.materiales && manualItem.materiales.length > 0) {
        manualItem.materiales.forEach((mat) => {
          materiales.push({
            material_id: mat.material_id || `mat-${Date.now()}-${Math.random()}`,
            cantidad: mat.cantidad * manualItem.cantidad,
            precio_unitario: mat.precio_unitario || 0
          });
        });
      }

      // Agregar servicios del item manual
      if (manualItem.servicios && manualItem.servicios.length > 0) {
        manualItem.servicios.forEach((serv) => {
          servicios.push({
            servicio_id: `servicio-${Date.now()}-${Math.random()}`,
            horas: serv.horas * manualItem.cantidad,
            precio_por_hora: serv.precio_por_hora
          });
        });
      }
    }
  });

  return {
    cliente_nombre: cliente.nombre,
    cliente_email: cliente.email,
    cliente_telefono: cliente.telefono,
    cliente_direccion: cliente.direccion,
    materiales,
    servicios,
    margen_ganancia: margenGanancia,
    notas: undefined
  };
}








