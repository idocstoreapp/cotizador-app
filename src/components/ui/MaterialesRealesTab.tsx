/**
 * Tab para gestionar materiales reales
 * Reutiliza el sistema existente de gastos reales de materiales
 */
import { useState, useEffect } from 'react';
import { obtenerGastosRealesPorCotizacion, eliminarGastoReal, crearGastoReal } from '../../services/gastos-reales.service';
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
  onClose, 
  onSuccess 
}: { 
  cotizacionId: string; 
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
    notas: ''
  });

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

    try {
      setGuardando(true);
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
        notas: formData.notas ? `[MATERIAL ADICIONAL] ${formData.notas}` : '[MATERIAL ADICIONAL] Material no presupuestado originalmente'
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert('Error al guardar: ' + (error.message || 'Error desconocido'));
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

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Total:</span>{' '}
              <span className="text-lg font-bold">
                ${(formData.cantidad * formData.precio_unitario).toLocaleString('es-CO')}
              </span>
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
  const totalPresupuestado = Array.from(materialesAgrupados.values()).reduce((sum, mat) => sum + mat.costo_total, 0);
  
  // También calcular desde gastos reales registrados (para comparación)
  // NOTA: cantidad_presupuestada en los gastos reales YA está multiplicada por cantidadItem cuando se registró
  // Por lo tanto, NO debemos multiplicar de nuevo
  const totalPresupuestadoDesdeGastos = gastos.reduce((sum, g) => {
    return sum + (g.cantidad_presupuestada * g.precio_unitario_presupuestado);
  }, 0);

  // Debug: verificar cálculos
  console.log('Materiales - cantidadItem:', cantidadItem);
  console.log('Materiales - totalPresupuestado (desde items):', totalPresupuestado);
  console.log('Materiales - totalPresupuestadoDesdeGastos:', totalPresupuestadoDesdeGastos);

  // IMPORTANTE: Calcular total real considerando el alcance_gasto de cada gasto
  const totalReal = gastos.reduce((sum, g) => {
    const costoPorUnidad = g.cantidad_real * g.precio_unitario_real;
    let multiplicador = 1;
    
    // Debug: verificar el alcance_gasto guardado
    console.log('Material:', g.material_nombre, 'alcance_gasto:', g.alcance_gasto, 'costoPorUnidad:', costoPorUnidad);
    
    if (g.alcance_gasto === 'unidad') {
      // Por 1 unidad: multiplicar por cantidad total de items
      multiplicador = cantidadItem;
    } else if (g.alcance_gasto === 'parcial') {
      // Parcial: usar cantidad_items_aplicados directamente
      multiplicador = g.cantidad_items_aplicados || 1;
    } else if (g.alcance_gasto === 'total') {
      // Total: no multiplicar (ya incluye todos los items)
      multiplicador = 1;
    } else {
      // Por defecto (gastos antiguos sin alcance_gasto): NO multiplicar (asumir que ya es total)
      // Cambio: asumir que los gastos antiguos son "total" para no duplicar
      multiplicador = 1;
    }
    
    const costoTotal = costoPorUnidad * multiplicador;
    console.log('  -> multiplicador:', multiplicador, 'costoTotal:', costoTotal);
    return sum + costoTotal;
  }, 0);
  
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
      {/* Botón Agregar Material Adicional */}
      <div className="flex justify-end">
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

