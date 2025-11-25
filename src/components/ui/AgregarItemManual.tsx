/**
 * Componente para agregar items manuales a la cotización
 * Rediseñado con sistema de pestañas y diseño compacto
 */
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { obtenerMateriales, crearMaterial } from '../../services/materiales.service';
import { useCotizacionStore } from '../../store/cotizacionStore';
import type { MaterialMueble, MedidasMueble } from '../../types/muebles';

interface AgregarItemManualProps {
  onClose: () => void;
}

// Constantes de precios
const PRECIO_HORA_MANO_OBRA = 12000; // CLP por hora
const PRECIO_DIA_TRABAJO = 64515; // CLP por día

// Crear QueryClient local para AgregarItemManual si no hay uno disponible
let localQueryClientItemManual: QueryClient | null = null;

function getOrCreateQueryClientItemManual(): QueryClient {
  if (typeof window === 'undefined') {
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000
        }
      }
    });
  }

  if (!localQueryClientItemManual) {
    localQueryClientItemManual = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000
        }
      }
    });
  }

  return localQueryClientItemManual;
}

type TabType = 'informacion' | 'materiales' | 'mano-obra' | 'costos' | 'utilidad' | 'resumen';

// Componente interno que usa React Query
function AgregarItemManualContent({ onClose }: AgregarItemManualProps) {
  const { agregarItemManual } = useCotizacionStore();
  
  // Estado de navegación
  const [tabActual, setTabActual] = useState<TabType>('informacion');
  
  // Estado del formulario básico
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [mostrarMedidas, setMostrarMedidas] = useState(false);
  const [medidas, setMedidas] = useState<MedidasMueble>({
    ancho: undefined,
    alto: undefined,
    profundidad: undefined,
    unidad: 'cm'
  });

  // Materiales
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<MaterialMueble[]>([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState<string>('');
  const [cantidadMaterial, setCantidadMaterial] = useState<string>('1');
  const [mostrarCrearMaterial, setMostrarCrearMaterial] = useState(false);
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    tipo: '',
    unidad: 'unidad',
    costo_unitario: 0,
    proveedor: ''
  });
  
  const queryClient = useQueryClient();
  
  // Mutación para crear material
  const crearMaterialMutation = useMutation({
    mutationFn: crearMaterial,
    onSuccess: (materialCreado) => {
      // Invalidar query de materiales para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['materiales'] });
      // Seleccionar el material recién creado
      setMaterialSeleccionado(materialCreado.id);
      setMostrarCrearMaterial(false);
      setNuevoMaterial({ nombre: '', tipo: '', unidad: 'unidad', costo_unitario: 0, proveedor: '' });
      alert('✅ Material creado exitosamente');
    },
    onError: (error: any) => {
      alert('❌ Error al crear material: ' + (error.message || 'Error desconocido'));
    }
  });

  // Mano de obra
  const [horasMedidas, setHorasMedidas] = useState<number>(0);
  const [horasDiseno, setHorasDiseno] = useState<number>(0);
  const [diasArmado, setDiasArmado] = useState<number>(0);
  const [diasInstalacion, setDiasInstalacion] = useState<number>(0);

  // Costos indirectos
  const [transporte, setTransporte] = useState<number>(0);
  const [herramientas, setHerramientas] = useState<number>(0);
  const [alquilerEspacio, setAlquilerEspacio] = useState<number>(0);
  const [cajaChica, setCajaChica] = useState<number>(0);
  const [comentariosCajaChica, setComentariosCajaChica] = useState<string>('');

  // Utilidad
  const [tipoUtilidad, setTipoUtilidad] = useState<'porcentaje' | 'manual'>('porcentaje');
  const [porcentajeUtilidad, setPorcentajeUtilidad] = useState<number>(25);
  const [ajusteManual, setAjusteManual] = useState<number>(0);

  // Obtener materiales
  const { data: materiales = [], isLoading: loadingMateriales, error: errorMateriales } = useQuery({
    queryKey: ['materiales'],
    queryFn: obtenerMateriales,
    retry: 2
  });

  // Orden de las pestañas
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'informacion', label: 'Información', icon: '📋' },
    { id: 'materiales', label: 'Materiales', icon: '🛒' },
    { id: 'mano-obra', label: 'Mano de Obra', icon: '🔨' },
    { id: 'costos', label: 'Costos', icon: '💰' },
    { id: 'utilidad', label: '% Utilidad', icon: '📊' },
    { id: 'resumen', label: 'Resumen', icon: '📄' }
  ];

  /**
   * Calcula los totales en tiempo real
   */
  const calculos = useMemo(() => {
    // Costo de materiales
    const costoMateriales = materialesSeleccionados.reduce((sum, mat) => {
      return sum + (mat.cantidad * (mat.precio_unitario || 0));
    }, 0);

    // Costo de mano de obra
    const costoManoObra = 
      (horasMedidas * PRECIO_HORA_MANO_OBRA) +
      (horasDiseno * PRECIO_HORA_MANO_OBRA) +
      (diasArmado * PRECIO_DIA_TRABAJO) +
      (diasInstalacion * PRECIO_DIA_TRABAJO);

    // Costos indirectos
    const costosIndirectos = 
      transporte +
      herramientas +
      alquilerEspacio +
      cajaChica;

    // Subtotal (materiales + mano de obra + costos indirectos)
    const subtotal = costoMateriales + costoManoObra + costosIndirectos;

    // Aplicar utilidad
    let utilidad = 0;
    if (tipoUtilidad === 'porcentaje') {
      utilidad = subtotal * (porcentajeUtilidad / 100);
    } else {
      utilidad = ajusteManual;
    }

    // Precio unitario final
    const precioUnitario = Math.round((subtotal + utilidad) * 100) / 100;

    // Precio total (unitario × cantidad)
    const precioTotal = precioUnitario * cantidad;

    return {
      costoMateriales,
      costoManoObra,
      costosIndirectos,
      subtotal,
      utilidad,
      precioUnitario,
      precioTotal
    };
  }, [
    materialesSeleccionados,
    horasMedidas,
    horasDiseno,
    diasArmado,
    diasInstalacion,
    transporte,
    herramientas,
    alquilerEspacio,
    cajaChica,
    tipoUtilidad,
    porcentajeUtilidad,
    ajusteManual,
    cantidad
  ]);

  /**
   * Navegación entre pestañas
   */
  const irSiguiente = () => {
    const indiceActual = tabs.findIndex(t => t.id === tabActual);
    if (indiceActual < tabs.length - 1) {
      setTabActual(tabs[indiceActual + 1].id);
    }
  };

  const irAnterior = () => {
    const indiceActual = tabs.findIndex(t => t.id === tabActual);
    if (indiceActual > 0) {
      setTabActual(tabs[indiceActual - 1].id);
    }
  };

  /**
   * Agrega un material a la lista
   */
  const agregarMaterial = () => {
    const material = materiales.find(m => m.id === materialSeleccionado);
    if (!material) return;

    const nuevoMaterial: MaterialMueble = {
      material_id: material.id,
      material_nombre: material.nombre,
      cantidad: parseFloat(cantidadMaterial) || 1,
      unidad: material.unidad,
      precio_unitario: material.costo_unitario
    };

    setMaterialesSeleccionados([...materialesSeleccionados, nuevoMaterial]);
    setMaterialSeleccionado('');
    setCantidadMaterial('1');
  };

  /**
   * Actualiza el precio unitario de un material
   */
  const actualizarPrecioMaterial = (index: number, nuevoPrecio: number) => {
    const nuevosMateriales = [...materialesSeleccionados];
    nuevosMateriales[index].precio_unitario = nuevoPrecio;
    setMaterialesSeleccionados(nuevosMateriales);
  };

  /**
   * Actualiza la cantidad de un material
   */
  const actualizarCantidadMaterial = (index: number, nuevaCantidad: number) => {
    const nuevosMateriales = [...materialesSeleccionados];
    nuevosMateriales[index].cantidad = nuevaCantidad;
    setMaterialesSeleccionados(nuevosMateriales);
  };

  /**
   * Elimina un material de la lista
   */
  const eliminarMaterial = (index: number) => {
    setMaterialesSeleccionados(materialesSeleccionados.filter((_, i) => i !== index));
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert('Por favor ingresa un nombre para el item');
      setTabActual('informacion');
      return;
    }

    if (materialesSeleccionados.length === 0) {
      alert('Debes agregar al menos un material');
      setTabActual('materiales');
      return;
    }

    // Convertir mano de obra a formato de servicios
    const servicios = [];
    if (horasMedidas > 0) {
      servicios.push({
        servicio_id: 'medidas',
        servicio_nombre: 'Toma de medidas',
        horas: horasMedidas,
        precio_por_hora: PRECIO_HORA_MANO_OBRA
      });
    }
    if (horasDiseno > 0) {
      servicios.push({
        servicio_id: 'diseno',
        servicio_nombre: 'Diseño',
        horas: horasDiseno,
        precio_por_hora: PRECIO_HORA_MANO_OBRA
      });
    }
    if (diasArmado > 0) {
      servicios.push({
        servicio_id: 'armado',
        servicio_nombre: 'Armado',
        horas: diasArmado * 8,
        precio_por_hora: PRECIO_DIA_TRABAJO / 8
      });
    }
    if (diasInstalacion > 0) {
      servicios.push({
        servicio_id: 'instalacion',
        servicio_nombre: 'Instalación',
        horas: diasInstalacion * 8,
        precio_por_hora: PRECIO_DIA_TRABAJO / 8
      });
    }

    // Convertir costos indirectos a gastos extras
    const gastosExtras = [];
    if (transporte > 0) {
      gastosExtras.push({ concepto: 'Transporte', monto: transporte });
    }
    if (herramientas > 0) {
      gastosExtras.push({ concepto: 'Herramientas (desgaste)', monto: herramientas });
    }
    if (alquilerEspacio > 0) {
      gastosExtras.push({ concepto: 'Alquiler de espacio', monto: alquilerEspacio });
    }
    if (cajaChica > 0) {
      const concepto = comentariosCajaChica 
        ? `Caja chica: ${comentariosCajaChica}`
        : 'Caja chica';
      gastosExtras.push({ concepto, monto: cajaChica });
    }

    // Calcular margen de ganancia basado en utilidad
    const subtotal = calculos.subtotal;
    const margenGanancia = subtotal > 0 ? (calculos.utilidad / subtotal) * 100 : 0;

    agregarItemManual({
      tipo: 'manual',
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      medidas: mostrarMedidas && (medidas.ancho || medidas.alto || medidas.profundidad) ? medidas : undefined,
      materiales: materialesSeleccionados,
      servicios: servicios.length > 0 ? servicios : undefined,
      gastos_extras: gastosExtras.length > 0 ? gastosExtras : undefined,
      dias_fabricacion: diasArmado || undefined,
      margen_ganancia: margenGanancia,
      cantidad
    });

    onClose();
  };

  /**
   * Renderiza el contenido de cada pestaña
   */
  const renderTabContent = () => {
    switch (tabActual) {
      case 'informacion':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre del Item *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: Closet personalizado"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descripción detallada del item..."
              />
            </div>
            {!mostrarMedidas ? (
              <button
                type="button"
                onClick={() => setMostrarMedidas(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Agregar Medidas (opcional)
              </button>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Medidas (opcional)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarMedidas(false);
                      setMedidas({ ancho: undefined, alto: undefined, profundidad: undefined, unidad: 'cm' });
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Ocultar
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ancho (cm)</label>
                    <input
                      type="number"
                      value={medidas.ancho || ''}
                      onChange={(e) => setMedidas({ ...medidas, ancho: parseFloat(e.target.value) || undefined })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ancho"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Alto (cm)</label>
                    <input
                      type="number"
                      value={medidas.alto || ''}
                      onChange={(e) => setMedidas({ ...medidas, alto: parseFloat(e.target.value) || undefined })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                      placeholder="Alto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Profundidad (cm)</label>
                    <input
                      type="number"
                      value={medidas.profundidad || ''}
                      onChange={(e) => setMedidas({ ...medidas, profundidad: parseFloat(e.target.value) || undefined })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                      placeholder="Profundidad"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'materiales':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 mb-3">
              <select
                value={materialSeleccionado}
                onChange={(e) => setMaterialSeleccionado(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loadingMateriales}
              >
                <option value="">Seleccionar material...</option>
                {materiales.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.nombre} ({mat.tipo}) - ${mat.costo_unitario.toLocaleString('es-CO')} / {mat.unidad}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={cantidadMaterial}
                onChange={(e) => setCantidadMaterial(e.target.value)}
                placeholder="Cantidad"
                min="0.01"
                step="0.01"
                className="w-24 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    agregarMaterial();
                  }
                }}
              />
              <button
                type="button"
                onClick={agregarMaterial}
                disabled={!materialSeleccionado}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar +
              </button>
              <button
                type="button"
                onClick={() => setMostrarCrearMaterial(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                title="Crear material nuevo"
              >
                + Nuevo
              </button>
            </div>

            {errorMateriales && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                ⚠️ Error al cargar materiales
              </div>
            )}

            {materialesSeleccionados.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Categoría y Material</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Unidad</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Precio</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Cantidad</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Total</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {materialesSeleccionados.map((mat, index) => {
                      const totalMaterial = mat.cantidad * (mat.precio_unitario || 0);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs">{mat.material_nombre}</td>
                          <td className="px-3 py-2 text-center text-xs">{mat.unidad}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              value={mat.precio_unitario || 0}
                              onChange={(e) => actualizarPrecioMaterial(index, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-xs border border-gray-300 rounded text-center focus:ring-1 focus:ring-indigo-500"
                              min="0"
                              step="100"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              value={mat.cantidad}
                              onChange={(e) => actualizarCantidadMaterial(index, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded text-center focus:ring-1 focus:ring-indigo-500"
                              min="0.01"
                              step="0.01"
                            />
                          </td>
                          <td className="px-3 py-2 text-center text-xs font-medium">
                            ${totalMaterial.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => eliminarMaterial(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right text-xs font-medium text-gray-700">
                        Subtotal Materiales:
                      </td>
                      <td colSpan={2} className="px-3 py-2 text-center text-sm font-bold text-gray-900">
                        ${calculos.costoMateriales.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay materiales agregados. Selecciona y agrega materiales desde arriba.
              </div>
            )}
          </div>
        );

      case 'mano-obra':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tiempos de Trabajo</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Toma de medidas (horas)</label>
                  <input
                    type="number"
                    value={horasMedidas}
                    onChange={(e) => setHorasMedidas(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Diseño (horas)</label>
                  <input
                    type="number"
                    value={horasDiseno}
                    onChange={(e) => setHorasDiseno(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Armado (días)</label>
                  <input
                    type="number"
                    value={diasArmado}
                    onChange={(e) => setDiasArmado(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Instalación (días)</label>
                  <input
                    type="number"
                    value={diasInstalacion}
                    onChange={(e) => setDiasInstalacion(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Costos por Tiempo</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Costo por hora</label>
                  <input
                    type="number"
                    value={PRECIO_HORA_MANO_OBRA}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Costo por día</label>
                  <input
                    type="number"
                    value={PRECIO_DIA_TRABAJO}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Costo por horas:</span>
                    <span className="font-medium">
                      ${((horasMedidas + horasDiseno) * PRECIO_HORA_MANO_OBRA).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Costo por días:</span>
                    <span className="font-medium">
                      ${((diasArmado + diasInstalacion) * PRECIO_DIA_TRABAJO).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-300">
                    <span>Total Mano de Obra:</span>
                    <span>${calculos.costoManoObra.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'costos':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Gastos Adicionales</h3>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={transporte > 0}
                      onChange={(e) => setTransporte(e.target.checked ? (transporte || 0) : 0)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-700">Transporte</span>
                  </label>
                  <input
                    type="number"
                    value={transporte}
                    onChange={(e) => setTransporte(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mt-1"
                    placeholder="$ 0"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={herramientas > 0}
                      onChange={(e) => setHerramientas(e.target.checked ? (herramientas || 0) : 0)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-700">Herramientas (desgaste)</span>
                  </label>
                  <input
                    type="number"
                    value={herramientas}
                    onChange={(e) => setHerramientas(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mt-1"
                    placeholder="$ 0"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={alquilerEspacio > 0}
                      onChange={(e) => setAlquilerEspacio(e.target.checked ? (alquilerEspacio || 0) : 0)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-700">Alquiler de espacio</span>
                  </label>
                  <input
                    type="number"
                    value={alquilerEspacio}
                    onChange={(e) => setAlquilerEspacio(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mt-1"
                    placeholder="$ 0"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={cajaChica > 0}
                      onChange={(e) => setCajaChica(e.target.checked ? (cajaChica || 0) : 0)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-700">Caja chica</span>
                  </label>
                  <input
                    type="number"
                    value={cajaChica}
                    onChange={(e) => setCajaChica(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mt-1"
                    placeholder="$ 0"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs text-gray-700 mb-1">Otros Comentarios</label>
                  <textarea
                    value={comentariosCajaChica}
                    onChange={(e) => setComentariosCajaChica(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Comentarios adicionales..."
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Materiales:</span>
                  <span className="font-medium">${calculos.costoMateriales.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mano de obra:</span>
                  <span className="font-medium">${calculos.costoManoObra.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Gastos totales:</span>
                  <span className="font-medium">${(calculos.costoMateriales + calculos.costoManoObra).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Gastos seleccionados:</span>
                    <span className="font-medium">${calculos.costosIndirectos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span>Total Costos Indirectos:</span>
                    <span>${calculos.costosIndirectos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'utilidad':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Ajuste de Utilidad</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Tipo de utilidad</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="porcentaje"
                        checked={tipoUtilidad === 'porcentaje'}
                        onChange={(e) => setTipoUtilidad(e.target.value as 'porcentaje' | 'manual')}
                        className="mr-2"
                      />
                      <span className="text-sm">Porcentaje</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="manual"
                        checked={tipoUtilidad === 'manual'}
                        onChange={(e) => setTipoUtilidad(e.target.value as 'porcentaje' | 'manual')}
                        className="mr-2"
                      />
                      <span className="text-sm">Ajuste manual</span>
                    </label>
                  </div>
                </div>
                {tipoUtilidad === 'porcentaje' ? (
                  <>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Margen de utilidad:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={porcentajeUtilidad}
                          onChange={(e) => setPorcentajeUtilidad(parseFloat(e.target.value) || 0)}
                          min="0"
                          step="1"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Utilidad rápida:</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPorcentajeUtilidad(25)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
                            porcentajeUtilidad === 25
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Utilidad 25%
                        </button>
                        <button
                          type="button"
                          onClick={() => setPorcentajeUtilidad(50)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
                            porcentajeUtilidad === 50
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Utilidad 50%
                        </button>
                        <button
                          type="button"
                          onClick={() => setPorcentajeUtilidad(100)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
                            porcentajeUtilidad === 100
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Utilidad 100%
                        </button>
                        <button
                          type="button"
                          onClick={() => setPorcentajeUtilidad(150)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
                            porcentajeUtilidad === 150
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Utilidad 150%
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ajuste manual del precio final</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">$</span>
                      <input
                        type="number"
                        value={ajusteManual}
                        onChange={(e) => setAjusteManual(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1000"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ajuste positivo o negativo al precio final calculado
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Resumen de Costos</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Materiales:</span>
                  <span className="font-medium">${calculos.costoMateriales.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mano de obra:</span>
                  <span className="font-medium">${calculos.costoManoObra.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Costos indirectos:</span>
                  <span className="font-medium">${calculos.costosIndirectos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-medium">
                  <span>Costo Total:</span>
                  <span>${calculos.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Utilidad ({tipoUtilidad === 'porcentaje' ? `${porcentajeUtilidad}%` : 'Manual'}):
                  </span>
                  <span className="font-medium text-green-600">
                    ${calculos.utilidad.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ajuste manual:</span>
                  <span className="font-medium">${tipoUtilidad === 'manual' ? ajusteManual.toLocaleString('es-CO', { minimumFractionDigits: 0 }) : '-'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-indigo-300 font-bold text-base bg-indigo-50 px-2 py-1 rounded">
                  <span>PRECIO FINAL</span>
                  <span>${calculos.precioUnitario.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'resumen':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Información del Item</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="ml-2 font-medium">{nombre || 'No especificado'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Cantidad:</span>
                  <span className="ml-2 font-medium">{cantidad}</span>
                </div>
                {descripcion && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Descripción:</span>
                    <p className="mt-1 text-gray-900">{descripcion}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Resumen Financiero</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Costo Materiales:</span>
                  <span className="font-medium">${calculos.costoMateriales.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Costo Mano de Obra:</span>
                  <span className="font-medium">${calculos.costoManoObra.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Costos Indirectos:</span>
                  <span className="font-medium">${calculos.costosIndirectos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-medium">
                  <span>Subtotal:</span>
                  <span>${calculos.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Utilidad ({tipoUtilidad === 'porcentaje' ? `${porcentajeUtilidad}%` : 'Manual'}):
                  </span>
                  <span className="font-medium text-green-600">
                    +${calculos.utilidad.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-indigo-300 font-bold text-base">
                  <span>Precio Unitario:</span>
                  <span>${calculos.precioUnitario.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-indigo-400 font-bold text-lg bg-indigo-50 px-3 py-2 rounded">
                  <span>Total ({cantidad} unidades):</span>
                  <span>${calculos.precioTotal.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Agregar Item Manual</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabActual(tab.id)}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </form>

        {/* Modal para crear material nuevo - Fuera del formulario para evitar conflictos */}
        {mostrarCrearMaterial && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setMostrarCrearMaterial(false);
                setNuevoMaterial({ nombre: '', tipo: '', unidad: 'unidad', costo_unitario: 0, proveedor: '' });
              }
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Crear Material Nuevo</h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMostrarCrearMaterial(false);
                    setNuevoMaterial({ nombre: '', tipo: '', unidad: 'unidad', costo_unitario: 0, proveedor: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Material *
                  </label>
                  <input
                    type="text"
                    value={nuevoMaterial.nombre}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: MDF 18mm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <input
                    type="text"
                    value={nuevoMaterial.tipo}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, tipo: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: madera, MDF, hierro, insumos"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad *
                    </label>
                    <select
                      value={nuevoMaterial.unidad}
                      onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, unidad: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="unidad">Unidad</option>
                      <option value="m²">m²</option>
                      <option value="metro lineal">Metro Lineal</option>
                      <option value="kg">kg</option>
                      <option value="litro">Litro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Unitario *
                    </label>
                    <input
                      type="number"
                      value={nuevoMaterial.costo_unitario || ''}
                      onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, costo_unitario: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                      min="0"
                      step="100"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor (opcional)
                  </label>
                  <input
                    type="text"
                    value={nuevoMaterial.proveedor}
                    onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, proveedor: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nombre del proveedor"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!nuevoMaterial.nombre || !nuevoMaterial.tipo || nuevoMaterial.costo_unitario <= 0) {
                        alert('Por favor completa todos los campos requeridos');
                        return;
                      }
                      crearMaterialMutation.mutate(nuevoMaterial);
                    }}
                    disabled={crearMaterialMutation.isPending}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {crearMaterialMutation.isPending ? 'Creando...' : 'Crear Material'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMostrarCrearMaterial(false);
                      setNuevoMaterial({ nombre: '', tipo: '', unidad: 'unidad', costo_unitario: 0, proveedor: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer con navegación */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
          <button
            type="button"
            onClick={irAnterior}
            disabled={tabActual === 'informacion'}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                useCotizacionStore.getState().limpiarCotizacion();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpiar cotización
            </button>
            {tabActual === 'resumen' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🟢 Click en Agregar a Cotización');
                  handleSubmit(e as any);
                }}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                Agregar a Cotización
              </button>
            ) : (
              <button
                type="button"
                onClick={irSiguiente}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente wrapper que proporciona QueryClient si es necesario
export default function AgregarItemManual({ onClose }: AgregarItemManualProps) {
  const [queryClient] = useState(() => getOrCreateQueryClientItemManual());
  
  useEffect(() => {
    console.log('🟢 AgregarItemManual wrapper montado');
  }, []);

  // Verificar que estamos en el cliente
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AgregarItemManualContent onClose={onClose} />
    </QueryClientProvider>
  );
}
