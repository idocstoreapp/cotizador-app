/**
 * Cotizador público - Muestra resumen y opciones de envío
 */
import type { Mueble, OpcionesMueble } from '../../types/muebles';
import EnviarCotizacion from './EnviarCotizacion';

interface CotizadorPublicoProps {
  mueble: Mueble;
  opciones: OpcionesMueble;
  cantidad: number;
  precioFinal: number;
  onBack: () => void;
}

export default function CotizadorPublico({
  mueble,
  opciones,
  cantidad,
  precioFinal,
  onBack
}: CotizadorPublicoProps) {
  // Calcular totales
  const precioTotal = precioFinal * cantidad;
  const ivaMonto = precioTotal * 0.19;
  const totalConIva = precioTotal + ivaMonto;

  // Crear item de cotización para mostrar
  const itemCotizacion = {
    id: `publico-${mueble.id}-${Date.now()}`,
    tipo: 'catalogo' as const,
    mueble_id: mueble.id,
    mueble,
    opciones,
    cantidad,
    precio_unitario: precioFinal,
    precio_total: precioTotal
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
        >
          ← Volver a Personalizar
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen de tu Cotización</h2>
          
          {/* Detalle del producto */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex gap-4">
              <img
                src={mueble.imagen}
                alt={mueble.nombre}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{mueble.nombre}</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {opciones.material_puertas && (
                    <p><span className="font-medium">Material de Puertas:</span> {opciones.material_puertas}</p>
                  )}
                  {opciones.tipo_topes && (
                    <p><span className="font-medium">Tipo de Topes:</span> {opciones.tipo_topes}</p>
                  )}
                  {opciones.color && (
                    <p><span className="font-medium">Color:</span> {opciones.color}</p>
                  )}
                  {opciones.material && (
                    <p><span className="font-medium">Material:</span> {opciones.material}</p>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">Cantidad: {cantidad}</p>
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Precio Unitario:</span>
              <span className="font-medium">${precioFinal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({cantidad} unidad{cantidad > 1 ? 'es' : ''}):</span>
              <span className="font-medium">${precioTotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA (19%):</span>
              <span className="font-medium">${ivaMonto.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total:</span>
              <span className="text-indigo-600">${totalConIva.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        {/* Componente de envío */}
        <EnviarCotizacion
          mueble={mueble}
          opciones={opciones}
          cantidad={cantidad}
          precioFinal={precioFinal}
          precioTotal={precioTotal}
          ivaMonto={ivaMonto}
          totalConIva={totalConIva}
        />
      </div>
    </div>
  );
}

