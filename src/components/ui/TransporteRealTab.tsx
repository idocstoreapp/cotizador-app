/**
 * Tab para gestionar transporte real
 */
import { useState, useEffect } from 'react';
import { obtenerTransportesRealesPorCotizacion, crearTransporteReal, actualizarTransporteReal, eliminarTransporteReal } from '../../services/transporte-real.service';
import { subirImagen } from '../../services/storage.service';
import type { TransporteReal } from '../../types/database';

interface TransporteRealTabProps {
  cotizacionId: string;
  cotizacion: any; // Cotizacion
  onUpdate: () => void;
}

export default function TransporteRealTab({ cotizacionId, cotizacion, onUpdate }: TransporteRealTabProps) {
  const [transportes, setTransportes] = useState<TransporteReal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<TransporteReal | null>(null);
  const [formData, setFormData] = useState({
    tipo_descripcion: '',
    costo: 0,
    fecha: new Date().toISOString().split('T')[0],
    factura: null as File | null,
    alcance_gasto: 'unidad' as 'unidad' | 'parcial' | 'total',
    cantidad_items_aplicados: 1
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [cotizacionId]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const transportesData = await obtenerTransportesRealesPorCotizacion(cotizacionId);
      console.log('📦 Transportes cargados desde BD:', transportesData.map(t => ({
        id: t.id,
        tipo: t.tipo_descripcion,
        costo: t.costo,
        alcance_gasto: t.alcance_gasto,
        cantidad_items_aplicados: t.cantidad_items_aplicados
      })));
      setTransportes(transportesData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar transportes reales');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    if (!formData.tipo_descripcion.trim() || formData.costo <= 0) {
      alert('La descripción y el costo son requeridos');
      return;
    }

    try {
      setGuardando(true);
      let facturaUrl: string | undefined;

      // Subir factura si existe
      if (formData.factura) {
        facturaUrl = await subirImagen(formData.factura, 'facturas');
      }

      if (editando) {
        const updates = {
          tipo_descripcion: formData.tipo_descripcion,
          costo: formData.costo,
          fecha: formData.fecha,
          factura_url: facturaUrl,
          alcance_gasto: formData.alcance_gasto,
          cantidad_items_aplicados: formData.alcance_gasto === 'parcial' ? formData.cantidad_items_aplicados : undefined
        };
        console.log('🔧 Actualizando transporte:', editando.id);
        console.log('📝 Datos a guardar:', updates);
        await actualizarTransporteReal(editando.id, updates);
      } else {
        await crearTransporteReal({
          cotizacion_id: cotizacionId,
          tipo_descripcion: formData.tipo_descripcion,
          costo: formData.costo,
          fecha: formData.fecha,
          factura_url: facturaUrl,
          alcance_gasto: formData.alcance_gasto,
          cantidad_items_aplicados: formData.alcance_gasto === 'parcial' ? formData.cantidad_items_aplicados : undefined
        });
      }

      await cargarDatos();
      onUpdate();
      setMostrarModal(false);
      setEditando(null);
      setFormData({
        tipo_descripcion: '',
        costo: 0,
        fecha: new Date().toISOString().split('T')[0],
        factura: null,
        alcance_gasto: 'unidad',
        cantidad_items_aplicados: 1
      });
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert('Error al guardar: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este transporte?')) return;

    try {
      await eliminarTransporteReal(id);
      await cargarDatos();
      onUpdate();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEditar = (transporte: TransporteReal) => {
    console.log('✏️ Editando transporte:', transporte);
    console.log('✏️ alcance_gasto actual:', transporte.alcance_gasto);
    setEditando(transporte);
    setFormData({
      tipo_descripcion: transporte.tipo_descripcion,
      costo: transporte.costo,
      fecha: transporte.fecha,
      factura: null,
      alcance_gasto: transporte.alcance_gasto || 'unidad',
      cantidad_items_aplicados: transporte.cantidad_items_aplicados || 1
    });
    console.log('✏️ formData.alcance_gasto inicializado a:', transporte.alcance_gasto || 'unidad');
    setMostrarModal(true);
  };

  // Obtener la cantidad del item (los gastos reales están registrados para 1 unidad)
  let cantidadItem = 1;
  if (cotizacion?.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    const itemConCantidad = cotizacion.items.find((item: any) => item.cantidad && item.cantidad > 1);
    if (itemConCantidad) {
      cantidadItem = itemConCantidad.cantidad;
    }
  }
  
  // IMPORTANTE: Calcular total considerando el alcance_gasto de cada transporte
  const total = transportes.reduce((sum, t) => {
    const costoPorUnidad = t.costo || 0;
    let multiplicador = 1;
    
    // Debug: verificar el alcance_gasto guardado
    console.log('Transporte:', t.tipo_descripcion, 'alcance_gasto:', t.alcance_gasto, 'costo:', costoPorUnidad);
    
    if (t.alcance_gasto === 'unidad') {
      // Por 1 unidad: multiplicar por cantidad total de items
      multiplicador = cantidadItem;
    } else if (t.alcance_gasto === 'parcial') {
      // Parcial: usar cantidad_items_aplicados directamente
      multiplicador = t.cantidad_items_aplicados || 1;
    } else if (t.alcance_gasto === 'total') {
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
  
  const totalPorUnidad = cantidadItem > 0 ? total / cantidadItem : total;

  // Extraer transporte presupuestado desde gastos_extras de los items
  const transportePresupuestado: Array<{
    concepto: string;
    monto: number;
    item_nombre: string;
  }> = [];

  if (cotizacion?.items && Array.isArray(cotizacion.items)) {
    cotizacion.items.forEach((item: any) => {
      if (item.gastos_extras && Array.isArray(item.gastos_extras)) {
        item.gastos_extras.forEach((gasto: any) => {
          if (gasto.concepto && (
            gasto.concepto.toLowerCase().includes('transporte') ||
            gasto.concepto.toLowerCase().includes('flete') ||
            gasto.concepto.toLowerCase().includes('envío')
          )) {
            transportePresupuestado.push({
              concepto: gasto.concepto,
              monto: gasto.monto || 0,
              item_nombre: item.nombre || 'Item sin nombre'
            });
          }
        });
      }
    });
  }

  const totalPresupuestado = transportePresupuestado.reduce((sum, t) => sum + t.monto, 0);

  if (cargando) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Tabla de Transporte Presupuestado */}
      {transportePresupuestado.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
            📋 Transporte Presupuestado
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transportePresupuestado.map((trans, index) => {
                  // Verificar si ya hay un registro real similar
                  const registroReal = transportes.find(t => 
                    t.tipo_descripcion.toLowerCase().includes(trans.concepto.toLowerCase()) ||
                    Math.abs(t.costo - trans.monto) < 1000
                  );
                  
                  return (
                    <tr key={index} className={registroReal ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{trans.concepto}</div>
                        {registroReal && (
                          <div className="text-xs text-green-600 mt-1">✓ Registro real existe</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        ${trans.monto.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {trans.item_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!registroReal ? (
                          <button
                            onClick={() => {
                              setEditando(null);
                              setFormData({
                                tipo_descripcion: trans.concepto,
                                costo: trans.monto,
                                fecha: new Date().toISOString().split('T')[0],
                                factura: null,
                                alcance_gasto: 'unidad',
                                cantidad_items_aplicados: 1
                              });
                              setMostrarModal(true);
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                          >
                            Registrar Real
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditar(registroReal)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            Editar Real
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    Total Presupuestado
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">
                    ${totalPresupuestado.toLocaleString('es-CO')}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Información sobre Transporte */}
      <div className={`border rounded-lg p-4 mb-6 ${transportePresupuestado.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-blue-50 border-blue-200'}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">ℹ️ Sobre el Transporte</h3>
        {transportePresupuestado.length > 0 ? (
          <p className="text-sm text-gray-700">
            Se presupuestaron <strong>${totalPresupuestado.toLocaleString('es-CO')}</strong> en transporte.
            Compara con los costos reales registrados abajo.
          </p>
        ) : (
          <p className="text-sm text-gray-700">
            Los costos de transporte reales son gastos que surgen durante la ejecución del proyecto.
            Estos gastos <strong>no están incluidos en el presupuesto inicial</strong> (presupuestado = $0).
          </p>
        )}
        <p className="text-sm text-gray-600 mt-2">
          Ejemplos: flete, envío, transporte de materiales, etc.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Presupuestado</p>
          <p className="text-xl font-bold text-blue-600">${totalPresupuestado.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Real</p>
          <p className="text-xl font-bold text-green-600">${total.toLocaleString('es-CO')}</p>
          {cantidadItem > 1 && transportes.some(t => t.alcance_gasto === 'unidad' || !t.alcance_gasto) && (
            <p className="text-xs text-gray-500 mt-1">
              ${totalPorUnidad.toLocaleString('es-CO')} por unidad (×{cantidadItem})
            </p>
          )}
          {transportes.some(t => t.alcance_gasto === 'total') && (
            <p className="text-xs text-blue-600 mt-1">
              ✓ Incluye gastos por total de items
            </p>
          )}
        </div>
        <div className={`p-4 rounded-lg ${total - totalPresupuestado >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-sm text-gray-600">Diferencia</p>
          <p className={`text-xl font-bold ${total - totalPresupuestado >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {total - totalPresupuestado >= 0 ? '+' : ''}${(total - totalPresupuestado).toLocaleString('es-CO')}
          </p>
          {totalPresupuestado > 0 && (
            <p className="text-xs text-gray-500">
              {((total - totalPresupuestado) / totalPresupuestado * 100).toFixed(1)}%
            </p>
          )}
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Registros</p>
          <p className="text-xl font-bold text-purple-600">{transportes.length}</p>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setEditando(null);
            setFormData({
              tipo_descripcion: '',
              costo: 0,
              fecha: new Date().toISOString().split('T')[0],
              factura: null,
              alcance_gasto: 'unidad',
              cantidad_items_aplicados: 1
            });
            setMostrarModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Agregar Transporte
        </button>
      </div>

      {/* Tabla */}
      {transportes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay transportes registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo/Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transportes.map((transporte) => {
                // Calcular el costo total considerando el alcance
                const costoPorUnidad = transporte.costo || 0;
                let multiplicador = 1;
                if (transporte.alcance_gasto === 'unidad') {
                  multiplicador = cantidadItem;
                } else if (transporte.alcance_gasto === 'parcial') {
                  multiplicador = transporte.cantidad_items_aplicados || 1;
                } else if (transporte.alcance_gasto === 'total') {
                  multiplicador = 1;
                } else {
                  multiplicador = 1; // Por defecto: asumir total
                }
                const costoTotal = costoPorUnidad * multiplicador;
                
                return (
                <tr key={transporte.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{transporte.tipo_descripcion}</div>
                    {transporte.alcance_gasto && (
                      <div className="text-xs text-gray-500 mt-1">
                        Alcance: {transporte.alcance_gasto === 'unidad' ? `1 unidad (×${cantidadItem})` : 
                                 transporte.alcance_gasto === 'parcial' ? `${transporte.cantidad_items_aplicados || 0} items` :
                                 'Total'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    ${costoTotal.toLocaleString('es-CO')}
                    {multiplicador > 1 && (
                      <div className="text-xs text-gray-500 font-normal">
                        ${costoPorUnidad.toLocaleString('es-CO')} × {multiplicador}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(transporte.fecha).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transporte.factura_url ? (
                      <a
                        href={transporte.factura_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        📄 Ver
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(transporte)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(transporte.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editando ? 'Editar' : 'Agregar'} Transporte Real
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo/Descripción *</label>
                <input
                  type="text"
                  value={formData.tipo_descripcion}
                  onChange={(e) => setFormData({ ...formData, tipo_descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Flete, envío, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo *</label>
                  <input
                    type="number"
                    value={formData.costo}
                    onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Factura (opcional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormData({ ...formData, factura: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {editando?.factura_url && (
                  <p className="text-xs text-gray-500 mt-1">
                    Actual: <a href={editando.factura_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600">Ver factura</a>
                  </p>
                )}
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
                      checked={formData.alcance_gasto === 'unidad'}
                      onChange={(e) => {
                        console.log('🔄 Cambiando alcance_gasto a: unidad');
                        setFormData({ ...formData, alcance_gasto: 'unidad' });
                      }}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Por 1 unidad (item) - Se multiplicará</span>
                      <p className="text-xs text-gray-600">⚠️ El sistema multiplicará este gasto por {cantidadItem} items</p>
                      <p className="text-xs text-red-600 font-semibold mt-1">Resultado: ${formData.costo.toLocaleString('es-CO')} × {cantidadItem} = ${(formData.costo * cantidadItem).toLocaleString('es-CO')}</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="alcance"
                      value="parcial"
                      checked={formData.alcance_gasto === 'parcial'}
                      onChange={(e) => {
                        console.log('🔄 Cambiando alcance_gasto a: parcial');
                        setFormData({ ...formData, alcance_gasto: 'parcial' });
                      }}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Por cantidad parcial</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min="1"
                          max={cantidadItem}
                          value={formData.cantidad_items_aplicados}
                          onChange={(e) => setFormData({ ...formData, cantidad_items_aplicados: parseInt(e.target.value) || 1 })}
                          disabled={formData.alcance_gasto !== 'parcial'}
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
                      checked={formData.alcance_gasto === 'total'}
                      onChange={(e) => {
                        console.log('🔄 Cambiando alcance_gasto a: total');
                        setFormData({ ...formData, alcance_gasto: 'total' });
                      }}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Por el total de items ({cantidadItem}) - NO se multiplica</span>
                      <p className="text-xs text-gray-600">✅ El sistema usará este gasto tal cual (sin multiplicar) - ya incluye todos los items</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">Resultado: ${formData.costo.toLocaleString('es-CO')} (sin multiplicar)</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGuardar}
                disabled={guardando || !formData.tipo_descripcion.trim() || formData.costo <= 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setEditando(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

