/**
 * Modal para editar un item existente en la cotización
 * Permite modificar materiales, servicios, días de trabajo, etc.
 * VERSIÓN SIN REACT QUERY - Carga datos directamente
 */
import { useState, useEffect, useMemo } from 'react';
import { useCotizacionStore } from '../../store/cotizacionStore';
import { obtenerMateriales, crearMaterial } from '../../services/materiales.service';
import { obtenerGastosRealesPorItem } from '../../services/gastos-reales.service';
import RegistrarGastoRealModal from './RegistrarGastoRealModal';
import MaterialAutocomplete from './MaterialAutocomplete';
import type { ItemCotizacion, ItemManualCotizacion, MaterialMueble, MedidasMueble } from '../../types/muebles';
import type { Material, GastoRealMaterial } from '../../types/database';

interface EditarItemModalProps {
  item: ItemCotizacion;
  cotizacionId?: string; // ID de la cotización para registrar gastos reales
  onClose: () => void;
  onSave: () => void;
}

const PRECIO_HORA_MANO_OBRA = 50000;
const PRECIO_DIA_TRABAJO = 150000;

export default function EditarItemModal({ item, cotizacionId, onClose, onSave }: EditarItemModalProps) {
  const { actualizarItemManual } = useCotizacionStore();
  const [error, setError] = useState<string | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loadingMateriales, setLoadingMateriales] = useState(true);
  const [creandoMaterial, setCreandoMaterial] = useState(false);
  const [materialRegistrandoGasto, setMaterialRegistrandoGasto] = useState<MaterialMueble | null>(null);
  const [gastosReales, setGastosReales] = useState<GastoRealMaterial[]>([]);
  const [loadingGastos, setLoadingGastos] = useState(false);
  
  // Solo permitir editar items manuales
  if (item.tipo !== 'manual') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Editar Item</h2>
          <p className="text-gray-600 mb-4">
            Los items del catálogo no se pueden editar directamente. Elimina este item y agrega uno nuevo con las opciones deseadas.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const itemManual = item as ItemManualCotizacion;

  // Cargar materiales al montar el componente
  useEffect(() => {
    const cargarMateriales = async () => {
      try {
        setLoadingMateriales(true);
        const materialesData = await obtenerMateriales();
        setMateriales(materialesData);
      } catch (err: any) {
        console.error('Error al cargar materiales:', err);
        setError('Error al cargar materiales: ' + (err.message || 'Error desconocido'));
      } finally {
        setLoadingMateriales(false);
      }
    };
    
    cargarMateriales();
  }, []);

  // Estado del formulario
  const [nombre, setNombre] = useState(itemManual.nombre || '');
  const [descripcion, setDescripcion] = useState(itemManual.descripcion || '');
  const [cantidad, setCantidad] = useState(itemManual.cantidad || 1);
  const [medidas, setMedidas] = useState<MedidasMueble>(itemManual.medidas || {
    ancho: undefined,
    alto: undefined,
    profundidad: undefined,
    unidad: 'cm'
  });

  // Materiales
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<MaterialMueble[]>(
    itemManual.materiales || []
  );
  const [materialSeleccionado, setMaterialSeleccionado] = useState<string>('');
  const [materialSeleccionadoObj, setMaterialSeleccionadoObj] = useState<Material | null>(null);
  const [busquedaMaterial, setBusquedaMaterial] = useState<string>('');
  const [cantidadMaterial, setCantidadMaterial] = useState<string>('1');
  const [mostrarCrearMaterial, setMostrarCrearMaterial] = useState(false);
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    tipo: '',
    unidad: 'unidad',
    costo_unitario: 0,
    proveedor: ''
  });

  // Mano de obra
  // Verificar si tiene monto manual
  const servicioManual = itemManual.servicios?.find(s => s.tipo_calculo === 'monto' || s.monto_manual);
  const [tipoManoObra, setTipoManoObra] = useState<'horas' | 'monto'>(
    servicioManual ? 'monto' : 'horas'
  );
  const [montoManoObraManual, setMontoManoObraManual] = useState<number>(
    servicioManual?.monto_manual || 0
  );
  const [horasMedidas, setHorasMedidas] = useState<number>(
    itemManual.servicios?.find(s => s.servicio_nombre?.includes('Medidas'))?.horas || 0
  );
  const [horasDiseno, setHorasDiseno] = useState<number>(
    itemManual.servicios?.find(s => s.servicio_nombre?.includes('Diseño'))?.horas || 0
  );
  const [montoPintura, setMontoPintura] = useState<number>(
    itemManual.servicios?.find(s => s.servicio_nombre?.includes('Pintura'))?.monto_manual || 0
  );
  const [diasArmado, setDiasArmado] = useState<number>(
    itemManual.servicios?.find(s => s.servicio_nombre?.includes('Armado'))?.horas ? 
    Math.ceil((itemManual.servicios.find(s => s.servicio_nombre?.includes('Armado'))?.horas || 0) / 8) : 0
  );
  const [diasInstalacion, setDiasInstalacion] = useState<number>(
    itemManual.servicios?.find(s => s.servicio_nombre?.includes('Instalación'))?.horas ?
    Math.ceil((itemManual.servicios.find(s => s.servicio_nombre?.includes('Instalación'))?.horas || 0) / 8) : 0
  );
  const [porcentajeManoObra, setPorcentajeManoObra] = useState<number>(
    (itemManual as any).porcentaje_mano_obra || 0
  );

  // Costos indirectos - usar any para acceder a propiedades que pueden no estar en el tipo
  const costosIndirectosItem = (itemManual as any).costos_indirectos || {};
  const [transporte, setTransporte] = useState<number>(costosIndirectosItem.transporte || 0);
  const [herramientas, setHerramientas] = useState<number>(costosIndirectosItem.herramientas || 0);
  const [alquilerEspacio, setAlquilerEspacio] = useState<number>(costosIndirectosItem.alquiler_espacio || 0);
  const [cajaChica, setCajaChica] = useState<number>(costosIndirectosItem.caja_chica || 0);
  const [comentariosCajaChica, setComentariosCajaChica] = useState<string>(costosIndirectosItem.comentarios || '');
  
  // Gastos extras puede ser número (porcentaje) o array
  const gastosExtrasItem = itemManual.gastos_extras;
  const [tipoGastoExtra, setTipoGastoExtra] = useState<'porcentaje' | 'monto'>(
    typeof gastosExtrasItem === 'number' ? 'porcentaje' : 'monto'
  );
  const [gastosExtrasPorcentaje, setGastosExtrasPorcentaje] = useState<number>(
    typeof gastosExtrasItem === 'number' ? gastosExtrasItem : 0
  );
  const [gastosExtrasMonto, setGastosExtrasMonto] = useState<number>(
    Array.isArray(gastosExtrasItem) 
      ? gastosExtrasItem.reduce((sum, g) => sum + (g.monto || 0), 0)
      : 0
  );

  // Utilidad
  const [margenGanancia, setMargenGanancia] = useState<number>(itemManual.margen_ganancia || 30);

  // Flags para indicar que no hay datos de costos aún
  const sinDatosCostosItem = (itemManual as any).sin_datos_costos || {};
  const [sinDatosCostosMateriales, setSinDatosCostosMateriales] = useState<boolean>(sinDatosCostosItem.materiales || false);
  const [sinDatosCostosManoObra, setSinDatosCostosManoObra] = useState<boolean>(sinDatosCostosItem.mano_obra || false);
  const [sinDatosCostosIndirectos, setSinDatosCostosIndirectos] = useState<boolean>(sinDatosCostosItem.costos_indirectos || false);

  // Calcular totales
  const calculos = useMemo(() => {
    const costoMateriales = materialesSeleccionados.reduce((sum, mat) => {
      return sum + (mat.cantidad * (mat.precio_unitario || 0));
    }, 0);

    // Costo de mano de obra base (sin pintura ni porcentaje)
    const costoManoObraBase = tipoManoObra === 'monto'
      ? montoManoObraManual
      : (horasMedidas * PRECIO_HORA_MANO_OBRA) +
        (horasDiseno * PRECIO_HORA_MANO_OBRA) +
        (diasArmado * PRECIO_DIA_TRABAJO) +
        (diasInstalacion * PRECIO_DIA_TRABAJO);
    
    // Pintura (monto total, se suma directamente)
    const costoPintura = montoPintura;
    
    // Costo total de mano de obra (base + pintura)
    const costoManoObraTotal = costoManoObraBase + costoPintura;
    
    // Porcentaje adicional sobre mano de obra (NO suma a utilidad, similar a gastos extras)
    const porcentajeManoObraValor = costoManoObraTotal * (porcentajeManoObra / 100);
    
    // Costo de mano de obra final (con porcentaje)
    const costoManoObra = costoManoObraTotal + porcentajeManoObraValor;

    const costosIndirectos = transporte + herramientas + alquilerEspacio + cajaChica;
    
    // Subtotal antes de gastos extras (SOLO materiales + costos indirectos)
    // IMPORTANTE: La mano de obra (base, pintura y porcentaje) NO se incluye en el cálculo de utilidad
    // La utilidad se aplica SOLO sobre materiales y costos indirectos
    const subtotalAntesExtras = costoMateriales + costosIndirectos;
    
    // Gastos extras (porcentaje o monto fijo)
    let gastosExtrasValor = 0;
    if (tipoGastoExtra === 'porcentaje') {
      gastosExtrasValor = subtotalAntesExtras * (gastosExtrasPorcentaje / 100);
    } else {
      gastosExtrasValor = gastosExtrasMonto;
    }
    
    // IMPORTANTE: La utilidad se aplica SOLO sobre materiales + costos indirectos
    // NO se aplica sobre: mano de obra, pintura, porcentaje de mano de obra, ni gastos extras
    const margenGananciaValor = subtotalAntesExtras * (margenGanancia / 100);
    
    // Precio unitario final = subtotal (materiales + costos indirectos) + utilidad + mano de obra completa + gastos extras
    // Orden: materiales + costos indirectos → aplicar utilidad → sumar mano de obra (base + pintura + porcentaje) → sumar gastos extras
    const precioUnitario = subtotalAntesExtras + margenGananciaValor + costoManoObraTotal + porcentajeManoObraValor + gastosExtrasValor;
    
    // Precio total (unitario × cantidad)
    const precioTotal = precioUnitario * cantidad;

    return {
      costoMateriales,
      costoManoObra,
      costoManoObraBase,
      costoPintura,
      porcentajeManoObraValor,
      costosIndirectos,
      subtotalAntesExtras,
      gastosExtrasValor,
      // Subtotal = materiales + costos indirectos + mano de obra completa (base + pintura + porcentaje) + gastos extras
      // Este es el total de costos antes de aplicar la utilidad
      subtotal: costoMateriales + costosIndirectos + costoManoObra + gastosExtrasValor,
      margenGananciaValor,
      precioUnitario,
      precioTotal
    };
  }, [materialesSeleccionados, tipoManoObra, horasMedidas, horasDiseno, montoPintura, diasArmado, diasInstalacion, montoManoObraManual, porcentajeManoObra, transporte, herramientas, alquilerEspacio, cajaChica, tipoGastoExtra, gastosExtrasPorcentaje, gastosExtrasMonto, margenGanancia, cantidad]);

  // Agregar material
  const agregarMaterial = () => {
    // Usar materialSeleccionadoObj si está disponible, sino buscar por ID
    let material: Material | undefined;
    if (materialSeleccionadoObj) {
      material = materialSeleccionadoObj;
    } else if (materialSeleccionado) {
      material = materiales.find(m => m.id === materialSeleccionado);
    }
    
    if (!material) {
      alert('Por favor selecciona un material de la lista');
      return;
    }

    const nuevoMaterialMueble: MaterialMueble = {
      material_id: material.id,
      material_nombre: material.nombre,
      cantidad: parseFloat(cantidadMaterial) || 1,
      unidad: material.unidad,
      precio_unitario: material.costo_unitario
    };

    setMaterialesSeleccionados([...materialesSeleccionados, nuevoMaterialMueble]);
    setMaterialSeleccionado('');
    setMaterialSeleccionadoObj(null);
    setBusquedaMaterial('');
    setCantidadMaterial('1');
  };

  // Eliminar material
  const eliminarMaterial = (index: number) => {
    setMaterialesSeleccionados(materialesSeleccionados.filter((_, i) => i !== index));
  };

  // Crear nuevo material
  const handleCrearMaterial = async () => {
    if (!nuevoMaterial.nombre || !nuevoMaterial.tipo) {
      alert('Completa todos los campos requeridos');
      return;
    }

    try {
      setCreandoMaterial(true);
      const materialCreado = await crearMaterial(nuevoMaterial);
      
      // Recargar materiales
      const materialesData = await obtenerMateriales();
      setMateriales(materialesData);
      
      // Seleccionar el material recién creado
      setMaterialSeleccionado(materialCreado.id);
      setMaterialSeleccionadoObj(materialCreado);
      setBusquedaMaterial(materialCreado.nombre);
      setMostrarCrearMaterial(false);
      setNuevoMaterial({ nombre: '', tipo: '', unidad: 'unidad', costo_unitario: 0, proveedor: '' });
      alert('✅ Material creado exitosamente');
    } catch (err: any) {
      console.error('Error al crear material:', err);
      alert('❌ Error al crear material: ' + (err.message || 'Error desconocido'));
    } finally {
      setCreandoMaterial(false);
    }
  };

  // Guardar cambios
  const handleGuardar = () => {
    const serviciosArray = [];
    
    if (tipoManoObra === 'monto') {
      // Si es monto manual, guardar como un servicio especial
      if (montoManoObraManual > 0) {
        serviciosArray.push({
          servicio_id: 'mano_obra_manual',
          servicio_nombre: 'Mano de Obra (Monto Manual)',
          horas: 0,
          precio_por_hora: 0,
          monto_manual: montoManoObraManual,
          tipo_calculo: 'monto'
        });
      }
    } else {
      // Si es por horas, guardar los servicios normalmente
      if (horasMedidas > 0) {
        serviciosArray.push({
          servicio_id: 'medidas',
          servicio_nombre: 'Medidas',
          horas: horasMedidas,
          precio_por_hora: PRECIO_HORA_MANO_OBRA
        });
      }
      
      if (horasDiseno > 0) {
        serviciosArray.push({
          servicio_id: 'diseno',
          servicio_nombre: 'Diseño',
          horas: horasDiseno,
          precio_por_hora: PRECIO_HORA_MANO_OBRA
        });
      }
      
      if (montoPintura > 0) {
        serviciosArray.push({
          servicio_id: 'pintura',
          servicio_nombre: 'Pintura',
          horas: 0,
          precio_por_hora: 0,
          monto_manual: montoPintura,
          tipo_calculo: 'monto'
        });
      }
      
      if (diasArmado > 0) {
        serviciosArray.push({
          servicio_id: 'armado',
          servicio_nombre: 'Armado',
          horas: diasArmado * 8,
          precio_por_hora: PRECIO_DIA_TRABAJO / 8
        });
      }
      
      if (diasInstalacion > 0) {
        serviciosArray.push({
          servicio_id: 'instalacion',
          servicio_nombre: 'Instalación',
          horas: diasInstalacion * 8,
          precio_por_hora: PRECIO_DIA_TRABAJO / 8
        });
      }
    }

    // Construir gastos extras - puede ser número (porcentaje) o array
    let gastosExtras: number | Array<{ concepto: string; monto: number }> | undefined;
    if (tipoGastoExtra === 'porcentaje' && gastosExtrasPorcentaje > 0) {
      gastosExtras = gastosExtrasPorcentaje;
    } else if (tipoGastoExtra === 'monto' && gastosExtrasMonto > 0) {
      gastosExtras = [{ concepto: 'Gastos Extras (Monto fijo)', monto: gastosExtrasMonto }];
    } else {
      gastosExtras = undefined;
    }

    // Construir costos indirectos
    const costosIndirectos = {
      transporte,
      herramientas,
      alquiler_espacio: alquilerEspacio,
      caja_chica: cajaChica,
      comentarios: comentariosCajaChica
    };

    // Actualizar el item - usar any para costos_indirectos ya que no está en el tipo
    actualizarItemManual(item.id, {
      nombre,
      descripcion,
      cantidad,
      medidas,
      materiales: materialesSeleccionados,
      servicios: serviciosArray,
      gastos_extras: gastosExtras,
      costos_indirectos: costosIndirectos as any,
      porcentaje_mano_obra: porcentajeManoObra > 0 ? porcentajeManoObra : undefined,
      margen_ganancia: margenGanancia,
      sin_datos_costos: {
        materiales: sinDatosCostosMateriales,
        mano_obra: sinDatosCostosManoObra,
        costos_indirectos: sinDatosCostosIndirectos
      }
    } as any);

    onSave();
    onClose();
  };

  // Mostrar error si hay alguno
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Recargar Página
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar que itemManual tenga las propiedades necesarias
  if (!itemManual || !itemManual.nombre) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">El item no tiene la información necesaria para editar.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">Editar Item: {itemManual.nombre}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
          </div>

          {/* Materiales */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Materiales</h3>
            {/* Checkbox para marcar sin datos de costos */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sinDatosCostosMateriales}
                  onChange={(e) => setSinDatosCostosMateriales(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">⚠️ No hay datos de costos de materiales aún</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Marca esta opción si no tienes los precios reales de materiales. Los KPIs no mostrarán comparativas hasta que agregues los datos reales.
                  </p>
                </div>
              </label>
            </div>
            {loadingMateriales ? (
              <p className="text-gray-500">Cargando materiales...</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {materialesSeleccionados.map((mat, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {mat.material_nombre || 'Material'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {mat.unidad} @ ${mat.precio_unitario?.toLocaleString('es-CO')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-700">Cantidad:</label>
                        <input
                          type="number"
                          value={mat.cantidad}
                          onChange={(e) => {
                            // Usar requestAnimationFrame para evitar reprocesamiento forzado
                            requestAnimationFrame(() => {
                              const nuevaCantidad = parseFloat(e.target.value) || 0;
                              const nuevosMateriales = [...materialesSeleccionados];
                              nuevosMateriales[index] = {
                                ...nuevosMateriales[index],
                                cantidad: nuevaCantidad
                              };
                              setMaterialesSeleccionados(nuevosMateriales);
                            });
                          }}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          min="0"
                          step="0.1"
                        />
                        <span className="text-xs text-gray-600">{mat.unidad}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ${((mat.cantidad || 0) * (mat.precio_unitario || 0)).toLocaleString('es-CO')}
                      </div>
                      <button
                        onClick={() => eliminarMaterial(index)}
                        className="text-red-600 hover:text-red-800 text-sm px-2"
                        title="Eliminar material"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <MaterialAutocomplete
                    materiales={materiales}
                    value={busquedaMaterial}
                    onChange={(value) => {
                      setBusquedaMaterial(value);
                      // Si el valor coincide exactamente con un material, seleccionarlo
                      const materialEncontrado = materiales.find(m => 
                        m.nombre.toLowerCase() === value.toLowerCase()
                      );
                      if (materialEncontrado) {
                        setMaterialSeleccionado(materialEncontrado.id);
                        setMaterialSeleccionadoObj(materialEncontrado);
                      } else {
                        setMaterialSeleccionado('');
                        setMaterialSeleccionadoObj(null);
                      }
                    }}
                    onSelect={(material) => {
                      if (material) {
                        setMaterialSeleccionado(material.id);
                        setMaterialSeleccionadoObj(material);
                        setBusquedaMaterial(material.nombre);
                      } else {
                        setMaterialSeleccionado('');
                        setMaterialSeleccionadoObj(null);
                      }
                    }}
                    placeholder="Buscar o escribir material..."
                    disabled={loadingMateriales}
                    showDetails={true}
                  />
                  <input
                    type="number"
                    value={cantidadMaterial}
                    onChange={(e) => setCantidadMaterial(e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0.1"
                    step="0.1"
                    placeholder="Cantidad"
                  />
                  <button
                    onClick={agregarMaterial}
                    disabled={(!materialSeleccionadoObj && !materialSeleccionado) || parseFloat(cantidadMaterial) <= 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    Agregar
                  </button>
                  <button
                    onClick={() => setMostrarCrearMaterial(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Nuevo
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mano de Obra / Días de Trabajo */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mano de Obra / Días de Trabajo</h3>
            
            {/* Selector de tipo de cálculo */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Tipo de Cálculo de Mano de Obra
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoManoObra"
                    value="horas"
                    checked={tipoManoObra === 'horas'}
                    onChange={(e) => setTipoManoObra(e.target.value as 'horas' | 'monto')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Por Horas y Días</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoManoObra"
                    value="monto"
                    checked={tipoManoObra === 'monto'}
                    onChange={(e) => setTipoManoObra(e.target.value as 'horas' | 'monto')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Monto Manual</span>
                </label>
              </div>
            </div>

            {tipoManoObra === 'horas' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas de Medidas</label>
                  <input
                    type="number"
                    value={horasMedidas}
                    onChange={(e) => setHorasMedidas(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas de Diseño</label>
                  <input
                    type="number"
                    value={horasDiseno}
                    onChange={(e) => setHorasDiseno(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pintura (monto total)</label>
                  <input
                    type="number"
                    value={montoPintura}
                    onChange={(e) => setMontoPintura(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="1000"
                    placeholder="Monto total de pintura"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Días de Armado</label>
                  <input
                    type="number"
                    value={diasArmado}
                    onChange={(e) => setDiasArmado(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Días de Instalación</label>
                  <input
                    type="number"
                    value={diasInstalacion}
                    onChange={(e) => setDiasInstalacion(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total de Mano de Obra</label>
                <input
                  type="number"
                  value={montoManoObraManual}
                  onChange={(e) => setMontoManoObraManual(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ingrese el monto total"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este monto se usará directamente como costo de mano de obra
                </p>
              </div>
            )}
            
            {/* Porcentaje adicional de mano de obra */}
            <div className="mt-4 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                📊 Margen adicional sobre mano de obra (opcional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Este porcentaje se aplica sobre el costo total de mano de obra (incluyendo pintura). 
                <strong className="text-orange-700"> NO se incluye en el cálculo de utilidad</strong> (similar a gastos extras).
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={porcentajeManoObra}
                  onChange={(e) => setPorcentajeManoObra(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
                <span className="text-sm text-gray-700">%</span>
                {porcentajeManoObra > 0 && (
                  <span className="text-sm font-medium text-orange-700">
                    = ${calculos.porcentajeManoObraValor.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Costos Indirectos */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Costos Indirectos</h3>
            
            {/* Checkbox para marcar sin datos de costos */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sinDatosCostosIndirectos}
                  onChange={(e) => setSinDatosCostosIndirectos(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">⚠️ No hay datos de costos indirectos aún</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Marca esta opción si no tienes los costos reales de gastos indirectos. Los KPIs no mostrarán comparativas hasta que agregues los datos reales.
                  </p>
                </div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporte</label>
                <input
                  type="number"
                  value={transporte}
                  onChange={(e) => setTransporte(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Herramientas</label>
                <input
                  type="number"
                  value={herramientas}
                  onChange={(e) => setHerramientas(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alquiler de Espacio</label>
                <input
                  type="number"
                  value={alquilerEspacio}
                  onChange={(e) => setAlquilerEspacio(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caja Chica</label>
                <input
                  type="number"
                  value={cajaChica}
                  onChange={(e) => setCajaChica(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Gastos Extras</label>
              {/* Selector de tipo: Porcentaje o Monto */}
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoGastoExtra"
                    value="porcentaje"
                    checked={tipoGastoExtra === 'porcentaje'}
                    onChange={() => setTipoGastoExtra('porcentaje')}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Porcentaje (%)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoGastoExtra"
                    value="monto"
                    checked={tipoGastoExtra === 'monto'}
                    onChange={() => setTipoGastoExtra('monto')}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Monto Total ($)</span>
                </label>
              </div>
              
              {tipoGastoExtra === 'porcentaje' ? (
                <input
                  type="number"
                  value={gastosExtrasPorcentaje}
                  onChange={(e) => setGastosExtrasPorcentaje(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="0.1"
                  placeholder="0"
                />
              ) : (
                <input
                  type="number"
                  value={gastosExtrasMonto}
                  onChange={(e) => setGastosExtrasMonto(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="1000"
                  placeholder="$ 0"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {tipoGastoExtra === 'porcentaje' 
                  ? 'Porcentaje que se suma a los costos totales'
                  : 'Monto fijo que se suma a los costos totales. NO se aplica utilidad sobre este monto.'}
              </p>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Margen de Ganancia (%)</label>
              <input
                type="number"
                value={margenGanancia}
                onChange={(e) => setMargenGanancia(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Resumen de Cálculos */}
          <div className="border-t border-gray-200 pt-4 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Cálculos</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Costo Materiales:</span>
                <span>${calculos.costoMateriales.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo Mano de Obra:</span>
                <span>${calculos.costoManoObra.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Costos Indirectos:</span>
                <span>${calculos.costosIndirectos.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos Extras {tipoGastoExtra === 'porcentaje' ? `(${gastosExtrasPorcentaje}%)` : '(Monto fijo)'}:</span>
                <span>${calculos.gastosExtrasValor.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Subtotal:</span>
                <span>${calculos.subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Margen de Ganancia ({margenGanancia}%):</span>
                <span>${calculos.margenGananciaValor.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                <span>Precio Unitario:</span>
                <span className="text-indigo-600">${calculos.precioUnitario.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Precio Total (×{cantidad}):</span>
                <span className="text-indigo-600">${calculos.precioTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleGuardar}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Guardar Cambios
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para crear nuevo material */}
      {mostrarCrearMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nuevo Material</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nuevoMaterial.nombre}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <input
                  type="text"
                  value={nuevoMaterial.tipo}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                <select
                  value={nuevoMaterial.unidad}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, unidad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  value={nuevoMaterial.proveedor}
                  onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, proveedor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCrearMaterial}
                  disabled={creandoMaterial}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg"
                >
                  {creandoMaterial ? 'Creando...' : 'Crear'}
                </button>
                <button
                  onClick={() => {
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
    </div>
  );
}
