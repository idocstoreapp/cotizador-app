/**
 * Tab para gestionar materiales reales
 * Reutiliza el sistema existente de gastos reales de materiales
 */
import { useState, useEffect } from 'react';
import { obtenerGastosRealesPorCotizacion, eliminarGastoReal } from '../../services/gastos-reales.service';
import RegistrarGastoRealModal from './RegistrarGastoRealModal';
import type { Cotizacion, GastoRealMaterial } from '../../types/database';
import type { MaterialMueble } from '../../types/muebles';

interface MaterialesRealesTabProps {
  cotizacionId: string;
  cotizacion: Cotizacion;
  onUpdate: () => void;
}

export default function MaterialesRealesTab({ cotizacionId, cotizacion, onUpdate }: MaterialesRealesTabProps) {
  const [gastos, setGastos] = useState<GastoRealMaterial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [materialRegistrando, setMaterialRegistrando] = useState<{
    material: MaterialMueble;
    itemId: string;
  } | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [cotizacionId]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const gastosData = await obtenerGastosRealesPorCotizacion(cotizacionId);
      setGastos(gastosData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar gastos reales de materiales');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto real?')) return;

    try {
      await eliminarGastoReal(id);
      await cargarDatos();
      onUpdate();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar: ' + (error.message || 'Error desconocido'));
    }
  };

  // Extraer materiales presupuestados de los items de la cotización
  const materialesPresupuestados: Array<{
    material: MaterialMueble;
    itemId: string;
    itemNombre: string;
    costoTotal: number;
  }> = [];
  
  if (cotizacion.items && Array.isArray(cotizacion.items)) {
    cotizacion.items.forEach((item: any) => {
      if (item.materiales && Array.isArray(item.materiales)) {
        item.materiales.forEach((mat: MaterialMueble) => {
          const cantidad = mat.cantidad || 0;
          const precioUnitario = mat.precio_unitario || 0;
          const costoTotal = cantidad * precioUnitario;
          
          materialesPresupuestados.push({
            material: mat,
            itemId: item.id || item.nombre || 'item-' + Date.now(),
            itemNombre: item.nombre || 'Item sin nombre',
            costoTotal
          });
        });
      }
    });
  }

  // Agrupar materiales por nombre para sumar cantidades
  const materialesAgrupados = new Map<string, {
    material_nombre: string;
    cantidad_total: number;
    precio_unitario: number;
    unidad: string;
    costo_total: number;
    items: string[];
  }>();

  materialesPresupuestados.forEach(({ material, itemNombre, costoTotal }) => {
    const nombre = material.material_nombre || 'Material sin nombre';
    const key = nombre.toLowerCase();
    
    if (materialesAgrupados.has(key)) {
      const existente = materialesAgrupados.get(key)!;
      existente.cantidad_total += material.cantidad || 0;
      existente.costo_total += costoTotal;
      existente.items.push(itemNombre);
    } else {
      materialesAgrupados.set(key, {
        material_nombre: nombre,
        cantidad_total: material.cantidad || 0,
        precio_unitario: material.precio_unitario || 0,
        unidad: material.unidad || 'unidad',
        costo_total: costoTotal,
        items: [itemNombre]
      });
    }
  });

  const totalPresupuestado = Array.from(materialesAgrupados.values()).reduce((sum, mat) => sum + mat.costo_total, 0);
  
  // También calcular desde gastos reales registrados (para comparación)
  const totalPresupuestadoDesdeGastos = gastos.reduce((sum, g) => {
    return sum + (g.cantidad_presupuestada * g.precio_unitario_presupuestado);
  }, 0);

  const totalReal = gastos.reduce((sum, g) => {
    return sum + (g.cantidad_real * g.precio_unitario_real);
  }, 0);

  const diferencia = totalReal - totalPresupuestado;
  const diferenciaPorcentaje = totalPresupuestado > 0
    ? (diferencia / totalPresupuestado) * 100
    : 0;

  if (cargando) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Presupuestado</p>
          <p className="text-xl font-bold text-blue-600">${totalPresupuestado.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Real</p>
          <p className="text-xl font-bold text-green-600">${totalReal.toLocaleString('es-CO')}</p>
        </div>
        <div className={`p-4 rounded-lg ${diferencia >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-sm text-gray-600">Diferencia</p>
          <p className={`text-xl font-bold ${diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {diferencia >= 0 ? '+' : ''}${diferencia.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-500">{diferenciaPorcentaje.toFixed(1)}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Registros</p>
          <p className="text-xl font-bold text-purple-600">{gastos.length}</p>
        </div>
      </div>

      {/* Tabla de Materiales Presupuestados */}
      {materialesAgrupados.size > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50 border-b border-gray-200">
            📋 Materiales Presupuestados
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from(materialesAgrupados.values()).map((mat, index) => {
                  // Buscar si ya hay un gasto real registrado para este material
                  const gastoReal = gastos.find(g => 
                    g.material_nombre.toLowerCase() === mat.material_nombre.toLowerCase()
                  );
                  
                  return (
                    <tr key={index} className={gastoReal ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{mat.material_nombre}</div>
                        {gastoReal && (
                          <div className="text-xs text-green-600 mt-1">✓ Gasto real registrado</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {mat.cantidad_total} <span className="text-gray-500">{mat.unidad}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${mat.precio_unitario.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        ${mat.costo_total.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500">
                          {mat.items.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!gastoReal && materialesPresupuestados.length > 0 && (
                          <button
                            onClick={() => {
                              // Encontrar el primer material con este nombre
                              const materialEncontrado = materialesPresupuestados.find(m => 
                                (m.material.material_nombre || '').toLowerCase() === mat.material_nombre.toLowerCase()
                              );
                              if (materialEncontrado) {
                                setMaterialRegistrando({
                                  material: materialEncontrado.material,
                                  itemId: materialEncontrado.itemId
                                });
                              }
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                          >
                            Registrar Gasto
                          </button>
                        )}
                        {gastoReal && (
                          <span className="text-xs text-green-600">Registrado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla */}
      {gastos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">No hay gastos reales de materiales registrados</p>
          {materialesAgrupados.size === 0 && (
            <p className="text-sm text-gray-400">No hay materiales presupuestados en esta cotización</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gastos.map((gasto) => {
                const totalGasto = gasto.cantidad_real * gasto.precio_unitario_real;
                const totalPresupuestadoGasto = gasto.cantidad_presupuestada * gasto.precio_unitario_presupuestado;
                const diferenciaGasto = totalGasto - totalPresupuestadoGasto;

                return (
                  <tr key={gasto.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{gasto.material_nombre}</div>
                      {gasto.numero_factura && (
                        <div className="text-xs text-gray-500">Fact: {gasto.numero_factura}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="text-gray-900">{gasto.cantidad_real}</span>
                        <span className="text-gray-500"> / {gasto.cantidad_presupuestada}</span>
                        <span className="text-xs text-gray-400"> {gasto.unidad}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="text-gray-900">${gasto.precio_unitario_real.toLocaleString('es-CO')}</span>
                        <span className="text-gray-500 text-xs"> / ${gasto.precio_unitario_presupuestado.toLocaleString('es-CO')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        ${totalGasto.toLocaleString('es-CO')}
                      </div>
                      {diferenciaGasto !== 0 && (
                        <div className={`text-xs ${diferenciaGasto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {diferenciaGasto > 0 ? '+' : ''}${diferenciaGasto.toLocaleString('es-CO')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gasto.proveedor || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(gasto.fecha_compra).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEliminar(gasto.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de registrar gasto */}
      {materialRegistrando && (
        <RegistrarGastoRealModal
          material={materialRegistrando.material}
          cotizacionId={cotizacionId}
          itemId={materialRegistrando.itemId}
          onClose={() => setMaterialRegistrando(null)}
          onSuccess={() => {
            cargarDatos();
            onUpdate();
            setMaterialRegistrando(null);
          }}
        />
      )}
    </div>
  );
}

