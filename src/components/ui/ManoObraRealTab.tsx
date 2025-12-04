/**
 * Tab para gestionar mano de obra real
 */
import { useState, useEffect } from 'react';
import { obtenerManoObraRealPorCotizacion, crearManoObraReal, actualizarManoObraReal, eliminarManoObraReal } from '../../services/mano-obra-real.service';
import { obtenerTrabajadoresTaller } from '../../services/usuarios.service';
import { subirImagen } from '../../services/storage.service';
import type { ManoObraReal, UserProfile } from '../../types/database';

interface ManoObraRealTabProps {
  cotizacionId: string;
  cotizacion: any; // Cotizacion
  onUpdate: () => void;
}

export default function ManoObraRealTab({ cotizacionId, cotizacion, onUpdate }: ManoObraRealTabProps) {
  const [registros, setRegistros] = useState<ManoObraReal[]>([]);
  const [trabajadores, setTrabajadores] = useState<UserProfile[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<ManoObraReal | null>(null);
  const [formData, setFormData] = useState({
    trabajador_id: '',
    horas_trabajadas: 0,
    pago_por_hora: 0,
    fecha: new Date().toISOString().split('T')[0],
    comprobante: null as File | null,
    notas: '',
    alcance_gasto: 'unidad' as 'unidad' | 'parcial' | 'total',
    cantidad_items_aplicados: 1
  });
  const [guardando, setGuardando] = useState(false);
  const [detailsMenuOpen, setDetailsMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [cotizacionId]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [registrosData, trabajadoresData] = await Promise.all([
        obtenerManoObraRealPorCotizacion(cotizacionId),
        obtenerTrabajadoresTaller()
      ]);
      setRegistros(registrosData);
      setTrabajadores(trabajadoresData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar mano de obra real');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    if (formData.horas_trabajadas <= 0 || formData.pago_por_hora <= 0) {
      alert('Las horas trabajadas y el pago por hora deben ser mayores a 0');
      return;
    }

    try {
      setGuardando(true);
      let comprobanteUrl: string | undefined;

      // Subir comprobante si existe
      if (formData.comprobante) {
        comprobanteUrl = await subirImagen(formData.comprobante, 'comprobantes');
      }

      if (editando) {
        await actualizarManoObraReal(editando.id, {
          trabajador_id: formData.trabajador_id || undefined,
          horas_trabajadas: formData.horas_trabajadas,
          pago_por_hora: formData.pago_por_hora,
          fecha: formData.fecha,
          comprobante_url: comprobanteUrl,
          notas: formData.notas || undefined,
          alcance_gasto: formData.alcance_gasto,
          cantidad_items_aplicados: formData.alcance_gasto === 'parcial' ? formData.cantidad_items_aplicados : undefined
        });
      } else {
        await crearManoObraReal({
          cotizacion_id: cotizacionId,
          trabajador_id: formData.trabajador_id || undefined,
          horas_trabajadas: formData.horas_trabajadas,
          pago_por_hora: formData.pago_por_hora,
          fecha: formData.fecha,
          comprobante_url: comprobanteUrl,
          notas: formData.notas || undefined,
          alcance_gasto: formData.alcance_gasto,
          cantidad_items_aplicados: formData.alcance_gasto === 'parcial' ? formData.cantidad_items_aplicados : undefined
        });
      }

      await cargarDatos();
      onUpdate();
      setMostrarModal(false);
      setEditando(null);
      setFormData({
        trabajador_id: '',
        horas_trabajadas: 0,
        pago_por_hora: 0,
        fecha: new Date().toISOString().split('T')[0],
        comprobante: null,
        notas: '',
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
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await eliminarManoObraReal(id);
      await cargarDatos();
      onUpdate();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEditar = (registro: ManoObraReal) => {
    setEditando(registro);
    setFormData({
      trabajador_id: registro.trabajador_id || '',
      horas_trabajadas: registro.horas_trabajadas,
      pago_por_hora: registro.pago_por_hora,
      fecha: registro.fecha,
      comprobante: null,
      notas: registro.notas || '',
      alcance_gasto: registro.alcance_gasto || 'unidad',
      cantidad_items_aplicados: registro.cantidad_items_aplicados || 1
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
  
  // IMPORTANTE: Calcular total considerando el alcance_gasto de cada registro
  const totalPagado = registros.reduce((sum, r) => {
    const costoPorUnidad = r.total_pagado || 0;
    let multiplicador = 1;
    
    if (r.alcance_gasto === 'unidad') {
      multiplicador = cantidadItem;
    } else if (r.alcance_gasto === 'parcial') {
      multiplicador = r.cantidad_items_aplicados || 1;
    } else if (r.alcance_gasto === 'total') {
      multiplicador = 1;
    } else {
      // Por defecto: multiplicar por cantidadItem
      multiplicador = cantidadItem;
    }
    
    return sum + (costoPorUnidad * multiplicador);
  }, 0);
  
  const totalPagadoPorUnidad = totalPagado / cantidadItem;
  
  const totalHoras = registros.reduce((sum, r) => sum + r.horas_trabajadas, 0);

  // Calcular mano de obra presupuestada desde items (ya incluye cantidad del item)
  const serviciosPresupuestados: Array<{
    servicio_nombre: string;
    horas: number;
    precio_por_hora: number;
    costo_total: number;
    item_nombre: string;
  }> = [];

  if (cotizacion?.items && Array.isArray(cotizacion.items)) {
    cotizacion.items.forEach((item: any) => {
      const cantidadItemPresupuestado = item.cantidad || 1;
      if (item.servicios && Array.isArray(item.servicios)) {
        item.servicios.forEach((serv: any) => {
          const horas = serv.horas || 0;
          const precioPorHora = serv.precio_por_hora || 0;
          // El costo total ya incluye la cantidad del item en el precio_total del item
          // Pero aquí calculamos por servicio, así que multiplicamos por cantidad
          serviciosPresupuestados.push({
            servicio_nombre: serv.servicio_nombre || 'Mano de Obra',
            horas: horas * cantidadItemPresupuestado,
            precio_por_hora: precioPorHora,
            costo_total: horas * precioPorHora * cantidadItemPresupuestado,
            item_nombre: item.nombre || 'Item sin nombre'
          });
        });
      }
    });
  }

  const totalPresupuestado = serviciosPresupuestados.reduce((sum, s) => sum + s.costo_total, 0);
  const horasPresupuestadas = serviciosPresupuestados.reduce((sum, s) => sum + s.horas, 0);

  if (cargando) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Tabla de Mano de Obra Presupuestada */}
      {serviciosPresupuestados.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
            📋 Mano de Obra Presupuestada
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviciosPresupuestados.map((serv, index) => {
                  // Verificar si ya hay un registro real para este servicio
                  const registroReal = registros.find(r => 
                    r.horas_trabajadas === serv.horas && 
                    Math.abs(r.pago_por_hora - serv.precio_por_hora) < 1
                  );
                  
                  return (
                    <tr key={index} className={registroReal ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{serv.servicio_nombre}</div>
                        {registroReal && (
                          <div className="text-xs text-green-600 mt-1">✓ Registro real existe</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{serv.horas}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${serv.precio_por_hora.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        ${serv.costo_total.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {serv.item_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!registroReal ? (
                          <button
                            onClick={() => {
                              setEditando(null);
                              setFormData({
                                trabajador_id: '',
                                horas_trabajadas: serv.horas,
                                pago_por_hora: serv.precio_por_hora,
                                fecha: new Date().toISOString().split('T')[0],
                                comprobante: null,
                                notas: `Desde presupuesto: ${serv.servicio_nombre} - ${serv.item_nombre}`,
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
                  <td colSpan={2} className="px-6 py-3 text-sm font-medium text-gray-900">
                    Total Presupuestado
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {horasPresupuestadas.toFixed(2)} horas
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

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Horas</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalHoras.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Pagado {cantidadItem > 1 && `(×${cantidadItem} unidades)`}</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">${totalPagado.toLocaleString('es-CO')}</p>
          {cantidadItem > 1 && (
            <p className="text-xs text-gray-500 mt-1">
              ${totalPagadoPorUnidad.toLocaleString('es-CO')} por unidad
            </p>
          )}
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Registros</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">{registros.length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Presupuestado</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">${totalPresupuestado.toLocaleString('es-CO')}</p>
          <p className="text-xs text-gray-500">{horasPresupuestadas.toFixed(2)} horas</p>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setEditando(null);
            setFormData({
              trabajador_id: '',
              horas_trabajadas: 0,
              pago_por_hora: 0,
              fecha: new Date().toISOString().split('T')[0],
              comprobante: null,
              notas: '',
              alcance_gasto: 'unidad',
              cantidad_items_aplicados: 1
            });
            setMostrarModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Agregar Mano de Obra
        </button>
      </div>

      {/* Vista móvil - Cards */}
      {registros.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay registros de mano de obra real</p>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {registros.map((registro) => (
              <div key={registro.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-0.5">Trabajador</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {registro.trabajador
                        ? `${registro.trabajador.nombre || ''} ${registro.trabajador.apellido || ''}`.trim() || registro.trabajador.email || 'Sin nombre'
                        : 'No asignado'}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Horas:</span>
                    <span className="text-sm font-medium text-gray-900">{registro.horas_trabajadas}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Pago/hora:</span>
                    <span className="text-sm text-gray-900">${registro.pago_por_hora.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${registro.total_pagado.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Fecha:</span>
                    <span className="text-sm text-gray-700">
                      {new Date(registro.fecha).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                  {registro.alcance_gasto && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Alcance:</span>
                      <span className="text-xs text-gray-700">
                        {registro.alcance_gasto === 'unidad' ? '1 unidad' : 
                         registro.alcance_gasto === 'parcial' ? `${registro.cantidad_items_aplicados || 0} items` :
                         'Total'}
                      </span>
                    </div>
                  )}
                  {registro.notas && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">Notas:</span>
                      <p className="text-xs text-gray-700 mt-1">{registro.notas}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                  <button
                    onClick={() => {
                      handleEditar(registro);
                      setDetailsMenuOpen(null);
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => {
                      handleEliminar(registro.id);
                      setDetailsMenuOpen(null);
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vista desktop - Tabla simplificada */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajador</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Más Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {registro.trabajador
                        ? `${registro.trabajador.nombre || ''} ${registro.trabajador.apellido || ''}`.trim() || registro.trabajador.email || 'Sin nombre'
                        : 'No asignado'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{registro.horas_trabajadas}</td>
                    <td className="px-4 py-4 whitespace-nowrap">${registro.pago_por_hora.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium">${registro.total_pagado.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button
                          onClick={() => setDetailsMenuOpen(detailsMenuOpen === registro.id ? null : registro.id)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Más información"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        {detailsMenuOpen === registro.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-2">
                              <div className="px-4 py-2 text-xs">
                                <span className="text-gray-500">Fecha:</span>
                                <div className="text-sm text-gray-900 mt-1">
                                  {new Date(registro.fecha).toLocaleDateString('es-CO')}
                                </div>
                              </div>
                              {registro.alcance_gasto && (
                                <div className="px-4 py-2 text-xs border-t border-gray-100">
                                  <span className="text-gray-500">Alcance:</span>
                                  <div className="text-sm text-gray-900 mt-1">
                                    {registro.alcance_gasto === 'unidad' ? '1 unidad' : 
                                     registro.alcance_gasto === 'parcial' ? `${registro.cantidad_items_aplicados || 0} items` :
                                     'Total'}
                                  </div>
                                </div>
                              )}
                              {registro.notas && (
                                <div className="px-4 py-2 text-xs border-t border-gray-100">
                                  <span className="text-gray-500">Notas:</span>
                                  <div className="text-sm text-gray-900 mt-1">{registro.notas}</div>
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
                          onClick={() => handleEditar(registro)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(registro.id)}
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
        </>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editando ? 'Editar' : 'Agregar'} Mano de Obra Real
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trabajador</label>
                <select
                  value={formData.trabajador_id}
                  onChange={(e) => setFormData({ ...formData, trabajador_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar trabajador (opcional)</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre || ''} {t.apellido || ''} {!t.nombre && !t.apellido ? (t.email || 'Sin nombre') : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas Trabajadas *</label>
                  <input
                    type="number"
                    value={formData.horas_trabajadas}
                    onChange={(e) => setFormData({ ...formData, horas_trabajadas: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="0.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pago por Hora *</label>
                  <input
                    type="number"
                    value={formData.pago_por_hora}
                    onChange={(e) => setFormData({ ...formData, pago_por_hora: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormData({ ...formData, comprobante: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              {formData.horas_trabajadas > 0 && formData.pago_por_hora > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total a pagar:</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${(formData.horas_trabajadas * formData.pago_por_hora).toLocaleString('es-CO')}
                  </p>
                </div>
              )}

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
                      onChange={(e) => setFormData({ ...formData, alcance_gasto: 'unidad' })}
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
                      checked={formData.alcance_gasto === 'parcial'}
                      onChange={(e) => setFormData({ ...formData, alcance_gasto: 'parcial' })}
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
                      onChange={(e) => setFormData({ ...formData, alcance_gasto: 'total' })}
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

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGuardar}
                disabled={guardando || formData.horas_trabajadas <= 0 || formData.pago_por_hora <= 0}
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

