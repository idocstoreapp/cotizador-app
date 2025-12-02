/**
 * Tab para gestionar facturas
 */
import { useState, useEffect } from 'react';
import { obtenerFacturasPorCotizacion, crearFactura, actualizarFactura, eliminarFactura } from '../../services/facturas.service';
import { subirImagen } from '../../services/storage.service';
import type { Factura } from '../../types/database';

interface FacturasTabProps {
  cotizacionId: string;
  onUpdate: () => void;
}

export default function FacturasTab({ cotizacionId, onUpdate }: FacturasTabProps) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<Factura | null>(null);
  const [formData, setFormData] = useState({
    numero_factura: '',
    fecha_factura: new Date().toISOString().split('T')[0],
    proveedor: '',
    total: 0,
    tipo: 'material' as 'material' | 'mano_obra' | 'transporte' | 'gasto_hormiga' | 'mixta',
    archivo: null as File | null
  });
  const [guardando, setGuardando] = useState(false);
  const [sincronizando, setSincronizando] = useState<string | null>(null);
  const [sincronizandoTodas, setSincronizandoTodas] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [cotizacionId]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const facturasData = await obtenerFacturasPorCotizacion(cotizacionId);
      setFacturas(facturasData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar facturas');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    if (!formData.numero_factura.trim() || formData.total <= 0) {
      alert('El número de factura y el total son requeridos');
      return;
    }

    try {
      setGuardando(true);
      let archivoUrl: string | undefined;

      // Subir archivo si existe
      if (formData.archivo) {
        archivoUrl = await subirImagen(formData.archivo, 'facturas');
      }

      if (editando) {
        await actualizarFactura(editando.id, {
          numero_factura: formData.numero_factura,
          fecha_factura: formData.fecha_factura,
          proveedor: formData.proveedor || undefined,
          total: formData.total,
          archivo_url: archivoUrl,
          tipo: formData.tipo
        });
      } else {
        await crearFactura({
          cotizacion_id: cotizacionId,
          numero_factura: formData.numero_factura,
          fecha_factura: formData.fecha_factura,
          proveedor: formData.proveedor || undefined,
          total: formData.total,
          archivo_url: archivoUrl,
          tipo: formData.tipo
        });
      }

      await cargarDatos();
      onUpdate();
      setMostrarModal(false);
      setEditando(null);
      setFormData({
        numero_factura: '',
        fecha_factura: new Date().toISOString().split('T')[0],
        proveedor: '',
        total: 0,
        tipo: 'material',
        archivo: null
      });
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert('Error al guardar: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta factura?')) return;

    try {
      await eliminarFactura(id);
      await cargarDatos();
      onUpdate();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEditar = (factura: Factura) => {
    setEditando(factura);
    setFormData({
      numero_factura: factura.numero_factura,
      fecha_factura: factura.fecha_factura,
      proveedor: factura.proveedor || '',
      total: factura.total,
      tipo: factura.tipo,
      archivo: null
    });
    setMostrarModal(true);
  };

  const handleSincronizarFactura = async (factura: Factura) => {
    if (sincronizando) return;

    try {
      setSincronizando(factura.id);
      
      const response = await fetch('/api/sincronizar-factura-bsale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ facturaId: factura.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al sincronizar');
      }

      if (data.success) {
        alert(`✅ Factura sincronizada exitosamente con Bsale`);
        await cargarDatos();
        onUpdate();
      } else {
        throw new Error(data.error || 'No se pudo sincronizar');
      }
    } catch (error: any) {
      console.error('Error al sincronizar:', error);
      alert(`❌ Error: ${error.message || 'No se pudo sincronizar la factura con Bsale'}`);
    } finally {
      setSincronizando(null);
    }
  };

  const handleSincronizarTodas = async () => {
    if (sincronizandoTodas) return;

    if (!confirm(`¿Sincronizar todas las facturas sin enlace a Bsale? (${facturas.filter(f => !f.bsale_document_id).length} facturas)`)) {
      return;
    }

    try {
      setSincronizandoTodas(true);
      
      const response = await fetch('/api/sincronizar-todas-facturas-bsale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 100 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al sincronizar');
      }

      if (data.success) {
        alert(`✅ Sincronización completada:\n- ${data.sincronizadas} sincronizadas\n- ${data.no_encontradas} no encontradas\n- ${data.errores} errores`);
        await cargarDatos();
        onUpdate();
      } else {
        throw new Error(data.error || 'No se pudo sincronizar');
      }
    } catch (error: any) {
      console.error('Error al sincronizar todas:', error);
      alert(`❌ Error: ${error.message || 'No se pudieron sincronizar las facturas'}`);
    } finally {
      setSincronizandoTodas(false);
    }
  };

  const generarUrlBsale = (documentId: number) => {
    return `https://www.bsale.cl/document/${documentId}`;
  };

  const total = facturas.reduce((sum, f) => sum + f.total, 0);

  if (cargando) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Total Facturas</p>
            <p className="text-2xl font-bold text-indigo-600">${total.toLocaleString('es-CO')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Cantidad</p>
            <p className="text-2xl font-bold text-indigo-600">{facturas.length}</p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {facturas.filter(f => !f.bsale_document_id).length > 0 && (
            <button
              onClick={handleSincronizarTodas}
              disabled={sincronizandoTodas}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
              title="Sincronizar todas las facturas sin enlace a Bsale"
            >
              {sincronizandoTodas ? '⏳ Sincronizando...' : `🔄 Sincronizar con Bsale (${facturas.filter(f => !f.bsale_document_id).length})`}
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setFormData({
              numero_factura: '',
              fecha_factura: new Date().toISOString().split('T')[0],
              proveedor: '',
              total: 0,
              tipo: 'material',
              archivo: null
            });
            setMostrarModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Agregar Factura
        </button>
      </div>

      {/* Tabla */}
      {facturas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay facturas registradas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bsale</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facturas.map((factura) => (
                <tr key={factura.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{factura.numero_factura}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {factura.proveedor || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      {factura.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    ${factura.total.toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(factura.fecha_factura).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {factura.bsale_document_id ? (
                      <a
                        href={generarUrlBsale(factura.bsale_document_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                        title="Ver en Bsale"
                      >
                        🔗 Ver en Bsale
                      </a>
                    ) : (
                      <button
                        onClick={() => handleSincronizarFactura(factura)}
                        disabled={sincronizando === factura.id}
                        className="text-orange-600 hover:text-orange-800 text-sm disabled:text-gray-400"
                        title="Sincronizar con Bsale"
                      >
                        {sincronizando === factura.id ? '⏳...' : '🔄 Sincronizar'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {factura.archivo_url ? (
                      <a
                        href={factura.archivo_url}
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
                        onClick={() => handleEditar(factura)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(factura.id)}
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editando ? 'Editar' : 'Agregar'} Factura
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Factura *</label>
                <input
                  type="text"
                  value={formData.numero_factura}
                  onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha_factura}
                    onChange={(e) => setFormData({ ...formData, fecha_factura: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total *</label>
                  <input
                    type="number"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="material">Material</option>
                  <option value="mano_obra">Mano de Obra</option>
                  <option value="transporte">Transporte</option>
                  <option value="gasto_hormiga">Gasto Hormiga</option>
                  <option value="mixta">Mixta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivo (opcional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormData({ ...formData, archivo: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {editando?.archivo_url && (
                  <p className="text-xs text-gray-500 mt-1">
                    Actual: <a href={editando.archivo_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600">Ver archivo</a>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGuardar}
                disabled={guardando || !formData.numero_factura.trim() || formData.total <= 0}
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

