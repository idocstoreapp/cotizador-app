/**
 * Modal para editar una cotización existente
 * Permite agregar/quitar items y guardar con historial de modificaciones
 */
import { useState, useEffect, useMemo } from 'react';
import { useCotizacionStore } from '../store/cotizacionStore';
import { actualizarCotizacionConHistorial } from '../services/cotizaciones.service';
import { convertirItemsACotizacionInput } from '../utils/convertirCotizacionStore';
import CotizacionCart from './ui/CotizacionCart';
import AgregarItemManual from './ui/AgregarItemManual';
import type { Cotizacion } from '../types/database';
import type { ItemCotizacion } from '../types/muebles';

interface EditarCotizacionModalProps {
  cotizacion: Cotizacion;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditarCotizacionModal({
  cotizacion,
  usuarioId,
  onClose,
  onSuccess
}: EditarCotizacionModalProps) {
  const { items, subtotal, descuento, iva, total, limpiarCotizacion, calcularTotales, setAplicaIVA } = useCotizacionStore();
  const [mostrarAgregarManual, setMostrarAgregarManual] = useState(false);
  const [descripcionModificacion, setDescripcionModificacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargandoItems, setCargandoItems] = useState(true);
  const [itemsInicialesSnapshot, setItemsInicialesSnapshot] = useState('[]');
  const [aplicaIVA, setAplicaIVALocal] = useState<boolean>(cotizacion.aplica_iva !== undefined ? cotizacion.aplica_iva : true);

  const normalizarEstadoParaComparar = (itemsCotizacion: ItemCotizacion[], descuentoCotizacion: number, aplicaIVACotizacion: boolean) => JSON.stringify({
    items: itemsCotizacion.map((item) => ({
      ...item,
      // El store genera IDs nuevos al cargar los items existentes; no deben impedir detectar cambios reales.
      id: undefined
    })),
    descuento: descuentoCotizacion,
    aplicaIVA: aplicaIVACotizacion
  });

  const estadoActualSnapshot = useMemo(
    () => normalizarEstadoParaComparar(items, descuento, aplicaIVA),
    [items, descuento, aplicaIVA]
  );
  const hayModificaciones = estadoActualSnapshot !== itemsInicialesSnapshot;

  // Cargar items de la cotización al abrir el modal
  useEffect(() => {
    const cargarItems = async () => {
      try {
        setCargandoItems(true);
        console.log('🔄 Cargando items de cotización:', {
          cotizacionId: cotizacion.id,
          tieneItems: !!cotizacion.items,
          itemsLength: Array.isArray(cotizacion.items) ? cotizacion.items.length : 0
        });

        // Limpiar el store primero
        limpiarCotizacion();
        // Asegurar que el cálculo del store respete el IVA de la cotización
        setAplicaIVA(cotizacion.aplica_iva !== undefined ? cotizacion.aplica_iva : true);

        if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
          // Convertir items de la cotización al formato del store
          const itemsParaStore = cotizacion.items.map((item: any) => {
            // Si es un item manual, mantenerlo tal cual
            if (item.tipo === 'manual') {
              return item as ItemCotizacion;
            }
            // Si es un item del catálogo, reconstruirlo
            if (item.tipo === 'catalogo' && item.mueble) {
              return {
                id: item.id || `catalogo-${item.mueble.id}-${Date.now()}`,
                tipo: 'catalogo',
                mueble_id: item.mueble.id,
                mueble: item.mueble,
                opciones: item.opciones || {},
                cantidad: item.cantidad || 1,
                precio_unitario: item.precio_unitario || item.mueble.precio_base || 0,
                precio_total: item.precio_total || (item.precio_unitario || 0) * (item.cantidad || 1),
                medidas: item.medidas || item.mueble.medidas,
                materiales: item.materiales || item.mueble.materiales_predeterminados,
                dias_fabricacion: item.dias_fabricacion || item.mueble.dias_fabricacion,
                horas_mano_obra: item.horas_mano_obra || item.mueble.horas_mano_obra,
                margen_ganancia: item.margen_ganancia || item.mueble.margen_ganancia
              } as ItemCotizacion;
            }
            return item as ItemCotizacion;
          });

          // Cargar items en el store usando las acciones del store
          // (agregarMueble/agregarItemManual ahora generan IDs únicos con Math.random())
          const store = useCotizacionStore.getState();
          itemsParaStore.forEach((item: ItemCotizacion) => {
            try {
              if (item.tipo === 'catalogo' && item.mueble) {
                store.agregarMueble(
                  item.mueble,
                  item.opciones || {},
                  item.cantidad || 1
                );
              } else if (item.tipo === 'manual') {
                store.agregarItemManual({
                  nombre: item.nombre || '',
                  descripcion: item.descripcion,
                  medidas: item.medidas,
                  cantidad: item.cantidad || 1,
                  materiales: item.materiales || [],
                  servicios: item.servicios || [],
                  gastos_extras: item.gastos_extras,
                  costos_indirectos: item.costos_indirectos,
                  margen_ganancia: item.margen_ganancia
                });
              }
            } catch (error) {
              console.error('Error al agregar item:', error, item);
            }
          });

          // Recalcular totales después de cargar todos los items
          calcularTotales();

          console.log('✅ Items cargados en el store');
        } else {
          console.log('⚠️ La cotización no tiene items o está vacía');
        }

        const estadoStore = useCotizacionStore.getState();
        setItemsInicialesSnapshot(normalizarEstadoParaComparar(estadoStore.items, estadoStore.descuento, cotizacion.aplica_iva !== undefined ? cotizacion.aplica_iva : true));
      } catch (error) {
        console.error('❌ Error al cargar items de la cotización:', error);
        alert('Error al cargar los items de la cotización. Por favor, intenta de nuevo.');
      } finally {
        setCargandoItems(false);
      }
    };

    cargarItems();
  }, [cotizacion.id, cotizacion.aplica_iva, limpiarCotizacion, calcularTotales, setAplicaIVA]);

