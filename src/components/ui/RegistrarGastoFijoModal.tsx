/**
 * Modal/Componente para registrar un nuevo gasto fijo
 */
import { useState, useEffect } from 'react';
import { crearGastoFijo, actualizarGastoFijo } from '../../services/fixed-expenses.service';
import { obtenerCategoriasGastosFijos, crearCategoriaGastoFijo } from '../../services/fixed-expense-categories.service';
import type { FixedExpense, FixedExpenseCategory } from '../../types/database';

interface RegistrarGastoFijoModalProps {
  gastoEditar?: FixedExpense | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RegistrarGastoFijoModal({ 
  gastoEditar, 
  onSuccess, 
  onCancel 
}: RegistrarGastoFijoModalProps) {
  const [categorias, setCategorias] = useState<FixedExpenseCategory[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [mostrarCrearCategoria, setMostrarCrearCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ name: '', description: '' });
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    amount: 0,
    provider: '',
    payment_method: '' as 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro' | '',
    date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarCategorias();
    
    // Si estamos editando, prellenar el formulario
    if (gastoEditar) {
      setFormData({
        category_id: gastoEditar.category_id || '',
        description: gastoEditar.description,
        amount: gastoEditar.amount,
        provider: gastoEditar.provider || '',
        payment_method: gastoEditar.payment_method || '',
        date: gastoEditar.date
      });
    }
  }, [gastoEditar]);

  const cargarCategorias = async () => {
    try {
      setCargandoCategorias(true);
      const categoriasData = await obtenerCategoriasGastosFijos();
      setCategorias(categoriasData);
    } catch (error: any) {
      console.error('Error al cargar categorías:', error);
      alert('Error al cargar categorías');
    } finally {
      setCargandoCategorias(false);
    }
  };

  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.name.trim()) {
      alert('El nombre de la categoría es requerido');
      return;
    }

    try {
      setCreandoCategoria(true);
      const categoriaCreada = await crearCategoriaGastoFijo(
        nuevaCategoria.name,
        nuevaCategoria.description || undefined
      );
      await cargarCategorias();
      setFormData({ ...formData, category_id: categoriaCreada.id });
      setNuevaCategoria({ name: '', description: '' });
      setMostrarCrearCategoria(false);
      alert('✅ Categoría creada exitosamente');
    } catch (error: any) {
      console.error('Error al crear categoría:', error);
      alert('Error al crear categoría: ' + (error.message || 'Error desconocido'));
    } finally {
      setCreandoCategoria(false);
    }
  };

  const handleGuardar = async () => {
    if (!formData.description.trim()) {
      setError('La descripción es requerida');
      return;
    }

    if (formData.amount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!formData.date) {
      setError('La fecha es requerida');
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      if (gastoEditar) {
        await actualizarGastoFijo(gastoEditar.id, {
          category_id: formData.category_id || undefined,
          description: formData.description,
          amount: formData.amount,
          provider: formData.provider || undefined,
          payment_method: formData.payment_method || undefined,
          date: formData.date
        });
      } else {
        await crearGastoFijo({
          category_id: formData.category_id || undefined,
          description: formData.description,
          amount: formData.amount,
          provider: formData.provider || undefined,
          payment_method: formData.payment_method || undefined,
          date: formData.date
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      setError(error.message || 'Error al guardar el gasto fijo');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {gastoEditar ? 'Editar' : 'Registrar'} Gasto Fijo
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Categoría */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <button
              type="button"
              onClick={() => setMostrarCrearCategoria(!mostrarCrearCategoria)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              + Agregar categoría
            </button>
          </div>
          
          {mostrarCrearCategoria && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Nueva Categoría</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={nuevaCategoria.name}
                    onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="Ej: Alquiler"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={nuevaCategoria.description}
                    onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="Descripción opcional"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCrearCategoria}
                    disabled={creandoCategoria || !nuevaCategoria.name.trim()}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {creandoCategoria ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarCrearCategoria(false);
                      setNuevaCategoria({ name: '', description: '' });
                    }}
                    className="px-3 py-1 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled={cargandoCategorias}
          >
            <option value="">Seleccionar categoría (opcional)</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Ej: Alquiler local principal"
            required
          />
        </div>

        {/* Monto y Fecha */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="0"
              step="100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        {/* Proveedor y Método de Pago */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ej: Empresa XYZ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar (opcional)</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="cheque">Cheque</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleGuardar}
          disabled={guardando || !formData.description.trim() || formData.amount <= 0}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}


