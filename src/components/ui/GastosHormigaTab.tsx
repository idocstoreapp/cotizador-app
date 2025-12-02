/**
 * Tab para gestionar gastos hormiga
 */
import { useState, useEffect } from 'react';
import { obtenerGastosHormigaPorCotizacion, crearGastoHormiga, actualizarGastoHormiga, eliminarGastoHormiga } from '../../services/gastos-hormiga.service';
import { subirImagen } from '../../services/storage.service';
import type { GastoHormiga } from '../../types/database';

interface GastosHormigaTabProps {
  cotizacionId: string;
  cotizacion: any; // Cotizacion
  onUpdate: () => void;
}

export default function GastosHormigaTab({ cotizacionId, cotizacion, onUpdate }: GastosHormigaTabProps) {
  const [gastos, setGastos] = useState<GastoHormiga[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<GastoHormiga | null>(null);
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    factura: null as File | null,
    evidencia: null as File | null
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [cotizacionId]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const gastosData = await obtenerGastosHormigaPorCotizacion(cotizacionId);
      setGastos(gastosData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar gastos hormiga');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    if (!formData.descripcion.trim() || formData.monto <= 0) {
      alert('La descripción y el monto son requeridos');
      return;
    }

    try {
      setGuardando(true);
      let facturaUrl: string | undefined;
      let evidenciaUrl: string | undefined;

      // Subir archivos si existen
      if (formData.factura) {
        facturaUrl = await subirImagen(formData.factura, 'facturas');
      }
      if (formData.evidencia) {
        evidenciaUrl = await subirImagen(formData.evidencia, 'evidencias');
      }

      if (editando) {
        await actualizarGastoHormiga(editando.id, {
          descripcion: formData.descripcion,
          monto: formData.monto,
          fecha: formData.fecha,
          factura_url: facturaUrl,
          evidencia_url: evidenciaUrl
        });
      } else {
        await crearGastoHormiga({
          cotizacion_id: cotizacionId,
          descripcion: formData.descripcion,
          monto: formData.monto,
          fecha: formData.fecha,
          factura_url: facturaUrl,
          evidencia_url: evidenciaUrl
        });
      }

      await cargarDatos();
      onUpdate();
      setMostrarModal(false);
      setEditando(null);
      setFormData({
        descripcion: '',
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        factura: null,
        evidencia: null
      });
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert('Error al guardar: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      await eliminarGastoHormiga(id);
      await cargarDatos();
      onUpdate();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEditar = (gasto: GastoHormiga) => {
    setEditando(gasto);
    setFormData({
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      factura: null,
      evidencia: null
    });
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
  
  // IMPORTANTE: Los gastos hormiga están registrados para 1 unidad
  // Necesitamos multiplicarlos por la cantidad del item
  const totalPorUnidad = gastos.reduce((sum, g) => sum + g.monto, 0);
  const total = totalPorUnidad * cantidadItem;

  // Extraer costos indirectos presupuestados desde gastos_extras de los items
  const costosIndirectosPresupuestados: Array<{
    concepto: string;
    monto: number;
    item_nombre: string;
    categoria: 'herramientas' | 'alquiler' | 'caja_chica' | 'gastos_extras' | 'otro';
  }> = [];

  if (cotizacion?.items && Array.isArray(cotizacion.items)) {
    cotizacion.items.forEach((item: any) => {
      if (item.gastos_extras && Array.isArray(item.gastos_extras)) {
        item.gastos_extras.forEach((gasto: any) => {
          if (gasto.concepto && gasto.monto) {
            const conceptoLower = gasto.concepto.toLowerCase();
            let categoria: 'herramientas' | 'alquiler' | 'caja_chica' | 'gastos_extras' | 'otro' = 'otro';
            
            if (conceptoLower.includes('herramienta') || conceptoLower.includes('desgaste')) {
              categoria = 'herramientas';
            } else if (conceptoLower.includes('alquiler') || conceptoLower.includes('espacio')) {
              categoria = 'alquiler';
            } else if (conceptoLower.includes('caja chica') || conceptoLower.includes('cajachica')) {
              categoria = 'caja_chica';
            } else if (conceptoLower.includes('gastos extras') || conceptoLower.includes('gastosextras')) {
              categoria = 'gastos_extras';
            }
            
            // Excluir transporte (ya está en su propia pestaña)
            if (!conceptoLower.includes('transporte') && !conceptoLower.includes('flete') && !conceptoLower.includes('envío')) {
              costosIndirectosPresupuestados.push({
                concepto: gasto.concepto,
                monto: gasto.monto || 0,
                item_nombre: item.nombre || 'Item sin nombre',
                categoria
              });
            }
          }
        });
      }
    });
  }

  const totalPresupuestado = costosIndirectosPresupuestados.reduce((sum, c) => sum + c.monto, 0);
  
  // Agrupar por categoría
  const porCategoria = {
    herramientas: costosIndirectosPresupuestados.filter(c => c.categoria === 'herramientas'),
    alquiler: costosIndirectosPresupuestados.filter(c => c.categoria === 'alquiler'),
    caja_chica: costosIndirectosPresupuestados.filter(c => c.categoria === 'caja_chica'),
    gastos_extras: costosIndirectosPresupuestados.filter(c => c.categoria === 'gastos_extras'),
    otro: costosIndirectosPresupuestados.filter(c => c.categoria === 'otro')
  };

  if (cargando) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Tabla de Costos Indirectos Presupuestados */}
      {costosIndirectosPresupuestados.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
            📋 Costos Indirectos Presupuestados
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costosIndirectosPresupuestados.map((costo, index) => {
                  // Verificar si ya hay un gasto hormiga similar
                  const gastoReal = gastos.find(g => 
                    g.descripcion.toLowerCase().includes(costo.concepto.toLowerCase()) ||
                    Math.abs(g.monto - costo.monto) < 1000
                  );
                  
                  return (
                    <tr key={index} className={gastoReal ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{costo.concepto}</div>
                        {gastoReal && (
                          <div className="text-xs text-green-600 mt-1">✓ Gasto real registrado</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {costo.categoria === 'herramientas' ? '🔧 Herramientas' :
                           costo.categoria === 'alquiler' ? '🏢 Alquiler' :
                           costo.categoria === 'caja_chica' ? '💰 Caja Chica' :
                           costo.categoria === 'gastos_extras' ? '📊 Gastos Extras' : '📝 Otro'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        ${costo.monto.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {costo.item_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!gastoReal ? (
                          <button
                            onClick={() => {
                              setEditando(null);
                              setFormData({
                                descripcion: costo.concepto,
                                monto: costo.monto,
                                fecha: new Date().toISOString().split('T')[0],
                                factura: null,
                                evidencia: null
                              });
                              setMostrarModal(true);
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                          >
                            Registrar Real
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditar(gastoReal)}
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
                  <td colSpan={2} className="px-6 py-3 text-sm font-medium text-gray-900">
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

      {/* Información sobre Gastos Hormiga */}
      <div className={`border rounded-lg p-4 mb-6 ${costosIndirectosPresupuestados.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">ℹ️ Sobre los Gastos Hormiga</h3>
        {costosIndirectosPresupuestados.length > 0 ? (
          <p className="text-sm text-gray-700">
            Se presupuestaron <strong>${totalPresupuestado.toLocaleString('es-CO')}</strong> en costos indirectos 
            (herramientas, alquiler, caja chica, gastos extras). 
            Los gastos hormiga adicionales no presupuestados se registran abajo.
          </p>
        ) : (
          <p className="text-sm text-gray-700">
            Los gastos hormiga son gastos menores no presupuestados que surgen durante la ejecución del proyecto.
            Estos gastos <strong>no están incluidos en el presupuesto inicial</strong> (presupuestado = $0).
          </p>
        )}
        <p className="text-sm text-gray-600 mt-2">
          Ejemplos: tornillos adicionales, pegamento, herramientas pequeñas, etc.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Presupuestado</p>
          <p className="text-xl font-bold text-blue-600">${totalPresupuestado.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Real (Hormiga) (×{cantidadItem} unidades)</p>
          <p className="text-xl font-bold text-green-600">${total.toLocaleString('es-CO')}</p>
          {cantidadItem > 1 && (
            <p className="text-xs text-gray-500 mt-1">
              ${totalPorUnidad.toLocaleString('es-CO')} por unidad
            </p>
          )}
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Real</p>
          <p className="text-xl font-bold text-yellow-600">${(totalPresupuestado + total).toLocaleString('es-CO')}</p>
          <p className="text-xs text-gray-500">Presup. + Hormiga</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Registros</p>
          <p className="text-xl font-bold text-purple-600">{gastos.length}</p>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setEditando(null);
            setFormData({
              descripcion: '',
              monto: 0,
              fecha: new Date().toISOString().split('T')[0],
              factura: null,
              evidencia: null
            });
            setMostrarModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Agregar Gasto Hormiga
        </button>
      </div>

      {/* Tabla */}
      {gastos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay gastos hormiga registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gastos.map((gasto) => (
                <tr key={gasto.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{gasto.descripcion}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    ${gasto.monto.toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(gasto.fecha).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {gasto.factura_url && (
                        <a
                          href={gasto.factura_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          📄 Factura
                        </a>
                      )}
                      {gasto.evidencia_url && (
                        <a
                          href={gasto.evidencia_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          📷 Evidencia
                        </a>
                      )}
                      {!gasto.factura_url && !gasto.evidencia_url && (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(gasto)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(gasto.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editando ? 'Editar' : 'Agregar'} Gasto Hormiga
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Tornillos, pegamento, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                  <input
                    type="number"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="100"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evidencia (opcional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormData({ ...formData, evidencia: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {editando?.evidencia_url && (
                  <p className="text-xs text-gray-500 mt-1">
                    Actual: <a href={editando.evidencia_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600">Ver evidencia</a>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGuardar}
                disabled={guardando || !formData.descripcion.trim() || formData.monto <= 0}
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