  // Mantener store y estado local sincronizados
  useEffect(() => {
    setAplicaIVA(aplicaIVA);
  }, [aplicaIVA, setAplicaIVA]);

  const handleGuardar = async () => {
    if (items.length === 0) {
      alert('No puedes guardar una cotización sin items');
      return;
    }

    if (!hayModificaciones) {
      alert('No hay modificaciones para guardar');
      return;
    }

    try {
      setGuardando(true);

      // Convertir items del store a formato CotizacionInput
      const cotizacionInput = convertirItemsACotizacionInput(
        items,
        {
          nombre: cotizacion.cliente_nombre,
          telefono: cotizacion.cliente_telefono || '',
          email: cotizacion.cliente_email || '',
          direccion: cotizacion.cliente_direccion || ''
        },
        cotizacion.margen_ganancia || 30,
        aplicaIVA
      );

      // Actualizar cotización con historial
      // Pasar los totales calculados desde items para que coincidan
      await actualizarCotizacionConHistorial(
        cotizacion.id,
        cotizacionInput,
        items,
        descripcionModificacion.trim() || 'Modificación de items de la cotización',
        usuarioId,
        subtotal,
        descuento,
        iva,
        total
      );

      alert('✅ Cotización actualizada exitosamente');

      // Limpiar el store para evitar datos stale
      useCotizacionStore.getState().limpiarCotizacion();

      onSuccess();
      onClose();

      // Redirigir al historial para refrescar la página completamente
      window.location.href = '/cotizaciones';
    } catch (error: any) {
      console.error('Error al actualizar cotización:', error);
      alert('Error al actualizar cotización: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Cotización</h2>
            <p className="text-sm text-gray-600 mt-1">
              Número: {cotizacion.numero} | Cliente: {cotizacion.cliente_nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* IVA */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-gray-900">IVA</p>
                <p className="text-xs text-gray-600">Aplica a esta cotización (afecta totales y PDF)</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="editarAplicaIva"
                    checked={aplicaIVA}
                    onChange={() => setAplicaIVALocal(true)}
                  />
                  Con IVA (19%)
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="editarAplicaIva"
                    checked={!aplicaIVA}
                    onChange={() => setAplicaIVALocal(false)}
                  />
                  Sin IVA (exento)
                </label>
              </div>
            </div>
          </div>

          {/* Descripción de la modificación */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📝 Descripción de la Modificación
            </label>
            <textarea
              value={descripcionModificacion}
              onChange={(e) => setDescripcionModificacion(e.target.value)}
              placeholder="Opcional: describe por qué se está modificando esta cotización (ej: 'Se eliminó un item', 'Se ajustó el precio de mano de obra', etc.)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
            <p className="text-xs text-gray-600 mt-2">
              Si la dejas vacía, se guardará una descripción automática en el historial de modificaciones.
            </p>
          </div>

          {/* Items de la cotización */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Items de la Cotización</h3>
              <button
                onClick={() => setMostrarAgregarManual(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <span>+</span> Agregar Item Manual
              </button>
            </div>
            {cargandoItems ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando items...</p>
              </div>
            ) : (
              <CotizacionCart onGenerarPDF={undefined} cotizacionId={cotizacion.id} />
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleGuardar}
              disabled={guardando || cargandoItems || items.length === 0 || !hayModificaciones}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {guardando ? 'Guardando...' : '💾 Guardar Modificaciones'}
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

      {/* Modal para agregar item manual */}
      {mostrarAgregarManual && (
        <AgregarItemManual
          onClose={() => setMostrarAgregarManual(false)}
        />
      )}
    </div>
  );
}

