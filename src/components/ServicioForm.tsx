/**
 * Componente para formulario de servicios
 * Permite crear y editar servicios/mano de obra
 */
import { useState, useEffect } from 'react';
import { servicioSchema } from '../schemas/validations';
import type { ServicioInput } from '../schemas/validations';
import type { Servicio } from '../types/database';

interface ServicioFormProps {
  servicio?: Servicio | null;
  onSubmit: (servicio: ServicioInput) => Promise<void>;
  onCancel: () => void;
}

export default function ServicioForm({ servicio, onSubmit, onCancel }: ServicioFormProps) {
  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioPorHora, setPrecioPorHora] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Carga los datos del servicio si se está editando
   */
  useEffect(() => {
    if (servicio) {
      setNombre(servicio.nombre);
      setDescripcion(servicio.descripcion || '');
      setPrecioPorHora(servicio.precio_por_hora.toString());
      setHorasEstimadas(servicio.horas_estimadas.toString());
    }
  }, [servicio]);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validar datos con Zod
      const datos: ServicioInput = servicioSchema.parse({
        nombre,
        descripcion: descripcion || undefined,
        precio_por_hora: parseFloat(precioPorHora),
        horas_estimadas: parseFloat(horasEstimadas)
      });

      // Enviar al componente padre
      await onSubmit(datos);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el servicio');
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
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="precioPorHora" className="block text-sm font-medium text-gray-700">
          Precio por Hora *
        </label>
        <input
          id="precioPorHora"
          type="number"
          step="0.01"
          min="0"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={precioPorHora}
          onChange={(e) => setPrecioPorHora(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="horasEstimadas" className="block text-sm font-medium text-gray-700">
          Horas Estimadas *
        </label>
        <input
          id="horasEstimadas"
          type="number"
          step="0.5"
          min="0"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={horasEstimadas}
          onChange={(e) => setHorasEstimadas(e.target.value)}
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
          {loading ? 'Guardando...' : servicio ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}


