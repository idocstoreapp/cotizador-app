/**
 * Página de administración de precios
 * Permite modificar precios de materiales, servicios, muebles y variantes
 * VERSIÓN SIN REACT QUERY - Carga datos directamente
 */
import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { obtenerMateriales, actualizarMaterial, crearMaterial, eliminarMaterial } from '../../services/materiales.service';
import { obtenerServicios, actualizarServicio, crearServicio, eliminarServicio } from '../../services/servicios.service';
import { obtenerMueblesAdmin, actualizarMuebleAdmin } from '../../services/muebles-admin.service';
import type { Material } from '../../types/database';
import type { Servicio } from '../../types/database';
import type { Mueble, OpcionPersonalizada } from '../../types/muebles';

type TabType = 'materiales' | 'servicios' | 'muebles' | 'variantes' | 'configuracion';

export default function AdminPreciosPage() {
  const { usuario, esAdmin } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [tabActual, setTabActual] = useState<TabType>('materiales');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valoresEditando, setValoresEditando] = useState<any>({});
  const [mostrarModalNuevoMaterial, setMostrarModalNuevoMaterial] = useState(false);
  const [mostrarModalNuevoServicio, setMostrarModalNuevoServicio] = useState(false);
  
  // Estados para datos
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [muebles, setMuebles] = useState<Mueble[]>([]);
  const [loadingMateriales, setLoadingMateriales] = useState(true);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [loadingMuebles, setLoadingMuebles] = useState(true);
  
  // Estados para operaciones en progreso
  const [guardandoMaterial, setGuardandoMaterial] = useState(false);
  const [guardandoServicio, setGuardandoServicio] = useState(false);
  const [guardandoMueble, setGuardandoMueble] = useState(false);
  const [creandoMaterial, setCreandoMaterial] = useState(false);
  const [creandoServicio, setCreandoServicio] = useState(false);
  const [eliminandoMaterial, setEliminandoMaterial] = useState<string | null>(null);
  const [eliminandoServicio, setEliminandoServicio] = useState<string | null>(null);
  
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    tipo: '',
    unidad: 'unidad',
    costo_unitario: 0,
    proveedor: ''
  });
  const [nuevoServicio, setNuevoServicio] = useState({
    nombre: '',
    descripcion: '',
    precio_por_hora: 0,
    horas_estimadas: 0
  });
  const [configuracion, setConfiguracion] = useState({
    iva_porcentaje: 19,
    margen_ganancia_default: 30
  });

  // Cargar configuración desde localStorage al inicio
  useEffect(() => {
    const ivaGuardado = localStorage.getItem('iva_porcentaje');
    const margenGuardado = localStorage.getItem('margen_ganancia_default');
    
    if (ivaGuardado) {
      setConfiguracion(prev => ({ ...prev, iva_porcentaje: parseFloat(ivaGuardado) }));
    }
    if (margenGuardado) {
      setConfiguracion(prev => ({ ...prev, margen_ganancia_default: parseFloat(margenGuardado) }));
    }
  }, []);

  // Cargar datos cuando el usuario esté disponible y sea admin
  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario || !esAdmin) return;

      try {
        // Cargar materiales
        setLoadingMateriales(true);
        const materialesData = await obtenerMateriales();
        setMateriales(materialesData);
      } catch (err: any) {
        console.error('Error al cargar materiales:', err);
        setError('Error al cargar materiales: ' + (err.message || 'Error desconocido'));
      } finally {
        setLoadingMateriales(false);
      }

      try {
        // Cargar servicios
        setLoadingServicios(true);
        const serviciosData = await obtenerServicios();
        setServicios(serviciosData);
      } catch (err: any) {
        console.error('Error al cargar servicios:', err);
        setError('Error al cargar servicios: ' + (err.message || 'Error desconocido'));
      } finally {
        setLoadingServicios(false);
      }

      try {
        // Cargar muebles
        setLoadingMuebles(true);
        const mueblesData = await obtenerMueblesAdmin();
        setMuebles(mueblesData);
      } catch (err: any) {
        console.error('Error al cargar muebles:', err);
        setError('Error al cargar muebles: ' + (err.message || 'Error desconocido'));
      } finally {
        setLoadingMuebles(false);
      }
    };

    cargarDatos();
  }, [usuario, esAdmin]);

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

  // Si hay error, mostrarlo
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-600 mb-2">Error</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Recargar Página
          </button>
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

  // Funciones para actualizar datos
  const recargarMateriales = async () => {
    try {
      const materialesData = await obtenerMateriales();
      setMateriales(materialesData);
    } catch (err: any) {
      console.error('Error al recargar materiales:', err);
    }
  };

  const recargarServicios = async () => {
    try {
      const serviciosData = await obtenerServicios();
      setServicios(serviciosData);
    } catch (err: any) {
      console.error('Error al recargar servicios:', err);
    }
  };

  const recargarMuebles = async () => {
    try {
      const mueblesData = await obtenerMueblesAdmin();
      setMuebles(mueblesData);
    } catch (err: any) {
      console.error('Error al recargar muebles:', err);
    }
  };

  const tabs = [
    { id: 'materiales' as TabType, label: 'Materiales', icon: '🛒' },
    { id: 'servicios' as TabType, label: 'Servicios / Horas', icon: '🔨' },
    { id: 'muebles' as TabType, label: 'Muebles del Catálogo', icon: '📦' },
    { id: 'variantes' as TabType, label: 'Variantes / Opciones', icon: '🎨' },
    { id: 'configuracion' as TabType, label: 'Configuración General', icon: '⚙️' }
  ];

  const iniciarEdicion = (id: string, valores: any) => {
    setEditandoId(id);
    setValoresEditando(valores);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setValoresEditando({});
  };

  const guardarMaterial = async (id: string) => {
    try {
      setGuardandoMaterial(true);
      await actualizarMaterial(id, {
        costo_unitario: valoresEditando.costo_unitario,
        nombre: valoresEditando.nombre,
        tipo: valoresEditando.tipo,
        unidad: valoresEditando.unidad,
        proveedor: valoresEditando.proveedor
      });
      await recargarMateriales();
      setEditandoId(null);
      setValoresEditando({});
      alert('✅ Precio actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar material:', error);
      alert('❌ Error al actualizar: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardandoMaterial(false);
    }
  };

  const guardarServicio = async (id: string) => {
    try {
      setGuardandoServicio(true);
      await actualizarServicio(id, {
        precio_por_hora: valoresEditando.precio_por_hora,
        nombre: valoresEditando.nombre,
        descripcion: valoresEditando.descripcion,
        horas_estimadas: valoresEditando.horas_estimadas
      });
      await recargarServicios();
      setEditandoId(null);
      setValoresEditando({});
      alert('✅ Precio actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar servicio:', error);
      alert('❌ Error al actualizar: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardandoServicio(false);
    }
  };

  const guardarMueble = async (id: string) => {
    try {
      setGuardandoMueble(true);
      await actualizarMuebleAdmin(id, {
        precio_base: valoresEditando.precio_base
      });
      await recargarMuebles();
      setEditandoId(null);
      setValoresEditando({});
      alert('✅ Precio actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar mueble:', error);
      alert('❌ Error al actualizar: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardandoMueble(false);
    }
  };

  const guardarVariante = async (muebleId: string, tipoVariante: string, nombreVariante: string, nuevosValores: any) => {
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

    try {
      setGuardandoMueble(true);
      await actualizarMuebleAdmin(muebleId, {
        opciones_disponibles: nuevasOpcionesDisponibles
      });
      await recargarMuebles();
      setEditandoId(null);
      setValoresEditando({});
      alert('✅ Variante actualizada exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar variante:', error);
      alert('❌ Error al actualizar: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardandoMueble(false);
    }
  };

  const handleCrearMaterial = async () => {
    if (!nuevoMaterial.nombre || !nuevoMaterial.tipo) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setCreandoMaterial(true);
      await crearMaterial(nuevoMaterial);
      await recargarMateriales();
      setMostrarModalNuevoMaterial(false);
      setNuevoMaterial({ nombre: '', tipo: '', unidad: 'unidad', costo_unitario: 0, proveedor: '' });
      alert('✅ Material creado exitosamente');
    } catch (error: any) {
      console.error('Error al crear material:', error);
      alert('❌ Error al crear material: ' + (error.message || 'Error desconocido'));
    } finally {
      setCreandoMaterial(false);
    }
  };

  const handleEliminarMaterial = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el material "${nombre}"?`)) {
      return;
    }

    try {
      setEliminandoMaterial(id);
      await eliminarMaterial(id);
      await recargarMateriales();
      alert('✅ Material eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar material:', error);
      alert('❌ Error al eliminar material: ' + (error.message || 'Error desconocido'));
    } finally {
      setEliminandoMaterial(null);
    }
  };

  const handleCrearServicio = async () => {
    if (!nuevoServicio.nombre || nuevoServicio.precio_por_hora <= 0) {
      alert('Por favor completa todos los campos requeridos y asegúrate que el precio sea mayor a 0');
      return;
    }

    try {
      setCreandoServicio(true);
      await crearServicio(nuevoServicio);
      await recargarServicios();
      setMostrarModalNuevoServicio(false);
      setNuevoServicio({ nombre: '', descripcion: '', precio_por_hora: 0, horas_estimadas: 0 });
      alert('✅ Servicio creado exitosamente');
    } catch (error: any) {
      console.error('Error al crear servicio:', error);
      alert('❌ Error al crear servicio: ' + (error.message || 'Error desconocido'));
    } finally {
      setCreandoServicio(false);
    }
  };

  const handleEliminarServicio = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el servicio "${nombre}"?`)) {
      return;
    }

    try {
      setEliminandoServicio(id);
      await eliminarServicio(id);
      await recargarServicios();
      alert('✅ Servicio eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar servicio:', error);
      alert('❌ Error al eliminar servicio: ' + (error.message || 'Error desconocido'));
    } finally {
      setEliminandoServicio(null);
    }
  };

  const renderTabContent = () => {
    switch (tabActual) {
      case 'materiales':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Materiales</h2>
              <button
                onClick={() => setMostrarModalNuevoMaterial(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <span>+</span> Agregar Material
              </button>
            </div>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editandoId === material.id ? (
                            <input
                              type="text"
                              value={valoresEditando.tipo || material.tipo}
                              onChange={(e) => setValoresEditando({ ...valoresEditando, tipo: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{material.tipo}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editandoId === material.id ? (
                            <select
                              value={valoresEditando.unidad || material.unidad}
                              onChange={(e) => setValoresEditando({ ...valoresEditando, unidad: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="unidad">Unidad</option>
                              <option value="m2">m²</option>
                              <option value="m">m</option>
                              <option value="kg">kg</option>
                              <option value="litro">Litro</option>
                            </select>
                          ) : (
                            <span className="text-sm text-gray-500">{material.unidad}</span>
                          )}
                        </td>
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
                                disabled={guardandoMaterial}
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
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => iniciarEdicion(material.id, { costo_unitario: material.costo_unitario, nombre: material.nombre, tipo: material.tipo, unidad: material.unidad, proveedor: material.proveedor })}
                                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleEliminarMaterial(material.id, material.nombre)}
                                disabled={eliminandoMaterial === material.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                {eliminandoMaterial === material.id ? 'Eliminando...' : 'Eliminar'}
                              </button>
                            </div>
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Servicios / Mano de Obra</h2>
              <button
                onClick={() => setMostrarModalNuevoServicio(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <span>+</span> Agregar Servicio
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio por Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Estimadas</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingServicios ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Cargando servicios...
                      </td>
                    </tr>
                  ) : servicios.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
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
                              type="text"
                              value={valoresEditando.descripcion || servicio.descripcion}
                              onChange={(e) => setValoresEditando({ ...valoresEditando, descripcion: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{servicio.descripcion || 'N/A'}</span>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editandoId === servicio.id ? (
                            <input
                              type="number"
                              value={valoresEditando.horas_estimadas !== undefined ? valoresEditando.horas_estimadas : servicio.horas_estimadas}
                              onChange={(e) => setValoresEditando({ ...valoresEditando, horas_estimadas: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                              min="0"
                              step="0.5"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{servicio.horas_estimadas}h</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {editandoId === servicio.id ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => guardarServicio(servicio.id)}
                                disabled={guardandoServicio}
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
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => iniciarEdicion(servicio.id, { precio_por_hora: servicio.precio_por_hora, nombre: servicio.nombre, descripcion: servicio.descripcion, horas_estimadas: servicio.horas_estimadas })}
                                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleEliminarServicio(servicio.id, servicio.nombre)}
                                disabled={eliminandoServicio === servicio.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                {eliminandoServicio === servicio.id ? 'Eliminando...' : 'Eliminar'}
                              </button>
                            </div>
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
                                disabled={guardandoMueble}
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
                    (opciones.tipo_cocina && opciones.tipo_cocina.length > 0) ||
                    (opciones.material_puertas && opciones.material_puertas.length > 0) ||
                    (opciones.tipo_topes && opciones.tipo_topes.length > 0)
                  );
                })
                .map((mueble) => {
                  const opcionesPersonalizadas = mueble.opciones_disponibles?.opciones_personalizadas || {};
                  const tiposVariantes = Object.keys(opcionesPersonalizadas).filter(
                    key => opcionesPersonalizadas[key] && (opcionesPersonalizadas[key] as any)?.length > 0
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
                                            disabled={guardandoMueble}
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

      case 'configuracion':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración General del Sistema</h2>
              
              <div className="space-y-6">
                {/* IVA */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IVA (Impuesto al Valor Agregado) - Porcentaje
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={configuracion.iva_porcentaje}
                      onChange={(e) => setConfiguracion({ ...configuracion, iva_porcentaje: parseFloat(e.target.value) || 0 })}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-gray-600">%</span>
                    <button
                      onClick={() => {
                        localStorage.setItem('iva_porcentaje', configuracion.iva_porcentaje.toString());
                        alert('✅ IVA guardado en configuración local');
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Guardar IVA
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Este valor se usará por defecto en todas las cotizaciones. Actual: {configuracion.iva_porcentaje}%
                  </p>
                </div>

                {/* Margen de Ganancia */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margen de Ganancia por Defecto - Porcentaje
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={configuracion.margen_ganancia_default}
                      onChange={(e) => setConfiguracion({ ...configuracion, margen_ganancia_default: parseFloat(e.target.value) || 0 })}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-gray-600">%</span>
                    <button
                      onClick={() => {
                        localStorage.setItem('margen_ganancia_default', configuracion.margen_ganancia_default.toString());
                        alert('✅ Margen de ganancia guardado en configuración local');
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Guardar Margen
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Este valor se usará por defecto en todas las cotizaciones. Actual: {configuracion.margen_ganancia_default}%
                  </p>
                </div>

                {/* Información */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Estos valores se guardan en el navegador (localStorage). 
                    Para una configuración permanente en la base de datos, se requiere crear una tabla de configuración.
                  </p>
                </div>
              </div>
            </div>
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

      {/* Modal para Nuevo Material */}
      {mostrarModalNuevoMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Material</h2>
              <button
                onClick={() => {
                  setMostrarModalNuevoMaterial(false);
                  setNuevoMaterial({ nombre: '', tipo: '', unidad: 'unidad', costo_unitario: 0, proveedor: '' });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nuevoMaterial.nombre}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <input
                  type="text"
                  value={nuevoMaterial.tipo}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                <select
                  value={nuevoMaterial.unidad}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, unidad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="unidad">Unidad</option>
                  <option value="m2">m²</option>
                  <option value="m">m</option>
                  <option value="kg">kg</option>
                  <option value="litro">Litro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario *</label>
                <input
                  type="number"
                  value={nuevoMaterial.costo_unitario}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, costo_unitario: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  value={nuevoMaterial.proveedor}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, proveedor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCrearMaterial}
                  disabled={creandoMaterial}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {creandoMaterial ? 'Creando...' : 'Crear Material'}
                </button>
                <button
                  onClick={() => {
                    setMostrarModalNuevoMaterial(false);
                    setNuevoMaterial({ nombre: '', tipo: '', unidad: 'unidad', costo_unitario: 0, proveedor: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nuevo Servicio */}
      {mostrarModalNuevoServicio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Servicio</h2>
              <button
                onClick={() => {
                  setMostrarModalNuevoServicio(false);
                  setNuevoServicio({ nombre: '', descripcion: '', precio_por_hora: 0, horas_estimadas: 0 });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nuevoServicio.nombre}
                  onChange={(e) => setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={nuevoServicio.descripcion}
                  onChange={(e) => setNuevoServicio({ ...nuevoServicio, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Hora *</label>
                <input
                  type="number"
                  value={nuevoServicio.precio_por_hora}
                  onChange={(e) => setNuevoServicio({ ...nuevoServicio, precio_por_hora: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas Estimadas *</label>
                <input
                  type="number"
                  value={nuevoServicio.horas_estimadas}
                  onChange={(e) => setNuevoServicio({ ...nuevoServicio, horas_estimadas: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCrearServicio}
                  disabled={creandoServicio}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {creandoServicio ? 'Creando...' : 'Crear Servicio'}
                </button>
                <button
                  onClick={() => {
                    setMostrarModalNuevoServicio(false);
                    setNuevoServicio({ nombre: '', descripcion: '', precio_por_hora: 0, horas_estimadas: 0 });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
