/**
 * Tab para mostrar utilidades e IVA (presupuestado vs real)
 */
import { useState, useEffect } from 'react';
import { obtenerFacturasPorCotizacion } from '../../services/facturas.service';
import { obtenerComparacionPresupuestoReal } from '../../services/rentabilidad.service';
import type { Factura } from '../../types/database';
import type { ComparacionPresupuestoReal } from '../../services/rentabilidad.service';

interface UtilidadesTabProps {
  cotizacionId: string;
  cotizacion: any;
  onUpdate: () => void;
}

export default function UtilidadesTab({ cotizacionId, cotizacion, onUpdate }: UtilidadesTabProps) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [comparacion, setComparacion] = useState<ComparacionPresupuestoReal | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [cotizacionId]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [facturasData, comparacionData] = await Promise.all([
        obtenerFacturasPorCotizacion(cotizacionId),
        obtenerComparacionPresupuestoReal(cotizacionId).catch(() => null)
      ]);
      setFacturas(facturasData);
      setComparacion(comparacionData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  // Calcular IVA real desde facturas
  // El total de la factura incluye IVA, así que necesitamos extraerlo
  // Asumimos que el IVA es 19% (estándar en Colombia)
  const IVA_PORCENTAJE = 19;
  
  const calcularIVADesdeFactura = (totalFactura: number): number => {
    // Si el total incluye IVA: IVA = total / (1 + IVA_PORCENTAJE/100) * (IVA_PORCENTAJE/100)
    // O más simple: IVA = total * (IVA_PORCENTAJE / (100 + IVA_PORCENTAJE))
    return totalFactura * (IVA_PORCENTAJE / (100 + IVA_PORCENTAJE));
  };

  const totalFacturas = facturas.reduce((sum, f) => sum + f.total, 0);
  const ivaReal = facturas.reduce((sum, f) => sum + calcularIVADesdeFactura(f.total), 0);

  // Calcular IVA presupuestado
  const descuento = cotizacion?.descuento || 0;
  const subtotal = cotizacion?.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0
    ? cotizacion.items.reduce((sum: number, item: any) => sum + (item.precio_total || 0), 0)
    : (cotizacion?.subtotal || 0);
  const descuentoMonto = subtotal * (descuento / 100);
  const subtotalConDescuento = subtotal - descuentoMonto;
  const ivaPorcentaje = cotizacion?.iva_porcentaje || 19;
  const ivaPresupuestado = subtotalConDescuento * (ivaPorcentaje / 100);

  // Utilidad presupuestada (desde comparación o calcular)
  const utilidadPresupuestada = comparacion?.utilidadPresupuestada || 0;

  if (cargando) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Utilidades e IVA */}
      <div className="grid grid-cols-2 gap-6">
        {/* Utilidad Presupuestada */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Utilidad Presupuestada</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${utilidadPresupuestada.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Total cotizado - Costos base - IVA presupuestado
          </p>
        </div>

        {/* IVA Presupuestado */}
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">IVA Presupuestado</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${ivaPresupuestado.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {ivaPorcentaje}% sobre subtotal con descuento
          </p>
        </div>
      </div>

      {/* IVA Real desde Facturas */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
          📄 IVA Real (desde Facturas)
        </h3>
        <div className="p-4">
          {facturas.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay facturas registradas</p>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Facturado</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {facturas.length} {facturas.length === 1 ? 'factura' : 'facturas'}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalFacturas.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">IVA Real (calculado)</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {IVA_PORCENTAJE}% extraído del total facturado
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">
                    ${ivaReal.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {/* Lista de facturas */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Detalle de Facturas</h4>
                <div className="space-y-2">
                  {facturas.map((factura) => {
                    const ivaFactura = calcularIVADesdeFactura(factura.total);
                    return (
                      <div
                        key={factura.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {factura.numero_factura}
                          </p>
                          {factura.proveedor && (
                            <p className="text-xs text-gray-500 mt-1">
                              Proveedor: {factura.proveedor}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Fecha: {new Date(factura.fecha_factura).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-600">
                            Total: <span className="font-semibold">${factura.total.toLocaleString('es-CO')}</span>
                          </p>
                          <p className="text-xs text-indigo-600 mt-1">
                            IVA: ${ivaFactura.toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparación IVA Presupuestado vs Real */}
      {facturas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
            📊 Comparación IVA
          </h3>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-gray-700 mb-1">IVA Presupuestado</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${ivaPresupuestado.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-sm font-medium text-gray-700 mb-1">IVA Real</p>
                <p className="text-2xl font-bold text-indigo-600">
                  ${ivaReal.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">Diferencia</p>
                <p className={`text-lg font-bold ${
                  ivaReal <= ivaPresupuestado ? 'text-green-600' : 'text-red-600'
                }`}>
                  {ivaReal <= ivaPresupuestado ? '-' : '+'}
                  ${Math.abs(ivaReal - ivaPresupuestado).toLocaleString('es-CO')}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ivaReal <= ivaPresupuestado 
                  ? 'El IVA real es menor o igual al presupuestado' 
                  : 'El IVA real excede al presupuestado'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nota sobre Utilidad */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>ℹ️ Nota sobre Utilidad:</strong> La utilidad presupuestada no se modifica porque ya está contemplada en la utilidad real. 
          El IVA real se resta de la utilidad real y se suma al total real gastado para reflejar el costo real del proyecto.
        </p>
      </div>
    </div>
  );
}




