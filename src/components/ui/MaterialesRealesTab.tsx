/**
 * Tab para gestionar materiales reales
 * Reutiliza el sistema existente de gastos reales de materiales
 */
import { useState, useEffect } from 'react';
import { obtenerGastosRealesPorCotizacion, eliminarGastoReal, crearGastoReal, actualizarGastoReal } from '../../services/gastos-reales.service';
import RegistrarGastoRealModal from './RegistrarGastoRealModal';
import type { Cotizacion, GastoRealMaterial } from '../../types/database';
import type { MaterialMueble } from '../../types/muebles';

interface MaterialesRealesTabProps {
  cotizacionId: string;
  cotizacion: Cotizacion;
  onUpdate: () => void;
}

// Modal para agregar material adicional
function AgregarMaterialAdicionalModal({ 
  cotizacionId, 
  cotizacion,
  onClose, 
  onSuccess 
}: { 
  cotizacionId: string;
  cotizacion: Cotizacion;
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    material_nombre: '',
    cantidad: 1,
    precio_unitario: 0,
    unidad: 'unidad',
    fecha_compra: new Date().toISOString().split('T')[0],
    proveedor: '',
    numero_factura: '',
    notas: '',
    alcance_gasto: 'total' as 'unidad' | 'parcial' | 'total',
    cantidad_items_aplicados: 1
  });

  // Obtener la cantidad de items de la cotización
  let cantidadItem = 1;
  if (cotizacion?.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    const itemConCantidad = cotizacion.items.find((item: any) => item.cantidad && item.cantidad > 1);
    if (itemConCantidad) {
      cantidadItem = itemConCantidad.cantidad;
    }
  }

  // Calcular el total según el alcance
  const calcularTotal = () => {
    const costoBase = formData.cantidad * formData.precio_unitario;
    let multiplicador = 1;
    
    if (formData.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (formData.alcance_gasto === 'parcial') {
      multiplicador = formData.cantidad_items_aplicados || 1;
    } else {
      multiplicador = 1; // total
    }
    
    return costoBase * multiplicador;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.material_nombre.trim()) {
      alert('El nombre del material es requerido');
      return;
    }
    if (formData.cantidad <= 0 || formData.precio_unitario <= 0) {
      alert('La cantidad y precio deben ser mayores a 0');
      return;
    }

    if (formData.alcance_gasto === 'parcial' && (!formData.cantidad_items_aplicados || formData.cantidad_items_aplicados < 1 || formData.cantidad_items_aplicados > cantidadItem)) {
      alert(`La cantidad de items aplicados debe estar entre 1 y ${cantidadItem}`);
      return;
    }

    try {
      setGuardando(true);
      console.log('💾 Guardando material adicional...', {
        cotizacionId,
        material_nombre: formData.material_nombre.trim(),
        cantidad: formData.cantidad,
        precio_unitario: formData.precio_unitario,
        alcance_gasto: formData.alcance_gasto,
        cantidad_items_aplicados: formData.alcance_gasto === 'parcial' ? formData.cantidad_items_aplicados : undefined,
        cantidadItem
      });

      await crearGastoReal({
        cotizacion_id: cotizacionId,
        item_id: 'material-adicional-' + Date.now(),
        material_nombre: formData.material_nombre.trim(),
        cantidad_presupuestada: 0, // No estaba presupuestado
        cantidad_real: formData.cantidad,
        precio_unitario_presupuestado: 0, // No estaba presupuestado
        precio_unitario_real: formData.precio_unitario,
        unidad: formData.unidad,
        fecha_compra: formData.fecha_compra,
        proveedor: formData.proveedor || undefined,
        numero_factura: formData.numero_factura || undefined,
        notas: formData.notas ? `[MATERIAL ADICIONAL] ${formData.notas}` : '[MATERIAL ADICIONAL] Material no presupuestado originalmente',
        alcance_gasto: formData.alcance_gasto,
        cantidad_items_aplicados: formData.alcance_gasto === 'parcial' ? formData.cantidad_items_aplicados : undefined
      });
      
      console.log('✅ Material adicional guardado exitosamente');
      alert('✅ Material adicional guardado exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error('❌ Error al guardar material adicional:', error);
      
      // Mensaje de error más descriptivo
      let mensajeError = error.message || 'Error desconocido al guardar';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        mensajeError = '❌ Error de conexión\n\nNo se pudo conectar con el servidor. Verifica:\n\n1. Tu conexión a internet\n2. Que el servidor esté funcionando\n3. Intenta recargar la página\n\nSi el problema persiste, contacta al administrador.';
      } else if (error.message?.includes('sesión') || error.message?.includes('JWT')) {
        mensajeError = '❌ Sesión expirada\n\nTu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.';
      } else if (error.message?.includes('permisos')) {
        mensajeError = '❌ Sin permisos\n\nNo tienes permisos para realizar esta acción. Verifica tu sesión.';
      }
      
      alert(mensajeError);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">➕ Agregar Material Adicional</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Material que no estaba en el presupuesto original
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Material *
            </label>
            <input
              type="text"
              value={formData.material_nombre}
              onChange={(e) => setFormData({ ...formData, material_nombre: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: Tornillos de 2 pulgadas"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Unitario *
              </label>
              <input
                type="number"
                value={formData.precio_unitario}
                onChange={(e) => setFormData({ ...formData, precio_unitario: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad
              </label>
              <select
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="unidad">Unidad</option>
                <option value="m²">m²</option>
                <option value="m">Metro lineal</option>
                <option value="kg">Kg</option>
                <option value="litro">Litro</option>
                <option value="galón">Galón</option>
                <option value="caja">Caja</option>
                <option value="rollo">Rollo</option>
                <option value="bolsa">Bolsa</option>
              </select>
            </div>
          </div>

          {/* Selector de alcance */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿A cuántos items aplica este material? *
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alcance"
                  value="total"
                  checked={formData.alcance_gasto === 'total'}
                  onChange={() => setFormData({ ...formData, alcance_gasto: 'total' })}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium">Total</span>
                  <p className="text-xs text-gray-600">
                    El material ya incluye todos los {cantidadItem} items. No se multiplicará.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alcance"
                  value="unidad"
                  checked={formData.alcance_gasto === 'unidad'}
                  onChange={() => setFormData({ ...formData, alcance_gasto: 'unidad' })}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium">Por Unidad</span>
                  <p className="text-xs text-gray-600">
                    El material es para 1 unidad. Se multiplicará por {cantidadItem} items.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alcance"
                  value="parcial"
                  checked={formData.alcance_gasto === 'parcial'}
                  onChange={() => setFormData({ ...formData, alcance_gasto: 'parcial' })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <span className="font-medium">Parcial</span>
                  <p className="text-xs text-gray-600 mb-2">
                    El material aplica solo a algunos items. Especifica cuántos:
                  </p>
                  {formData.alcance_gasto === 'parcial' && (
                    <input
                      type="number"
                      min="1"
                      max={cantidadItem}
                      value={formData.cantidad_items_aplicados}
                      onChange={(e) => setFormData({ ...formData, cantidad_items_aplicados: Number(e.target.value) })}
                      className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder={`1-${cantidadItem}`}
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Costo base (1 unidad):</span>{' '}
              <span className="font-bold">
                ${(formData.cantidad * formData.precio_unitario).toLocaleString('es-CO')}
              </span>
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <span className="font-medium">Total calculado:</span>{' '}
              <span className="text-lg font-bold">
                ${calcularTotal().toLocaleString('es-CO')}
              </span>
              {formData.alcance_gasto === 'unidad' && (
                <span className="text-xs ml-2">
                  ({formData.cantidad * formData.precio_unitario} × {cantidadItem} items)
                </span>
              )}
              {formData.alcance_gasto === 'parcial' && (
                <span className="text-xs ml-2">
                  ({formData.cantidad * formData.precio_unitario} × {formData.cantidad_items_aplicados} items)
                </span>
              )}
              {formData.alcance_gasto === 'total' && (
                <span className="text-xs ml-2">
                  (ya incluye todos los {cantidadItem} items)
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Compra
            </label>
            <input
              type="date"
              value={formData.fecha_compra}
              onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nombre del proveedor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nº Factura
              </label>
              <input
                type="text"
                value={formData.numero_factura}
                onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Número de factura"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
              placeholder="Razón por la que se necesitó este material..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Agregar Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaterialesRealesTab({ cotizacionId, cotizacion, onUpdate }: MaterialesRealesTabProps) {
  const [gastos, setGastos] = useState<GastoRealMaterial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalAdicional, setMostrarModalAdicional] = useState(false);
  const [materialRegistrando, setMaterialRegistrando] = useState<{
    material: MaterialMueble;
    itemId: string;
  } | null>(null);
  const [gastoEditando, setGastoEditando] = useState<GastoRealMaterial | null>(null);
  const [detailsMenuOpen, setDetailsMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [cotizacionId]);

  // IMPORTANTE: Recargar datos cuando cambia la cotización (por si se actualizaron los items)
  useEffect(() => {
    if (cotizacion?.items) {
      // Forzar recálculo cuando cambian los items de la cotización
      console.log('🔄 Cotización actualizada, recalculando totales...');
      // No necesitamos recargar gastos, solo se recalcularán los totales
    }
  }, [cotizacion?.items]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const gastosData = await obtenerGastosRealesPorCotizacion(cotizacionId);
      setGastos(gastosData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar gastos reales de materiales');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto real?')) return;

    try {
      await eliminarGastoReal(id);
      await cargarDatos();
      onUpdate();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar: ' + (error.message || 'Error desconocido'));
    }
  };

  // Función para corregir automáticamente materiales adicionales mal marcados
  const corregirMaterialesAdicionales = async () => {
    // Detectar materiales adicionales que deberían ser 'total'
    const materialesACorregir = gastos.filter(g => {
      // Es material adicional (item_id empieza con "material-adicional")
      const esAdicional = g.item_id?.startsWith('material-adicional');
      
      // Tiene alcance 'unidad' (incorrecto para materiales adicionales)
      const tieneAlcanceIncorrecto = g.alcance_gasto === 'unidad';
      
      if (!esAdicional || !tieneAlcanceIncorrecto) return false;
      
      // Nombres que sugieren que son "total" (facturas, cortes CNC, servicios únicos, etc.)
      const nombre = g.material_nombre?.toLowerCase() || '';
      const nombreSugiereTotal = 
        nombre.includes('total') ||
        nombre.includes('factura') ||
        nombre.includes('corte cnc') ||
        nombre.includes('cnc') ||
        nombre.includes('servicio') ||
        nombre.includes('corte') ||
        nombre.includes('fresado') ||
        nombre.includes('maquinado') ||
        nombre.includes('trabajo');
      
      return nombreSugiereTotal;
    });

    if (materialesACorregir.length === 0) {
      alert('No se encontraron materiales adicionales que necesiten corrección.');
      return;
    }

    const confirmacion = confirm(
      `Se encontraron ${materialesACorregir.length} materiales adicionales que deberían ser "Total" en lugar de "Por Unidad".\n\n` +
      `Materiales a corregir:\n${materialesACorregir.map(m => `- ${m.material_nombre}`).join('\n')}\n\n` +
      `¿Deseas corregirlos automáticamente?`
    );

    if (!confirmacion) return;

    try {
      let corregidos = 0;
      let errores = 0;

      for (const gasto of materialesACorregir) {
        try {
          await actualizarGastoReal(gasto.id, {
            alcance_gasto: 'total'
          });
          corregidos++;
          console.log(`✅ Corregido: ${gasto.material_nombre} → alcance: total`);
        } catch (error: any) {
          console.error(`❌ Error al corregir ${gasto.material_nombre}:`, error);
          errores++;
        }
      }

      alert(
        `Corrección completada:\n` +
        `✅ ${corregidos} materiales corregidos\n` +
        (errores > 0 ? `❌ ${errores} errores` : '')
      );

      await cargarDatos();
      onUpdate();
    } catch (error: any) {
      console.error('Error al corregir materiales:', error);
      alert('Error al corregir materiales: ' + (error.message || 'Error desconocido'));
    }
  };

  // Extraer materiales presupuestados de los items de la cotización
  // IMPORTANTE: Multiplicar por la cantidad del item
  const materialesPresupuestados: Array<{
    material: MaterialMueble;
    itemId: string;
    itemNombre: string;
    itemCantidad: number; // Cantidad del item (ej: 15 unidades)
    costoTotal: number;
  }> = [];
  
  if (cotizacion.items && Array.isArray(cotizacion.items)) {
    cotizacion.items.forEach((item: any) => {
      // Obtener la cantidad del item (por defecto 1 si no está definida)
      const cantidadItem = item.cantidad || 1;
      
      if (item.materiales && Array.isArray(item.materiales)) {
        item.materiales.forEach((mat: MaterialMueble) => {
          // Cantidad del material por unidad del item
          const cantidadMaterialPorUnidad = mat.cantidad || 0;
          // Cantidad total del material = cantidad por unidad * cantidad del item
          const cantidadTotalMaterial = cantidadMaterialPorUnidad * cantidadItem;
          const precioUnitario = mat.precio_unitario || 0;
          // Costo total = cantidad total * precio unitario
          const costoTotal = cantidadTotalMaterial * precioUnitario;
          
          materialesPresupuestados.push({
            material: {
              ...mat,
              cantidad: cantidadTotalMaterial // Actualizar cantidad para reflejar el total
            },
            itemId: item.id || item.nombre || 'item-' + Date.now(),
            itemNombre: item.nombre || 'Item sin nombre',
            itemCantidad: cantidadItem,
            costoTotal
          });
        });
      }
    });
  }

  // Agrupar materiales por nombre para sumar cantidades
  // IMPORTANTE: El precio unitario se mantiene del material original
  // Si hay diferentes precios, se usa el del primer material encontrado
  const materialesAgrupados = new Map<string, {
    material_nombre: string;
    cantidad_total: number;
    precio_unitario: number;
    unidad: string;
    costo_total: number;
    items: string[];
  }>();

  materialesPresupuestados.forEach(({ material, itemNombre, costoTotal }) => {
    const nombre = material.material_nombre || 'Material sin nombre';
    const key = nombre.toLowerCase();
    
    if (materialesAgrupados.has(key)) {
      const existente = materialesAgrupados.get(key)!;
      existente.cantidad_total += material.cantidad || 0;
      existente.costo_total += costoTotal;
      existente.items.push(itemNombre);
      // Recalcular precio unitario promedio si hay diferencias (aunque normalmente debería ser el mismo)
      // Por ahora mantenemos el precio original del primer material
    } else {
      materialesAgrupados.set(key, {
        material_nombre: nombre,
        cantidad_total: material.cantidad || 0,
        precio_unitario: material.precio_unitario || 0,
        unidad: material.unidad || 'unidad',
        costo_total: costoTotal,
        items: [itemNombre]
      });
    }
  });
  
  // Obtener la cantidad del item (para multiplicar los gastos reales)
  // Los gastos reales están registrados para 1 unidad, pero el item puede tener múltiples unidades
  let cantidadItem = 1;
  if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    // Buscar el item con cantidad mayor a 1
    const itemConCantidad = cotizacion.items.find((item: any) => item.cantidad && item.cantidad > 1);
    if (itemConCantidad) {
      cantidadItem = itemConCantidad.cantidad;
    }
  }
  
  // IMPORTANTE: totalPresupuestado ya está multiplicado por cantidadItem en materialesAgrupados
  const totalPresupuestadoDesdeItems = Array.from(materialesAgrupados.values()).reduce((sum, mat) => sum + mat.costo_total, 0);
  
  // También calcular desde gastos reales registrados (para comparación)
  // NOTA: cantidad_presupuestada en los gastos reales YA está multiplicada por cantidadItem cuando se registró
  // Por lo tanto, NO debemos multiplicar de nuevo
  const totalPresupuestadoDesdeGastos = gastos.reduce((sum, g) => {
    return sum + (g.cantidad_presupuestada * g.precio_unitario_presupuestado);
  }, 0);

  // CORRECCIÓN: Si no hay materiales en los items pero hay gastos reales con cantidad_presupuestada,
  // usar el total desde gastos. Si hay materiales en items, usar ese (más confiable).
  // Si ambos están vacíos, el total es 0.
  const totalPresupuestado = totalPresupuestadoDesdeItems > 0 
    ? totalPresupuestadoDesdeItems 
    : totalPresupuestadoDesdeGastos;

  // Debug: verificar cálculos
  console.log('🔍 ====== CÁLCULO DE TOTALES ======');
  console.log('Materiales - cantidadItem:', cantidadItem);
  console.log('Materiales - totalPresupuestado (desde items):', totalPresupuestadoDesdeItems);
  console.log('Materiales - totalPresupuestadoDesdeGastos:', totalPresupuestadoDesdeGastos);
  console.log('Materiales - totalPresupuestado FINAL (usado):', totalPresupuestado);
  console.log('Materiales - Cantidad de materiales en items:', materialesPresupuestados.length);
  console.log('Materiales - Cantidad de gastos reales:', gastos.length);
  
  // Debug adicional: verificar si hay discrepancia
  if (Math.abs(totalPresupuestadoDesdeItems - totalPresupuestadoDesdeGastos) > 0.01 && totalPresupuestadoDesdeItems > 0 && totalPresupuestadoDesdeGastos > 0) {
    console.warn('⚠️ DISCREPANCIA: Los totales desde items y desde gastos no coinciden');
    console.warn('   - Desde items:', totalPresupuestadoDesdeItems);
    console.warn('   - Desde gastos:', totalPresupuestadoDesdeGastos);
    console.warn('   - Diferencia:', Math.abs(totalPresupuestadoDesdeItems - totalPresupuestadoDesdeGastos));
  }
  console.log('===================================');

  // DEBUG: Función especial para kub-1003
  const esKub1003 = cotizacion?.numero?.toUpperCase().includes('KUB-1003');
  if (esKub1003) {
    console.log('🔍 ====== DEBUG KUB-1003 ======');
    console.log('📋 Cotización:', cotizacion.numero);
    console.log('📦 Cantidad de items:', cantidadItem);
    console.log('📊 Total de gastos reales:', gastos.length);
    console.log('📋 Materiales en items de cotización:');
    if (cotizacion.items && Array.isArray(cotizacion.items)) {
      cotizacion.items.forEach((item: any, itemIndex: number) => {
        console.log(`  Item ${itemIndex + 1}: ${item.nombre || 'Sin nombre'}`);
        console.log(`    - Cantidad: ${item.cantidad || 1}`);
        console.log(`    - Materiales en item: ${item.materiales?.length || 0}`);
        if (item.materiales && Array.isArray(item.materiales)) {
          item.materiales.forEach((mat: any, matIndex: number) => {
            console.log(`      Material ${matIndex + 1}: ${mat.material_nombre || mat.nombre}`);
            console.log(`        - Cantidad: ${mat.cantidad || 0} ${mat.unidad || ''}`);
            console.log(`        - Precio: $${(mat.precio_unitario || 0).toLocaleString('es-CO')}`);
            console.log(`        - Total: $${((mat.cantidad || 0) * (mat.precio_unitario || 0)).toLocaleString('es-CO')}`);
          });
        }
      });
    } else {
      console.log('  ⚠️ No hay items en la cotización o items no es un array');
    }
    console.log('📋 Gastos reales detallados:');
    gastos.forEach((g, index) => {
      console.log(`  ${index + 1}. ${g.material_nombre}`);
      console.log(`     - Cantidad presupuestada: ${g.cantidad_presupuestada} ${g.unidad}`);
      console.log(`     - Precio presupuestado: $${g.precio_unitario_presupuestado.toLocaleString('es-CO')}`);
      console.log(`     - Cantidad real: ${g.cantidad_real} ${g.unidad}`);
      console.log(`     - Precio unitario real: $${g.precio_unitario_real.toLocaleString('es-CO')}`);
      console.log(`     - Alcance: ${g.alcance_gasto || 'NO DEFINIDO (se asume total)'}`);
      console.log(`     - Items aplicados: ${g.cantidad_items_aplicados || 'N/A'}`);
      console.log(`     - Item ID: ${g.item_id}`);
      console.log(`     - Notas: ${g.notas || 'Sin notas'}`);
    });
    console.log('📊 Totales calculados:');
    console.log(`  - Total presupuestado desde items: $${totalPresupuestadoDesdeItems.toLocaleString('es-CO')}`);
    console.log(`  - Total presupuestado desde gastos: $${totalPresupuestadoDesdeGastos.toLocaleString('es-CO')}`);
    console.log(`  - Total presupuestado FINAL: $${totalPresupuestado.toLocaleString('es-CO')}`);
    console.log('===============================');
  }

  // IMPORTANTE: Calcular total real considerando el alcance_gasto de cada gasto
  const totalReal = gastos.reduce((sum, g) => {
    const costoPorUnidad = g.cantidad_real * g.precio_unitario_real;
    let multiplicador = 1;
    
    // Debug: verificar el alcance_gasto guardado
    if (esKub1003) {
      console.log(`🔍 [KUB-1003] Material: ${g.material_nombre}`);
      console.log(`   - Alcance: ${g.alcance_gasto || 'NO DEFINIDO'}`);
      console.log(`   - Costo por unidad: $${costoPorUnidad.toLocaleString('es-CO')}`);
    }
    
    if (g.alcance_gasto === 'unidad') {
      // Por 1 unidad: multiplicar por cantidad total de items
      multiplicador = cantidadItem;
      if (esKub1003) {
        console.log(`   - Multiplicador: ${cantidadItem} (unidad × ${cantidadItem} items)`);
      }
    } else if (g.alcance_gasto === 'parcial') {
      // Parcial: usar cantidad_items_aplicados directamente
      multiplicador = g.cantidad_items_aplicados || 1;
      if (esKub1003) {
        console.log(`   - Multiplicador: ${multiplicador} (parcial - ${g.cantidad_items_aplicados} items)`);
      }
    } else if (g.alcance_gasto === 'total') {
      // Total: no multiplicar (ya incluye todos los items)
      multiplicador = 1;
      if (esKub1003) {
        console.log(`   - Multiplicador: 1 (total - ya incluye todos los ${cantidadItem} items)`);
      }
    } else {
      // Por defecto (gastos antiguos sin alcance_gasto): NO multiplicar (asumir que ya es total)
      // Cambio: asumir que los gastos antiguos son "total" para no duplicar
      multiplicador = 1;
      if (esKub1003) {
        console.log(`   ⚠️ Multiplicador: 1 (SIN ALCANCE - se asume total para evitar duplicación)`);
      }
    }
    
    const costoTotal = costoPorUnidad * multiplicador;
    if (esKub1003) {
      console.log(`   - Costo total: $${costoTotal.toLocaleString('es-CO')}`);
    }
    return sum + costoTotal;
  }, 0);
  
  if (esKub1003) {
    console.log(`💰 [KUB-1003] Total real calculado: $${totalReal.toLocaleString('es-CO')}`);
    console.log('===============================');
  }
  
  const totalRealPorUnidad = cantidadItem > 0 ? totalReal / cantidadItem : totalReal;
  
  console.log('Materiales - totalReal:', totalReal);

  const diferencia = totalReal - totalPresupuestado;
  const diferenciaPorcentaje = totalPresupuestado > 0
    ? (diferencia / totalPresupuestado) * 100
    : 0;

  if (cargando) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Botones de acción */}
      <div className="flex justify-end gap-2 flex-wrap">
        {/* Botón para corregir materiales adicionales */}
        {gastos.some(g => g.item_id?.startsWith('material-adicional') && g.alcance_gasto === 'unidad') && (
          <button
            onClick={corregirMaterialesAdicionales}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
            title="Corregir materiales adicionales que están marcados como 'Por Unidad' pero deberían ser 'Total'"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Corregir Alcances
          </button>
        )}
        <button
          onClick={() => setMostrarModalAdicional(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Agregar Material Adicional
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Presupuestado</p>
          <p className="text-xl font-bold text-blue-600">${totalPresupuestado.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Real</p>
          <p className="text-xl font-bold text-green-600">${totalReal.toLocaleString('es-CO')}</p>
          {cantidadItem > 1 && gastos.some(g => g.alcance_gasto === 'unidad' || !g.alcance_gasto) && (
            <p className="text-xs text-gray-500 mt-1">
              ${totalRealPorUnidad.toLocaleString('es-CO')} por unidad (×{cantidadItem})
            </p>
          )}
          {gastos.some(g => g.alcance_gasto === 'total') && (
            <p className="text-xs text-blue-600 mt-1">
              ✓ Incluye gastos por total de items
            </p>
          )}
        </div>
        <div className={`p-4 rounded-lg ${diferencia >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-sm text-gray-600">Diferencia</p>
          <p className={`text-xl font-bold ${diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {diferencia >= 0 ? '+' : ''}${diferencia.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-500">{diferenciaPorcentaje.toFixed(1)}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Registros</p>
          <p className="text-xl font-bold text-purple-600">{gastos.length}</p>
        </div>
      </div>

      {/* Tabla de Materiales Presupuestados */}
      {materialesAgrupados.size > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
            📋 Materiales Presupuestados
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from(materialesAgrupados.values()).map((mat, index) => {
                  // Buscar si ya hay un gasto real registrado para este material
                  const gastoReal = gastos.find(g => 
                    g.material_nombre.toLowerCase() === mat.material_nombre.toLowerCase()
                  );
                  
                  return (
                    <tr key={index} className={gastoReal ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{mat.material_nombre}</div>
                        {gastoReal && (
                          <div className="text-xs text-green-600 mt-1">✓ Gasto real registrado</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {mat.cantidad_total} <span className="text-gray-500">{mat.unidad}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${mat.precio_unitario.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        ${mat.costo_total.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500">
                          {mat.items.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!gastoReal && (
                          <button
                            onClick={() => {
                              // Crear un material con la cantidad total agrupada para el modal
                              const materialParaModal: MaterialMueble = {
                                material_id: mat.material_nombre, // Usar nombre como ID temporal
                                material_nombre: mat.material_nombre,
                                cantidad: mat.cantidad_total, // Cantidad total agrupada (ya multiplicada por cantidad del item)
                                precio_unitario: mat.precio_unitario,
                                unidad: mat.unidad,
                                material_tipo: undefined
                              };
                                setMaterialRegistrando({
                                material: materialParaModal,
                                itemId: 'material-agrupado-' + mat.material_nombre.toLowerCase().replace(/\s+/g, '-')
                                });
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                          >
                            Registrar Gasto
                          </button>
                        )}
                        {gastoReal && (
                          <span className="text-xs text-green-600">Registrado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla */}
      {gastos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">No hay gastos reales de materiales registrados</p>
          {materialesAgrupados.size === 0 && (
            <p className="text-sm text-gray-400">No hay materiales presupuestados en esta cotización</p>
          )}
        </div>
      ) : (
        <>
          {/* Vista móvil - Cards */}
          <div className="lg:hidden space-y-3">
            {gastos.map((gasto) => {
              const totalGasto = gasto.cantidad_real * gasto.precio_unitario_real;
              const totalPresupuestadoGasto = gasto.cantidad_presupuestada * gasto.precio_unitario_presupuestado;
              const diferenciaGasto = totalGasto - totalPresupuestadoGasto;

              return (
                <div key={gasto.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-0.5">Material</div>
                      <div className="text-sm font-semibold text-gray-900">{gasto.material_nombre}</div>
                      {gasto.numero_factura && (
                        <div className="text-xs text-gray-500 mt-1">Fact: {gasto.numero_factura}</div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Cantidad:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {gasto.cantidad_real} / {gasto.cantidad_presupuestada} {gasto.unidad}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Precio unitario:</span>
                      <span className="text-sm text-gray-900">
                        ${gasto.precio_unitario_real.toLocaleString('es-CO')} / ${gasto.precio_unitario_presupuestado.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Total:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${totalGasto.toLocaleString('es-CO')}
                      </span>
                    </div>
                    {diferenciaGasto !== 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Diferencia:</span>
                        <span className={`text-xs font-medium ${diferenciaGasto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {diferenciaGasto > 0 ? '+' : ''}${diferenciaGasto.toLocaleString('es-CO')}
                        </span>
                      </div>
                    )}
                    {gasto.proveedor && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Proveedor:</span>
                        <span className="text-sm text-gray-700">{gasto.proveedor}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Fecha:</span>
                      <span className="text-sm text-gray-700">
                        {new Date(gasto.fecha_compra).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                    {gasto.alcance_gasto && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Alcance:</span>
                        <span className="text-xs text-gray-700">
                          {gasto.alcance_gasto === 'unidad' ? '1 unidad' : 
                           gasto.alcance_gasto === 'parcial' ? `${gasto.cantidad_items_aplicados || 0} items` :
                           'Total'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                    <button
                      onClick={() => {
                        const materialParaModal: MaterialMueble = {
                          material_id: gasto.material_id,
                          material_nombre: gasto.material_nombre,
                          cantidad: gasto.cantidad_presupuestada,
                          precio_unitario: gasto.precio_unitario_presupuestado,
                          unidad: gasto.unidad,
                          material_tipo: undefined
                        };
                        setMaterialRegistrando({
                          material: materialParaModal,
                          itemId: gasto.item_id
                        });
                        setGastoEditando(gasto);
                        setDetailsMenuOpen(null);
                      }}
                      className="flex-1 px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => {
                        handleEliminar(gasto.id);
                        setDetailsMenuOpen(null);
                      }}
                      className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista desktop - Tabla simplificada */}
          <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Más Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gastos.map((gasto) => {
                const totalGasto = gasto.cantidad_real * gasto.precio_unitario_real;
                const totalPresupuestadoGasto = gasto.cantidad_presupuestada * gasto.precio_unitario_presupuestado;
                const diferenciaGasto = totalGasto - totalPresupuestadoGasto;

                return (
                  <tr key={gasto.id}>
                      <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{gasto.material_nombre}</div>
                      {gasto.numero_factura && (
                        <div className="text-xs text-gray-500">Fact: {gasto.numero_factura}</div>
                      )}
                    </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="text-gray-900">{gasto.cantidad_real}</span>
                        <span className="text-gray-500"> / {gasto.cantidad_presupuestada}</span>
                        <span className="text-xs text-gray-400"> {gasto.unidad}</span>
                      </div>
                    </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="text-gray-900">${gasto.precio_unitario_real.toLocaleString('es-CO')}</span>
                        <span className="text-gray-500 text-xs"> / ${gasto.precio_unitario_presupuestado.toLocaleString('es-CO')}</span>
                      </div>
                    </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        ${totalGasto.toLocaleString('es-CO')}
                      </div>
                      {diferenciaGasto !== 0 && (
                        <div className={`text-xs ${diferenciaGasto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {diferenciaGasto > 0 ? '+' : ''}${diferenciaGasto.toLocaleString('es-CO')}
                        </div>
                      )}
                    </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={() => setDetailsMenuOpen(detailsMenuOpen === gasto.id ? null : gasto.id)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Más información"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {detailsMenuOpen === gasto.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-2">
                                {gasto.proveedor && (
                                  <div className="px-4 py-2 text-xs">
                                    <span className="text-gray-500">Proveedor:</span>
                                    <div className="text-sm text-gray-900 mt-1">{gasto.proveedor}</div>
                                  </div>
                                )}
                                <div className="px-4 py-2 text-xs border-t border-gray-100">
                                  <span className="text-gray-500">Fecha:</span>
                                  <div className="text-sm text-gray-900 mt-1">
                      {new Date(gasto.fecha_compra).toLocaleDateString('es-CO')}
                                  </div>
                                </div>
                                {gasto.alcance_gasto && (
                                  <div className="px-4 py-2 text-xs border-t border-gray-100">
                                    <span className="text-gray-500">Alcance:</span>
                                    <div className="text-sm text-gray-900 mt-1">
                                      {gasto.alcance_gasto === 'unidad' ? '1 unidad' : 
                                       gasto.alcance_gasto === 'parcial' ? `${gasto.cantidad_items_aplicados || 0} items` :
                                       'Total'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                    </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const materialParaModal: MaterialMueble = {
                                material_id: gasto.material_id,
                                material_nombre: gasto.material_nombre,
                                cantidad: gasto.cantidad_presupuestada,
                                precio_unitario: gasto.precio_unitario_presupuestado,
                                unidad: gasto.unidad,
                                material_tipo: undefined
                              };
                              setMaterialRegistrando({
                                material: materialParaModal,
                                itemId: gasto.item_id
                              });
                              setGastoEditando(gasto);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            ✏️ Editar
                          </button>
                      <button
                        onClick={() => handleEliminar(gasto.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                            🗑️ Eliminar
                      </button>
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Modal de registrar/editar gasto */}
      {materialRegistrando && (
        <RegistrarGastoRealModal
          material={materialRegistrando.material}
          cotizacionId={cotizacionId}
          itemId={materialRegistrando.itemId}
          cantidadItem={cantidadItem}
          gastoExistente={gastoEditando || undefined}
          onClose={() => {
            setMaterialRegistrando(null);
            setGastoEditando(null);
          }}
          onSuccess={() => {
            cargarDatos();
            onUpdate();
            setMaterialRegistrando(null);
            setGastoEditando(null);
          }}
        />
      )}

      {/* Modal de agregar material adicional */}
      {mostrarModalAdicional && (
        <AgregarMaterialAdicionalModal
          cotizacionId={cotizacionId}
          cotizacion={cotizacion}
          onClose={() => setMostrarModalAdicional(false)}
          onSuccess={() => {
            cargarDatos();
            onUpdate();
            setMostrarModalAdicional(false);
          }}
        />
      )}
    </div>
  );
}

