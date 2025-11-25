/**
 * Página de gestión de materiales
 * CRUD completo de materiales
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerMateriales, crearMaterial, actualizarMaterial, eliminarMaterial } from '../services/materiales.service';
import MaterialForm from './MaterialForm';
import type { Material } from '../types/database';
import type { MaterialInput } from '../schemas/validations';

export default function MaterialesPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<Material | null>(null);
  const queryClient = useQueryClient();

  // Obtener materiales
  const { data: materiales = [], isLoading } = useQuery({
    queryKey: ['materiales'],
    queryFn: obtenerMateriales
  });

  // Mutación para crear material
  const crearMutation = useMutation({
    mutationFn: crearMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] });
      setMostrarFormulario(false);
    }
  });

  // Mutación para actualizar material
  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => actualizarMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] });
      setMaterialEditando(null);
      setMostrarFormulario(false);
    }
  });

  // Mutación para eliminar material
  const eliminarMutation = useMutation({
    mutationFn: eliminarMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] });
    }
  });

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (material: MaterialInput) => {
    if (materialEditando) {
      await actualizarMutation.mutateAsync({ id: materialEditando.id, data: material });
    } else {
      await crearMutation.mutateAsync(material);
    }
  };

  /**
   * Inicia la edición de un material
   */
  const handleEditar = (material: Material) => {
    setMaterialEditando(material);
    setMostrarFormulario(true);
  };

  /**
   * Cancela la edición
   */
  const handleCancelar = () => {
    setMaterialEditando(null);
    setMostrarFormulario(false);
  };

  /**
   * Maneja la eliminación de un material
   */
  const handleEliminar = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este material?')) {
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
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Materiales</h1>
        <button
          onClick={() => {
            setMaterialEditando(null);
            setMostrarFormulario(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Nuevo Material
        </button>
      </div>

      {mostrarFormulario && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {materialEditando ? 'Editar Material' : 'Nuevo Material'}
          </h2>
          <MaterialForm
            material={materialEditando}
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
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Unidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Costo Unitario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materiales.map((material) => (
              <tr key={material.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {material.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {material.tipo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {material.unidad}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${material.costo_unitario.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {material.proveedor || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditar(material)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(material.id)}
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


