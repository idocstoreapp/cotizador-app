/**
 * Tab de resumen comparativo presupuesto vs real
 */
import type { ComparacionPresupuestoReal } from '../../services/rentabilidad.service';

interface ResumenCostosTabProps {
  comparacion: ComparacionPresupuestoReal;
}

export default function ResumenCostosTab({ comparacion }: ResumenCostosTabProps) {
  return (
    <div className="space-y-6">
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

