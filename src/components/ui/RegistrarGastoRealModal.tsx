/**
 * Modal para registrar gastos reales de materiales
 * Permite registrar compras reales con fecha, proveedor y factura
 */
import { useState } from 'react';
import { crearGastoReal, actualizarGastoReal } from '../../services/gastos-reales.service';
import type { MaterialMueble } from '../../types/muebles';

interface RegistrarGastoRealModalProps {
  material: MaterialMueble;
  cotizacionId: string;
  itemId: string;
  cantidadItem?: number; // Cantidad total de items en la cotización
  onClose: () => void;
  onSuccess: () => void;
  gastoExistente?: any; // Si se proporciona, es modo edición
}

export default function RegistrarGastoRealModal({
  material,
  cotizacionId,
  itemId,
  cantidadItem = 1,
  onClose,
  onSuccess,
  gastoExistente
}: RegistrarGastoRealModalProps) {
  const esModoEdicion = !!gastoExistente;
  
  const [cantidadReal, setCantidadReal] = useState<number>(
    gastoExistente?.cantidad_real || material.cantidad || 0
  );
  const [precioUnitarioReal, setPrecioUnitarioReal] = useState<number>(
    gastoExistente?.precio_unitario_real || material.precio_unitario || 0
  );
  const [fechaCompra, setFechaCompra] = useState<string>(
    gastoExistente?.fecha_compra || new Date().toISOString().split('T')[0]
  );
  const [proveedor, setProveedor] = useState<string>(gastoExistente?.proveedor || '');
  const [numeroFactura, setNumeroFactura] = useState<string>(gastoExistente?.numero_factura || '');
  const [notas, setNotas] = useState<string>(gastoExistente?.notas || '');
  const [alcanceGasto, setAlcanceGasto] = useState<'unidad' | 'parcial' | 'total'>(
    gastoExistente?.alcance_gasto || 'unidad'
  );
  const [cantidadItemsAplicados, setCantidadItemsAplicados] = useState<number>(
    gastoExistente?.cantidad_items_aplicados || 1
  );
  const [guardando, setGuardando] = useState(false);

  const cantidadPresupuestada = material.cantidad || 0;
  const precioPresupuestado = material.precio_unitario || 0;
  const diferenciaCantidad = cantidadReal - cantidadPresupuestada;
  const diferenciaPrecio = precioUnitarioReal - precioPresupuestado;
  const totalPresupuestado = cantidadPresupuestada * precioPresupuestado;
  const totalReal = cantidadReal * precioUnitarioReal;
  const diferenciaTotal = totalReal - totalPresupuestado;

  const handleGuardar = async () => {
    if (cantidadReal <= 0) {
      alert('La cantidad real debe ser mayor a 0');
      return;
    }

    if (precioUnitarioReal <= 0) {
      alert('El precio unitario real debe ser mayor a 0');
      return;
    }

    if (alcanceGasto === 'parcial' && (cantidadItemsAplicados < 1 || cantidadItemsAplicados > cantidadItem)) {
      alert(`La cantidad de items aplicados debe estar entre 1 y ${cantidadItem}`);
      return;
    }

    try {
      setGuardando(true);
      
      if (esModoEdicion && gastoExistente?.id) {
        // Modo edición
        await actualizarGastoReal(gastoExistente.id, {
          cantidad_real: cantidadReal,
          precio_unitario_real: precioUnitarioReal,
          fecha_compra: fechaCompra,
          proveedor: proveedor || undefined,
          numero_factura: numeroFactura || undefined,
          notas: notas || undefined,
          alcance_gasto: alcanceGasto,
          cantidad_items_aplicados: alcanceGasto === 'parcial' ? cantidadItemsAplicados : undefined
        });
        alert('✅ Gasto real actualizado exitosamente');
      } else {
        // Modo creación
      await crearGastoReal({
        cotizacion_id: cotizacionId,
        item_id: itemId,
        material_id: material.material_id,
        material_nombre: material.material_nombre || 'Material',
        cantidad_presupuestada: cantidadPresupuestada,
        cantidad_real: cantidadReal,
        precio_unitario_presupuestado: precioPresupuestado,
        precio_unitario_real: precioUnitarioReal,
        unidad: material.unidad || 'unidad',
        fecha_compra: fechaCompra,
        proveedor: proveedor || undefined,
        numero_factura: numeroFactura || undefined,
          notas: notas || undefined,
          alcance_gasto: alcanceGasto,
          cantidad_items_aplicados: alcanceGasto === 'parcial' ? cantidadItemsAplicados : undefined
      });
      alert('✅ Gasto real registrado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar gasto real:', error);
      alert('❌ Error al guardar gasto real: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {esModoEdicion ? '✏️ Editar Gasto Real' : 'Registrar Gasto Real'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información del material */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Material: {material.material_nombre || 'Material'}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Cantidad Presupuestada:</span>
                <span className="ml-2 text-gray-900 font-semibold">{cantidadPresupuestada} {material.unidad}</span>
                <p className="text-xs text-gray-600 mt-1">
                  💡 Esta cantidad ya incluye la multiplicación por la cantidad del item
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Precio Unitario Presupuestado:</span>
                <span className="ml-2 text-gray-900">${precioPresupuestado.toLocaleString('es-CO')}</span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Total Presupuestado:</span>
                <span className="ml-2 text-gray-900 font-semibold text-lg">${totalPresupuestado.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>

          {/* Formulario de gasto real */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos de la Compra Real</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Real *
                </label>
                <input
                  type="number"
                  value={cantidadReal}
                  onChange={(e) => setCantidadReal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="0.1"
                  required
                />
                {diferenciaCantidad !== 0 && (
                  <p className={`text-xs mt-1 ${diferenciaCantidad > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diferenciaCantidad > 0 ? '+' : ''}{diferenciaCantidad.toFixed(2)} {material.unidad} vs presupuestado
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Unitario Real *
                </label>
                <input
                  type="number"
                  value={precioUnitarioReal}
                  onChange={(e) => setPrecioUnitarioReal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="100"
                  required
                />
                {diferenciaPrecio !== 0 && (
                  <p className={`text-xs mt-1 ${diferenciaPrecio > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diferenciaPrecio > 0 ? '+' : ''}${diferenciaPrecio.toLocaleString('es-CO')} vs presupuestado
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Compra *
                </label>
                <input
                  type="date"
                  value={fechaCompra}
                  onChange={(e) => setFechaCompra(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Factura
                </label>
                <input
                  type="text"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Número de factura o comprobante"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Notas adicionales sobre la compra..."
              />
            </div>

            {/* Selector de alcance del gasto */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                📊 ¿Este gasto aplica a qué cantidad de items?
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="alcance"
                    value="unidad"
                    checked={alcanceGasto === 'unidad'}
                    onChange={(e) => setAlcanceGasto('unidad')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Por 1 unidad (item)</span>
                    <p className="text-xs text-gray-600">El sistema multiplicará este gasto por {cantidadItem} items</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="alcance"
                    value="parcial"
                    checked={alcanceGasto === 'parcial'}
                    onChange={(e) => setAlcanceGasto('parcial')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Por cantidad parcial</span>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        max={cantidadItem}
                        value={cantidadItemsAplicados}
                        onChange={(e) => setCantidadItemsAplicados(parseInt(e.target.value) || 1)}
                        disabled={alcanceGasto !== 'parcial'}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                      <span className="text-xs text-gray-600">de {cantidadItem} items totales</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">El sistema usará este gasto tal cual (sin multiplicar)</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="alcance"
                    value="total"
                    checked={alcanceGasto === 'total'}
                    onChange={(e) => setAlcanceGasto('total')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Por el total de items ({cantidadItem})</span>
                    <p className="text-xs text-gray-600">El sistema usará este gasto tal cual (sin multiplicar) - ya incluye todos los items</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Resumen comparativo */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumen Comparativo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Total Presupuestado:</span>
                <span className="font-medium text-gray-900">${totalPresupuestado.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Total Real:</span>
                <span className="font-medium text-gray-900">${totalReal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2">
                <span className="font-semibold text-gray-900">Diferencia:</span>
                <span className={`font-bold ${diferenciaTotal > 0 ? 'text-red-600' : diferenciaTotal < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {diferenciaTotal > 0 ? '+' : ''}${diferenciaTotal.toLocaleString('es-CO')}
                  {totalPresupuestado > 0 && (
                    <span className="ml-2 text-xs">
                      ({((diferenciaTotal / totalPresupuestado) * 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleGuardar}
              disabled={guardando || cantidadReal <= 0 || precioUnitarioReal <= 0}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {guardando ? 'Guardando...' : esModoEdicion ? '💾 Actualizar Gasto Real' : '💾 Registrar Gasto Real'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


