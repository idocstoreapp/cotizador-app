/**
 * Tab de resumen comparativo presupuesto vs real
 */
import type { ComparacionPresupuestoReal } from '../../services/rentabilidad.service';

interface ResumenCostosTabProps {
  comparacion: ComparacionPresupuestoReal;
}

export default function ResumenCostosTab({ comparacion }: ResumenCostosTabProps) {
  // Extraer información de items cotizados
  const itemsCotizados = comparacion.cotizacion?.items || [];
  
  return (
    <div className="space-y-6">
      {/* Detalle de lo Cotizado */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
          📋 Detalle de lo Cotizado
        </h3>
        <div className="p-4">
          {itemsCotizados.length > 0 ? (
            <div className="space-y-3">
              {itemsCotizados.map((item: any, index: number) => {
                const cantidad = item.cantidad || 1;
                const precioUnitario = item.precio_unitario || (item.precio_total && cantidad ? item.precio_total / cantidad : 0);
                const precioTotal = item.precio_total || 0;
                
                // Formatear medidas si es un objeto
                let medidasTexto = '';
                if (item.medidas) {
                  if (typeof item.medidas === 'string') {
                    medidasTexto = item.medidas;
                  } else if (typeof item.medidas === 'object') {
                    const med = item.medidas;
                    const partes = [];
                    if (med.ancho) partes.push(`${med.ancho}${med.unidad || 'cm'}`);
                    if (med.alto) partes.push(`${med.alto}${med.unidad || 'cm'}`);
                    if (med.profundidad) partes.push(`${med.profundidad}${med.unidad || 'cm'}`);
                    medidasTexto = partes.length > 0 ? partes.join(' × ') : '';
                  }
                }
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.nombre || `Item ${index + 1}`}</p>
                      {medidasTexto && (
                        <p className="text-xs text-gray-500 mt-1">Medidas: {medidasTexto}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-600">
                        Cantidad: <span className="font-semibold text-gray-900">{cantidad} {cantidad === 1 ? 'unidad' : 'unidades'}</span>
                      </p>
                      {precioUnitario > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          ${precioUnitario.toLocaleString('es-CO')} c/u
                        </p>
                      )}
                      <p className="text-sm font-semibold text-blue-600 mt-1">
                        Total: ${precioTotal.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay items registrados en esta cotización.</p>
          )}
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-2 gap-6">
        {/* Total Cotizado */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Cotizado</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${comparacion.totalPresupuestado.toLocaleString('es-CO')}
          </p>
        </div>

        {/* Total Real */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Real Gastado</h3>
          <p className="text-3xl font-bold text-green-600">
            ${comparacion.totalReal.toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Diferencia y Utilidad */}
      <div className="grid grid-cols-2 gap-6">
        {/* Diferencia */}
        <div className={`p-6 rounded-lg ${comparacion.diferencia >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Diferencia de Costos</h3>
          <p className="text-xs text-gray-500 mb-1">
            Real vs Presupuestado (solo costos base)
          </p>
          <p className={`text-3xl font-bold ${comparacion.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {comparacion.diferencia >= 0 ? '+' : ''}${comparacion.diferencia.toLocaleString('es-CO')}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {comparacion.diferenciaPorcentaje >= 0 ? '+' : ''}{comparacion.diferenciaPorcentaje.toFixed(2)}%
            {comparacion.diferencia >= 0 ? ' (sobrepasaste)' : ' (ahorraste)'}
          </p>
        </div>

        {/* Utilidad Real */}
        <div className={`p-6 rounded-lg ${comparacion.utilidadReal >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Utilidad Real</h3>
          <p className={`text-3xl font-bold ${comparacion.utilidadReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${comparacion.utilidadReal.toLocaleString('es-CO')}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {comparacion.utilidadPresupuestada > 0 && (
              <>
                Presupuestada: ${comparacion.utilidadPresupuestada.toLocaleString('es-CO')}
                {' '}
                ({comparacion.diferenciaUtilidad >= 0 ? '+' : ''}${comparacion.diferenciaUtilidad.toLocaleString('es-CO')})
              </>
            )}
          </p>
        </div>
      </div>

      {/* Desglose por Categoría */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
          Desglose por Categoría
        </h3>
        <div className="divide-y divide-gray-200">
          {/* Materiales */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900">Materiales</h4>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Presupuestado</p>
                  <p className="font-medium">${comparacion.materiales.presupuestado.toLocaleString('es-CO')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Real</p>
                  <p className="font-medium">${comparacion.materiales.real.toLocaleString('es-CO')}</p>
                </div>
                <div className={`text-right ${comparacion.materiales.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <p className="text-sm">Diferencia</p>
                  <p className="font-bold">
                    {comparacion.materiales.diferencia >= 0 ? '+' : ''}${comparacion.materiales.diferencia.toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs">
                    ({comparacion.materiales.diferenciaPorcentaje >= 0 ? '+' : ''}{comparacion.materiales.diferenciaPorcentaje.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Servicios / Mano de Obra */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900">Mano de Obra</h4>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Presupuestado</p>
                  <p className="font-medium">${comparacion.servicios.presupuestado.toLocaleString('es-CO')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Real</p>
                  <p className="font-medium">${comparacion.servicios.real.toLocaleString('es-CO')}</p>
                </div>
                <div className={`text-right ${comparacion.servicios.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <p className="text-sm">Diferencia</p>
                  <p className="font-bold">
                    {comparacion.servicios.diferencia >= 0 ? '+' : ''}${comparacion.servicios.diferencia.toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs">
                    ({comparacion.servicios.diferenciaPorcentaje >= 0 ? '+' : ''}{comparacion.servicios.diferenciaPorcentaje.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gastos Hormiga */}
          {comparacion.gastosHormiga.real > 0 && (
            <div className="p-4 bg-yellow-50">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">Gastos Hormiga</h4>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Presupuestado</p>
                    <p className="font-medium">${comparacion.gastosHormiga.presupuestado.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Real</p>
                    <p className="font-medium">${comparacion.gastosHormiga.real.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="text-right text-yellow-600">
                    <p className="text-sm">Diferencia</p>
                    <p className="font-bold">
                      +${comparacion.gastosHormiga.diferencia.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transporte */}
          {comparacion.transporte.real > 0 && (
            <div className="p-4 bg-blue-50">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">Transporte</h4>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Presupuestado</p>
                    <p className="font-medium">${comparacion.transporte.presupuestado.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Real</p>
                    <p className="font-medium">${comparacion.transporte.real.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="text-right text-blue-600">
                    <p className="text-sm">Diferencia</p>
                    <p className="font-bold">
                      +${comparacion.transporte.diferencia.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Análisis Detallado de Diferencias */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
          🔍 Análisis Detallado de Diferencias
        </h3>
        <div className="p-4 space-y-6">
          {/* Materiales */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-2">📦 Materiales</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Presupuestado (desde items × cantidad):</span>
                <span className="font-medium text-blue-600">${comparacion.materiales.presupuestado.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Real (gastos registrados × cantidad item):</span>
                <span className="font-medium text-green-600">${comparacion.materiales.real.toLocaleString('es-CO')}</span>
              </div>
              <div className={`flex justify-between pt-2 border-t ${comparacion.materiales.diferencia >= 0 ? 'border-red-200' : 'border-green-200'}`}>
                <span className={`font-semibold ${comparacion.materiales.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Diferencia:
                </span>
                <span className={`font-bold ${comparacion.materiales.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {comparacion.materiales.diferencia >= 0 ? '+' : ''}${comparacion.materiales.diferencia.toLocaleString('es-CO')}
                  {' '}({comparacion.materiales.diferenciaPorcentaje >= 0 ? '+' : ''}{comparacion.materiales.diferenciaPorcentaje.toFixed(2)}%)
                </span>
              </div>
              {comparacion.materiales.diferencia !== 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>⚠️ Posibles causas de diferencia:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Precios de materiales cambiaron desde la cotización</li>
                    <li>Cantidades reales usadas difieren de las cotizadas</li>
                    <li>Materiales adicionales no presupuestados</li>
                    <li>Los gastos reales están registrados para 1 unidad y se multiplican por la cantidad del item</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Servicios / Mano de Obra */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-2">🔧 Mano de Obra</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Presupuestado (servicios desde items × cantidad):</span>
                <span className="font-medium text-blue-600">${comparacion.servicios.presupuestado.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Real (pagos registrados × cantidad item):</span>
                <span className="font-medium text-green-600">${comparacion.servicios.real.toLocaleString('es-CO')}</span>
              </div>
              <div className={`flex justify-between pt-2 border-t ${comparacion.servicios.diferencia >= 0 ? 'border-red-200' : 'border-green-200'}`}>
                <span className={`font-semibold ${comparacion.servicios.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Diferencia:
                </span>
                <span className={`font-bold ${comparacion.servicios.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {comparacion.servicios.diferencia >= 0 ? '+' : ''}${comparacion.servicios.diferencia.toLocaleString('es-CO')}
                  {' '}({comparacion.servicios.diferenciaPorcentaje >= 0 ? '+' : ''}{comparacion.servicios.diferenciaPorcentaje.toFixed(2)}%)
                </span>
              </div>
              {comparacion.servicios.diferencia !== 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>⚠️ Posibles causas de diferencia:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Horas reales trabajadas difieren de las cotizadas</li>
                    <li>Precio por hora real difiere del presupuestado</li>
                    <li>Los pagos reales están registrados para 1 unidad y se multiplican por la cantidad del item</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Gastos Hormiga */}
          {comparacion.gastosHormiga.real > 0 && (
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">🐜 Gastos Hormiga</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Presupuestado:</span>
                  <span className="font-medium text-blue-600">${comparacion.gastosHormiga.presupuestado.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Real (gastos registrados × cantidad item):</span>
                  <span className="font-medium text-green-600">${comparacion.gastosHormiga.real.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-yellow-200">
                  <span className="font-semibold text-yellow-600">Diferencia:</span>
                  <span className="font-bold text-yellow-600">
                    +${comparacion.gastosHormiga.diferencia.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>ℹ️ Nota:</strong> Los gastos hormiga no están presupuestados, por lo que toda la cantidad es diferencia adicional.
                </div>
              </div>
            </div>
          )}

          {/* Transporte */}
          {comparacion.transporte.real > 0 && (
            <div className="border-l-4 border-indigo-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">🚚 Transporte</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Presupuestado:</span>
                  <span className="font-medium text-blue-600">${comparacion.transporte.presupuestado.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Real (transportes registrados × cantidad item):</span>
                  <span className="font-medium text-green-600">${comparacion.transporte.real.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-indigo-200">
                  <span className="font-semibold text-indigo-600">Diferencia:</span>
                  <span className="font-bold text-indigo-600">
                    +${comparacion.transporte.diferencia.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-800">
                  <strong>ℹ️ Nota:</strong> El transporte puede no estar presupuestado por separado, por lo que toda la cantidad puede ser diferencia adicional.
                </div>
              </div>
            </div>
          )}

          {/* Resumen de Diferencia Total */}
          <div className="border-t-2 border-gray-300 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">📊 Resumen de Diferencia Total (Solo Costos Base)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Costo Base Presupuestado (Materiales + Servicios):</span>
                <span className="font-medium text-blue-600">
                  ${(comparacion.materiales.presupuestado + comparacion.servicios.presupuestado).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Costo Base Real (Materiales + Mano de Obra):</span>
                <span className="font-medium text-green-600">
                  ${(comparacion.materiales.real + comparacion.servicios.real).toLocaleString('es-CO')}
                </span>
              </div>
              <div className={`flex justify-between pt-2 border-t-2 ${comparacion.diferencia >= 0 ? 'border-red-300' : 'border-green-300'}`}>
                <span className={`font-bold text-lg ${comparacion.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Diferencia Total (Base):
                </span>
                <span className={`font-bold text-lg ${comparacion.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {comparacion.diferencia >= 0 ? '+' : ''}${comparacion.diferencia.toLocaleString('es-CO')}
                  {' '}({comparacion.diferenciaPorcentaje >= 0 ? '+' : ''}{comparacion.diferenciaPorcentaje.toFixed(2)}%)
                </span>
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>ℹ️ Explicación:</strong>
                <p className="mt-1">
                  Esta diferencia compara solo los <strong>costos base</strong> (materiales + servicios presupuestados vs materiales + mano de obra reales).
                  <br />
                  <strong>NO incluye:</strong> Gastos hormiga ni transporte (porque no están presupuestados).
                  <br />
                  <strong>Multiplicación:</strong> Todos los valores están multiplicados por la cantidad del item (ej: 15 unidades).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores Visuales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Eficiencia de Presupuesto</p>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className={`h-4 rounded-full ${
                comparacion.diferenciaPorcentaje <= 10 ? 'bg-green-500' :
                comparacion.diferenciaPorcentaje <= 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(Math.abs(comparacion.diferenciaPorcentaje), 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {Math.abs(comparacion.diferenciaPorcentaje).toFixed(1)}% de desviación
          </p>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Margen de Utilidad</p>
          <p className={`text-2xl font-bold ${
            comparacion.utilidadReal >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {comparacion.totalPresupuestado > 0
              ? ((comparacion.utilidadReal / comparacion.totalPresupuestado) * 100).toFixed(1)
              : '0'
            }%
          </p>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Estado del Proyecto</p>
          <p className={`text-lg font-bold ${
            comparacion.utilidadReal >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {comparacion.utilidadReal >= 0 ? '✅ Rentable' : '⚠️ Con Pérdidas'}
          </p>
        </div>
      </div>
    </div>
  );
}

