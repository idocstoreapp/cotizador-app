/**
 * Página de administración de precios
 * Permite modificar precios de materiales, servicios, muebles y variantes
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../../contexts/UserContext';
import { obtenerMateriales, actualizarMaterial } from '../../services/materiales.service';
import { obtenerServicios, actualizarServicio } from '../../services/servicios.service';
import { obtenerMueblesAdmin, actualizarMuebleAdmin } from '../../services/muebles-admin.service';
import type { Material } from '../../types/database';
import type { Servicio } from '../../types/database';
import type { Mueble, OpcionPersonalizada } from '../../types/muebles';

type TabType = 'materiales' | 'servicios' | 'muebles' | 'variantes';

export default function AdminPreciosPage() {
  const { usuario, esAdmin } = useUser();
  const queryClient = useQueryClient();
  const [tabActual, setTabActual] = useState<TabType>('materiales');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valoresEditando, setValoresEditando] = useState<any>({});

  // Si no hay usuario, mostrar loading
  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no es admin, mostrar mensaje
  if (!esAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</p>
          <p className="text-gray-600">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  // Obtener datos
  const { data: materiales = [], isLoading: loadingMateriales } = useQuery({
    queryKey: ['materiales'],
    queryFn: obtenerMateriales
  });

  const { data: servicios = [], isLoading: loadingServicios } = useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios
  });

  const { data: muebles = [], isLoading: loadingMuebles } = useQuery({
    queryKey: ['muebles-admin'],
    queryFn: obtenerMueblesAdmin,
    enabled: esAdmin
  });

  // Mutaciones
  const actualizarMaterialMutation = useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: Partial<Material> }) =>
      actualizarMaterial(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] });
      setEditandoId(null);
      setValoresEditando({});
      alert('✅ Precio actualizado exitosamente');
    },
    onError: (error: any) => {
      alert('❌ Error al actualizar: ' + (error.message || 'Error desconocido'));
    }
  });

  const actualizarServicioMutation = useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: Partial<Servicio> }) =>
      actualizarServicio(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      setEditandoId(null);
      setValoresEditando({});
      alert('✅ Precio actualizado exitosamente');
    },
    onError: (error: any) => {
      alert('❌ Error al actualizar: ' + (error.message || 'Error desconocido'));
    }
  });

  const actualizarMuebleMutation = useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: any }) =>
      actualizarMuebleAdmin(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muebles-admin'] });
      setEditandoId(null);
      setValoresEditando({});
      alert('✅ Precio actualizado exitosamente');
    },
    onError: (error: any) => {
      alert('❌ Error al actualizar: ' + (error.message || 'Error desconocido'));
    }
  });

  const tabs = [
    { id: 'materiales' as TabType, label: 'Materiales', icon: '🛒' },
    { id: 'servicios' as TabType, label: 'Servicios / Horas', icon: '🔨' },
    { id: 'muebles' as TabType, label: 'Muebles del Catálogo', icon: '📦' },
    { id: 'variantes' as TabType, label: 'Variantes / Opciones', icon: '🎨' }
  ];

  const iniciarEdicion = (id: string, valores: any) => {
    setEditandoId(id);
    setValoresEditando(valores);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setValoresEditando({});
  };

  const guardarMaterial = (id: string) => {
    actualizarMaterialMutation.mutate({
      id,
      datos: {
        costo_unitario: valoresEditando.costo_unitario,
        nombre: valoresEditando.nombre
      }
    });
  };

  const guardarServicio = (id: string) => {
    actualizarServicioMutation.mutate({
      id,
      datos: {
        precio_por_hora: valoresEditando.precio_por_hora,
        nombre: valoresEditando.nombre
      }
    });
  };

  const guardarMueble = (id: string) => {
    actualizarMuebleMutation.mutate({
      id,
      datos: {
        precio_base: valoresEditando.precio_base
      }
    });
  };

  const guardarVariante = (muebleId: string, tipoVariante: string, nombreVariante: string, nuevosValores: any) => {
    const mueble = muebles.find(m => m.id === muebleId);
    if (!mueble) return;

    const opcionesDisponibles = mueble.opciones_disponibles || {};
    const opcionesPersonalizadas = opcionesDisponibles.opciones_personalizadas || {};
    const variantes = opcionesPersonalizadas[tipoVariante] || [];

    const variantesActualizadas = variantes.map((v: OpcionPersonalizada) => {
      if (v.nombre === nombreVariante) {
        return {
          ...v,
          nombre: nuevosValores.nombre || v.nombre,
          precio_adicional: nuevosValores.precio_adicional !== undefined ? nuevosValores.precio_adicional : v.precio_adicional,
          multiplicador: nuevosValores.multiplicador !== undefined ? nuevosValores.multiplicador : v.multiplicador
        };
      }
      return v;
    });

    const nuevasOpcionesPersonalizadas = {
      ...opcionesPersonalizadas,
      [tipoVariante]: variantesActualizadas
    };

    const nuevasOpcionesDisponibles = {
      ...opcionesDisponibles,
      opciones_personalizadas: nuevasOpcionesPersonalizadas
    };

    actualizarMuebleMutation.mutate({
      id: muebleId,
      datos: {
        opciones_disponibles: nuevasOpcionesDisponibles
      }
    });
  };

  const renderTabContent = () => {
    switch (tabActual) {
      case 'materiales':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unitario</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingMateriales ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Cargando materiales...
                      </td>
                    </tr>
                  ) : materiales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No hay materiales disponibles
                      </td>
                    </tr>
                  ) : (
                    materiales.map((material) => (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editandoId === material.id ? (
                            <input
                              type="text"
                              value={valoresEditando.nombre || material.nombre}
                              onChange={(e) => setValoresEditando({ ...valoresEditando, nombre: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{material.nombre}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.tipo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.unidad}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editandoId === material.id ? (
                            <input
                              type="number"
                              value={valoresEditando.costo_unitario !== undefined ? valoresEditando.costo_unitario : material.costo_unitario}
                              onChange={(e) => setValoresEditando({ ...valoresEditando, costo_unitario: parseFloat(e.target.value) || 0 })}
                              className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                              min="0"
                              step="100"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              ${material.costo_unitario.toLocaleString('es-CO')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {editandoId === material.id ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => guardarMaterial(material.id)}
                                disabled={actualizarMaterialMutation.isPending}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={cancelarEdicion}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => iniciarEdicion(material.id, { costo_unitario: material.costo_unitario, nombre: material.nombre })}
                              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                            >
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'servicios':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio por Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Estimadas</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingServicios ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Cargando servicios...
                      </td>
                    </tr>
                  ) : servicios.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No hay servicios disponibles
                      </td>
                    </tr>
                  ) : (
                    servicios.map((servicio) => (
                      <tr key={servicio.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editandoId === servicio.id ? (
                            <input
                              type="text"
                              value={valoresEditando.nombre || servicio.nombre}
                              onChange={(e) => setValoresEditando({ ...valoresEditando, nombre: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{servicio.nombre}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editandoId === servicio.id ? (
                            <input
                              type="number"
                              value={valoresEditando.precio_por_hora !== undefined ? valoresEditando.precio_por_hora : servicio.precio_por_hora}
                              onChange={(e) => setValoresEditando({ ...valoresEditando, precio_por_hora: parseFloat(e.target.value) || 0 })}
                              className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                              min="0"
                              step="1000"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              ${servicio.precio_por_hora.toLocaleString('es-CO')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{servicio.horas_estimadas}h</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {editandoId === servicio.id ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => guardarServicio(servicio.id)}
                                disabled={actualizarServicioMutation.isPending}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={cancelarEdicion}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => iniciarEdicion(servicio.id, { precio_por_hora: servicio.precio_por_hora, nombre: servicio.nombre })}
                              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                            >
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'muebles':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Base</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingMuebles ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Cargando muebles...
                      </td>
                    </tr>
                  ) : muebles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No hay muebles disponibles
                      </td>
                    </tr>
                  ) : (
                    muebles.map((mueble) => (
                      <tr key={mueble.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{mueble.nombre}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{mueble.categoria}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editandoId === mueble.id ? (
                            <input
                              type="number"
                              value={valoresEditando.precio_base !== undefined ? valoresEditando.precio_base : mueble.precio_base}
                              onChange={(e) => setValoresEditando({ ...valoresEditando, precio_base: parseFloat(e.target.value) || 0 })}
                              className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                              min="0"
                              step="1000"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              ${mueble.precio_base.toLocaleString('es-CO')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {editandoId === mueble.id ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => guardarMueble(mueble.id)}
                                disabled={actualizarMuebleMutation.isPending}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={cancelarEdicion}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => iniciarEdicion(mueble.id, { precio_base: mueble.precio_base })}
                              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                            >
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'variantes':
        return (
          <div className="space-y-6">
            {loadingMuebles ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Cargando muebles...</p>
              </div>
            ) : muebles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay muebles disponibles</p>
              </div>
            ) : (
              muebles
                .filter(mueble => {
                  const opciones = mueble.opciones_disponibles?.opciones_personalizadas;
                  return opciones && (
                    opciones.tipo_cocina?.length > 0 ||
                    opciones.material_puertas?.length > 0 ||
                    opciones.tipo_topes?.length > 0
                  );
                })
                .map((mueble) => {
                  const opcionesPersonalizadas = mueble.opciones_disponibles?.opciones_personalizadas || {};
                  const tiposVariantes = Object.keys(opcionesPersonalizadas).filter(
                    key => opcionesPersonalizadas[key]?.length > 0
                  );

                  if (tiposVariantes.length === 0) return null;

                  return (
                    <div key={mueble.id} className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">{mueble.nombre}</h3>
                      {tiposVariantes.map((tipoVariante) => {
                        const variantes = opcionesPersonalizadas[tipoVariante] || [];
                        const nombreTipo = tipoVariante === 'tipo_cocina' ? 'Tipo de Cocina' :
                                          tipoVariante === 'material_puertas' ? 'Material de Puertas' :
                                          tipoVariante === 'tipo_topes' ? 'Tipo de Topes' : tipoVariante;

                        return (
                          <div key={tipoVariante} className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">{nombreTipo}</h4>
                            <div className="space-y-2">
                              {variantes.map((variante: OpcionPersonalizada, index: number) => {
                                const editandoKey = `${mueble.id}-${tipoVariante}-${variante.nombre}`;
                                const estaEditando = editandoId === editandoKey;

                                return (
                                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      {estaEditando ? (
                                        <input
                                          type="text"
                                          value={valoresEditando.nombre || variante.nombre}
                                          onChange={(e) => setValoresEditando({ ...valoresEditando, nombre: e.target.value })}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                        />
                                      ) : (
                                        <span className="text-sm font-medium text-gray-900">{variante.nombre}</span>
                                      )}
                                    </div>
                                    <div className="w-32">
                                      {estaEditando ? (
                                        <input
                                          type="number"
                                          value={valoresEditando.precio_adicional !== undefined ? valoresEditando.precio_adicional : (variante.precio_adicional || 0)}
                                          onChange={(e) => setValoresEditando({ ...valoresEditando, precio_adicional: parseFloat(e.target.value) || 0 })}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                          placeholder="Precio adicional"
                                          min="0"
                                          step="1000"
                                        />
                                      ) : (
                                        <span className="text-sm text-gray-600">
                                          +${(variante.precio_adicional || 0).toLocaleString('es-CO')}
                                        </span>
                                      )}
                                    </div>
                                    <div className="w-24">
                                      {estaEditando ? (
                                        <input
                                          type="number"
                                          value={valoresEditando.multiplicador !== undefined ? valoresEditando.multiplicador : (variante.multiplicador || 1)}
                                          onChange={(e) => setValoresEditando({ ...valoresEditando, multiplicador: parseFloat(e.target.value) || 1 })}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                          placeholder="Multiplicador"
                                          min="0.1"
                                          step="0.1"
                                        />
                                      ) : (
                                        <span className="text-sm text-gray-600">
                                          x{variante.multiplicador || 1}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      {estaEditando ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => {
                                              guardarVariante(mueble.id, tipoVariante, variante.nombre, valoresEditando);
                                            }}
                                            disabled={actualizarMuebleMutation.isPending}
                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                          >
                                            Guardar
                                          </button>
                                          <button
                                            onClick={cancelarEdicion}
                                            className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => iniciarEdicion(editandoKey, {
                                            nombre: variante.nombre,
                                            precio_adicional: variante.precio_adicional,
                                            multiplicador: variante.multiplicador
                                          })}
                                          className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                                        >
                                          Editar
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Administración de Precios</h1>
        <p className="text-gray-600 mt-1">Modifica precios de materiales, servicios, muebles y variantes</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setTabActual(tab.id);
                setEditandoId(null);
                setValoresEditando({});
              }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tabActual === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}

