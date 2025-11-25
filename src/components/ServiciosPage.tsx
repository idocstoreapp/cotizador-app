/**
 * Página de gestión de servicios
 * CRUD completo de servicios/mano de obra
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerServicios, crearServicio, actualizarServicio, eliminarServicio } from '../services/servicios.service';
import ServicioForm from './ServicioForm';
import type { Servicio } from '../types/database';
import type { ServicioInput } from '../schemas/validations';

export default function ServiciosPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [servicioEditando, setServicioEditando] = useState<Servicio | null>(null);
  const queryClient = useQueryClient();

  // Obtener servicios
  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios
  });

  // Mutación para crear servicio
  const crearMutation = useMutation({
    mutationFn: crearServicio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      setMostrarFormulario(false);
    }
  });

  // Mutación para actualizar servicio
  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => actualizarServicio(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      setServicioEditando(null);
      setMostrarFormulario(false);
    }
  });

  // Mutación para eliminar servicio
  const eliminarMutation = useMutation({
    mutationFn: eliminarServicio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
    }
  });

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (servicio: ServicioInput) => {
    if (servicioEditando) {
      await actualizarMutation.mutateAsync({ id: servicioEditando.id, data: servicio });
    } else {
      await crearMutation.mutateAsync(servicio);
    }
  };

  /**
   * Inicia la edición de un servicio
   */
  const handleEditar = (servicio: Servicio) => {
    setServicioEditando(servicio);
    setMostrarFormulario(true);
  };

  /**
   * Cancela la edición
   */
  const handleCancelar = () => {
    setServicioEditando(null);
    setMostrarFormulario(false);
  };

  /**
   * Maneja la eliminación de un servicio
   */
  const handleEliminar = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      await eliminarMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Servicios</h1>
        <button
          onClick={() => {
            setServicioEditando(null);
            setMostrarFormulario(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Nuevo Servicio
        </button>
      </div>

      {mostrarFormulario && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {servicioEditando ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <ServicioForm
            servicio={servicioEditando}
            onSubmit={handleSubmit}
            onCancel={handleCancelar}
          />
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Precio/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Horas Estimadas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {servicios.map((servicio) => (
              <tr key={servicio.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {servicio.nombre}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {servicio.descripcion || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${servicio.precio_por_hora.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {servicio.horas_estimadas}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditar(servicio)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(servicio.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


