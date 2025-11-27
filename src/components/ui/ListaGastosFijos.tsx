/**
 * Componente para listar gastos fijos con filtros avanzados
 */
import { useState, useEffect } from 'react';
import { obtenerGastosFijos, eliminarGastoFijo } from '../../services/fixed-expenses.service';
import { obtenerCategoriasGastosFijos } from '../../services/fixed-expense-categories.service';
import RegistrarGastoFijoModal from './RegistrarGastoFijoModal';
import type { FixedExpense, FixedExpenseCategory } from '../../types/database';

export default function ListaGastosFijos() {
  const [gastos, setGastos] = useState<FixedExpense[]>([]);
  const [categorias, setCategorias] = useState<FixedExpenseCategory[]>([]);
  const [cargando, setCargando] = useState(true);
  const [gastoEditar, setGastoEditar] = useState<FixedExpense | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    mes: '',
    anio: new Date().getFullYear().toString(),
    fechaDesde: '',
    fechaHasta: '',
    categoriaId: '',
    proveedor: '',
    montoMinimo: '',
    montoMaximo: ''
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    cargarGastos();
  }, [filtros]);

  const cargarCategorias = async () => {
    try {
      const categoriasData = await obtenerCategoriasGastosFijos();
      setCategorias(categoriasData);
    } catch (error: any) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const cargarGastos = async () => {
    try {
      setCargando(true);
      
      const filtrosAplicar: any = {};
      
      if (filtros.mes && filtros.anio) {
        filtrosAplicar.mes = parseInt(filtros.mes);
        filtrosAplicar.anio = parseInt(filtros.anio);
      } else {
        if (filtros.fechaDesde) filtrosAplicar.fechaDesde = filtros.fechaDesde;
        if (filtros.fechaHasta) filtrosAplicar.fechaHasta = filtros.fechaHasta;
      }
      
      if (filtros.categoriaId) filtrosAplicar.categoriaId = filtros.categoriaId;
      if (filtros.proveedor) filtrosAplicar.proveedor = filtros.proveedor;
      if (filtros.montoMinimo) filtrosAplicar.montoMinimo = parseFloat(filtros.montoMinimo);
      if (filtros.montoMaximo) filtrosAplicar.montoMaximo = parseFloat(filtros.montoMaximo);

      const gastosData = await obtenerGastosFijos(Object.keys(filtrosAplicar).length > 0 ? filtrosAplicar : undefined);
      setGastos(gastosData);
    } catch (error: any) {
      console.error('Error al cargar gastos:', error);
      // No mostrar alert si es un error de autenticación (se manejará en el componente padre)
      const esErrorAuth = error?.message?.includes('JWT') || 
                         error?.message?.includes('authentication') || 
                         error?.message?.includes('session') ||
                         error?.code === 'PGRST301';
      
      if (esErrorAuth) {
        console.log('Error de autenticación, esperando carga de usuario...');
        setCargando(false);
        return;
      }
      
      // Solo mostrar error si no es un problema de autenticación
      alert('Error al cargar gastos fijos: ' + (error.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto fijo?')) return;

    try {
      await eliminarGastoFijo(id);
      await cargarGastos();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEditar = (gasto: FixedExpense) => {
    setGastoEditar(gasto);
    setMostrarModal(true);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      mes: '',
      anio: new Date().getFullYear().toString(),
      fechaDesde: '',
      fechaHasta: '',
      categoriaId: '',
      proveedor: '',
      montoMinimo: '',
      montoMaximo: ''
    });
  };

  const total = gastos.reduce((sum, g) => sum + g.amount, 0);
  const meses = [
    { value: '', label: 'Todos' },
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  const anios = Array.from({ length: 5 }, (_, i) => {
    const anio = new Date().getFullYear() - i;
    return { value: anio.toString(), label: anio.toString() };
  });

  if (cargando && gastos.length === 0) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Total Gastos Filtrados</p>
            <p className="text-2xl font-bold text-indigo-600">${total.toLocaleString('es-CO')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Registros</p>
            <p className="text-2xl font-bold text-indigo-600">{gastos.length}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🔍 Filtros</h3>
          <button
            onClick={handleLimpiarFiltros}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mes y Año */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select
              value={filtros.mes}
              onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {meses.map((mes) => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              value={filtros.anio}
              onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {anios.map((anio) => (
                <option key={anio.value} value={anio.value}>{anio.label}</option>
              ))}
            </select>
          </div>

          {/* Rango de fechas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value, mes: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value, mes: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={filtros.categoriaId}
              onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <input
              type="text"
              value={filtros.proveedor}
              onChange={(e) => setFiltros({ ...filtros, proveedor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Buscar proveedor..."
            />
          </div>

          {/* Monto mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Mínimo</label>
            <input
              type="number"
              value={filtros.montoMinimo}
              onChange={(e) => setFiltros({ ...filtros, montoMinimo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="0"
              min="0"
              step="1000"
            />
          </div>

          {/* Monto máximo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Máximo</label>
            <input
              type="number"
              value={filtros.montoMaximo}
              onChange={(e) => setFiltros({ ...filtros, montoMaximo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Sin límite"
              min="0"
              step="1000"
            />
          </div>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setGastoEditar(null);
            setMostrarModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Agregar Gasto Fijo
        </button>
      </div>

      {/* Tabla */}
      {gastos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay gastos fijos registrados con los filtros aplicados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gastos.map((gasto) => (
                <tr key={gasto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(gasto.date).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {gasto.category ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                        {gasto.category.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Sin categoría</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{gasto.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    ${gasto.amount.toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {gasto.provider || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {gasto.payment_method ? (
                      <span className="capitalize">{gasto.payment_method}</span>
                    ) : (
                      '-'
                    )}
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

      {/* Modal de editar/crear */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <RegistrarGastoFijoModal
              gastoEditar={gastoEditar}
              onSuccess={() => {
                setMostrarModal(false);
                setGastoEditar(null);
                cargarGastos();
              }}
              onCancel={() => {
                setMostrarModal(false);
                setGastoEditar(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

