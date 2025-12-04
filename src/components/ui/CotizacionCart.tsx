/**
 * Componente de carrito de cotización
 * Muestra los items agregados, permite editar y eliminar
 */
import { useCotizacionStore } from '../../store/cotizacionStore';
import { useState } from 'react';
import EditarItemModal from './EditarItemModal';

interface CotizacionCartProps {
  onGenerarPDF?: () => void;
  cotizacionId?: string; // ID de la cotización para registrar gastos reales
}

export default function CotizacionCart({ onGenerarPDF, cotizacionId }: CotizacionCartProps) {
  const { items, subtotal, descuento, iva, total, eliminarItem, actualizarCantidad, setDescuento, calcularTotales } = useCotizacionStore();
  const [descuentoInput, setDescuentoInput] = useState(descuento.toString());
  const [itemEditando, setItemEditando] = useState<string | null>(null);

  /**
   * Maneja el cambio de descuento
   */
  const handleDescuentoChange = (value: string) => {
    setDescuentoInput(value);
    const desc = parseFloat(value) || 0;
    if (desc >= 0 && desc <= 100) {
      setDescuento(desc);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <svg
          className="mx-auto h-24 w-24 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Tu cotización está vacía
        </h3>
        <p className="text-gray-600 mb-6">
          Agrega items desde el catálogo o crea items manuales personalizados
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/catalogo"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Ir al Catálogo
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Items de la Cotización
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {items.length}
            </span>
          </div>
        </div>
      </div>

      {/* Vista móvil - Cards */}
      <div className="lg:hidden space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.tipo === 'catalogo' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.tipo === 'catalogo' ? '📦 Catálogo' : '✏️ Manual'}
                  </span>
                </div>
                {item.tipo === 'catalogo' ? (
                  <>
                    <p className="font-semibold text-gray-900 text-sm">{item.mueble?.nombre}</p>
                    {item.opciones.color && (
                      <p className="text-xs text-gray-500 mt-1">Color: {item.opciones.color}</p>
                    )}
                    {item.opciones.material && (
                      <p className="text-xs text-gray-500">Material: {item.opciones.material}</p>
                    )}
                    {item.medidas && (
                      <p className="text-xs text-gray-500">
                        Medidas: {item.medidas.ancho}×{item.medidas.alto}×{item.medidas.profundidad} cm
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900 text-sm">{item.nombre}</p>
                    {item.descripcion && (
                      <p className="text-xs text-gray-500 mt-1">{item.descripcion}</p>
                    )}
                    {item.medidas && (
                      <p className="text-xs text-gray-500">
                        Medidas: {item.medidas.ancho}×{item.medidas.alto}×{item.medidas.profundidad} cm
                      </p>
                    )}
                    {item.materiales && item.materiales.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {item.materiales.length} material(es) • {item.dias_fabricacion || 'N/A'} días
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Cantidad:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                    className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-sm"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{item.cantidad}</span>
                  <button
                    onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Precio unitario:</span>
                <span className="text-sm font-medium text-gray-900">
                  ${item.precio_unitario.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Total:</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${item.precio_total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
              {item.tipo === 'manual' && (
                <button
                  onClick={() => setItemEditando(item.id)}
                  className="flex-1 px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                >
                  ✏️ Editar
                </button>
              )}
              <button
                onClick={() => eliminarItem(item.id)}
                className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vista desktop - Tabla */}
      <div className="hidden lg:block overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre / Descripción
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Precio Unitario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.tipo === 'catalogo' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.tipo === 'catalogo' ? '📦 Catálogo' : '✏️ Manual'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div>
                    {item.tipo === 'catalogo' ? (
                      <>
                        <p className="font-medium text-gray-900">{item.mueble?.nombre}</p>
                        <p className="text-sm text-gray-500">
                          Cantidad: {item.cantidad}
                        </p>
                        <div className="mt-1 text-xs text-gray-400">
                          {item.opciones.color && <span>Color: {item.opciones.color}</span>}
                          {item.opciones.material && <span className="ml-2">Material: {item.opciones.material}</span>}
                        </div>
                        {item.medidas && (
                          <div className="mt-1 text-xs text-gray-400">
                            Medidas: {item.medidas.ancho}×{item.medidas.alto}×{item.medidas.profundidad} cm
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-gray-900">{item.nombre}</p>
                        {item.descripcion && (
                          <p className="text-sm text-gray-500">{item.descripcion}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Cantidad: {item.cantidad}
                        </p>
                        {item.medidas && (
                          <div className="mt-1 text-xs text-gray-400">
                            Medidas: {item.medidas.ancho}×{item.medidas.alto}×{item.medidas.profundidad} cm
                          </div>
                        )}
                        {item.materiales && item.materiales.length > 0 && (
                          <div className="mt-1 text-xs text-gray-400">
                            {item.materiales.length} material(es) • {item.dias_fabricacion || 'N/A'} días
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                  ${item.precio_unitario.toLocaleString('es-CO')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                  ${item.precio_total.toLocaleString('es-CO')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // Agrupar actualización para evitar reflow
                            requestAnimationFrame(() => {
                              actualizarCantidad(item.id, item.cantidad - 1);
                            });
                          }}
                          className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-12 text-center">{item.cantidad}</span>
                        <button
                          onClick={() => {
                            // Agrupar actualización para evitar reflow
                            requestAnimationFrame(() => {
                              actualizarCantidad(item.id, item.cantidad + 1);
                            });
                          }}
                          className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
                        >
                          +
                        </button>
                    {item.tipo === 'manual' && (
                      <button
                        onClick={() => setItemEditando(item.id)}
                        className="ml-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => eliminarItem(item.id)}
                      className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
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

      {/* Resumen y totales */}
      <div className="border-t border-gray-200 pt-6">
        <div className="max-w-md ml-auto space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between items-center">
            <label className="text-gray-600">Descuento:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={descuentoInput}
                onChange={(e) => handleDescuentoChange(e.target.value)}
                onBlur={() => {
                  const desc = parseFloat(descuentoInput) || 0;
                  setDescuento(Math.max(0, Math.min(100, desc)));
                  setDescuentoInput(Math.max(0, Math.min(100, desc)).toString());
                }}
                className="w-20 text-right rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ej: 10%"
                min="0"
                max="100"
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Descuento aplicado:</span>
              <span className="font-medium">
                -${(subtotal * (descuento / 100)).toLocaleString('es-CO')}
              </span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Impuestos (IVA 19%):</span>
            <span className="font-medium">${iva.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between pt-3 border-t-2 border-gray-300">
            <span className="text-lg font-bold text-gray-900">Total Final:</span>
            <span className="text-2xl font-bold text-indigo-600">
              ${total.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* Botones de acción - Solo mostrar si onGenerarPDF está definido */}
        {onGenerarPDF && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={onGenerarPDF}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Generar Cotización PDF
            </button>
            <a
              href="/catalogo"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Seguir Agregando
            </a>
          </div>
        )}
      </div>

      {/* Modal de editar item */}
      {itemEditando && (() => {
        const item = items.find(i => i.id === itemEditando);
        if (!item) return null;
        return (
          <EditarItemModal
            item={item}
            cotizacionId={cotizacionId}
            onClose={() => {
              setItemEditando(null);
              calcularTotales();
            }}
            onSave={() => {
              calcularTotales();
            }}
          />
        );
      })()}
    </div>
  );
}


