/**
 * Componente para formulario de materiales
 * Permite crear y editar materiales
 */
import { useState, useEffect } from 'react';
import { materialSchema } from '../schemas/validations';
import type { MaterialInput } from '../schemas/validations';
import type { Material } from '../types/database';

interface MaterialFormProps {
  material?: Material | null;
  onSubmit: (material: MaterialInput) => Promise<void>;
  onCancel: () => void;
}

export default function MaterialForm({ material, onSubmit, onCancel }: MaterialFormProps) {
  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [unidad, setUnidad] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tipos de material predefinidos
  const tiposMaterial = [
    'madera',
    'MDF',
    'hierro',
    'insumos',
    'pintura',
    'herrajes',
    'vidrio',
    'otros'
  ];

  // Unidades predefinidas
  const unidades = ['m²', 'metro lineal', 'unidad', 'kg', 'litro'];

  /**
   * Carga los datos del material si se está editando
   */
  useEffect(() => {
    if (material) {
      setNombre(material.nombre);
      setTipo(material.tipo);
      setUnidad(material.unidad);
      setCostoUnitario(material.costo_unitario.toString());
      setProveedor(material.proveedor || '');
    }
  }, [material]);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validar datos con Zod
      const datos: MaterialInput = materialSchema.parse({
        nombre,
        tipo,
        unidad,
        costo_unitario: parseFloat(costoUnitario),
        proveedor: proveedor || undefined
      });

      // Enviar al componente padre
      await onSubmit(datos);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
          Nombre *
        </label>
        <input
          id="nombre"
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo *
        </label>
        <select
          id="tipo"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Seleccionar tipo</option>
          {tiposMaterial.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="unidad" className="block text-sm font-medium text-gray-700">
          Unidad *
        </label>
        <select
          id="unidad"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
        >
          <option value="">Seleccionar unidad</option>
          {unidades.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="costoUnitario" className="block text-sm font-medium text-gray-700">
          Costo Unitario *
        </label>
        <input
          id="costoUnitario"
          type="number"
          step="0.01"
          min="0"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={costoUnitario}
          onChange={(e) => setCostoUnitario(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700">
          Proveedor
        </label>
        <input
          id="proveedor"
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : material ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}


