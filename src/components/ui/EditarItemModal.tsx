/**
 * Modal para editar un item existente en la cotización
 * Permite modificar materiales, servicios, días de trabajo, etc.
 * VERSIÓN SIN REACT QUERY - Carga datos directamente
 */
import { useState, useEffect, useMemo } from 'react';
import { useCotizacionStore } from '../../store/cotizacionStore';
import { obtenerMateriales, crearMaterial } from '../../services/materiales.service';
import type { ItemCotizacion, ItemManualCotizacion, MaterialMueble, MedidasMueble } from '../../types/muebles';
import type { Material } from '../../types/database';

interface EditarItemModalProps {
  item: ItemCotizacion;
  onClose: () => void;
  onSave: () => void;
}

const PRECIO_HORA_MANO_OBRA = 50000;
const PRECIO_DIA_TRABAJO = 150000;

export default function EditarItemModal({ item, onClose, onSave }: EditarItemModalProps) {
  const { actualizarItemManual } = useCotizacionStore();
  const [error, setError] = useState<string | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loadingMateriales, setLoadingMateriales] = useState(true);
  const [creandoMaterial, setCreandoMaterial] = useState(false);
  
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
  const [horasMedidas, setHorasMedidas] = useState<number>(
    itemManual.servicios?.find(s => s.servicio_nombre?.includes('Medidas'))?.horas || 0
  );
  const [horasDiseno, setHorasDiseno] = useState<number>(
    itemManual.servicios?.find(s => s.servicio_nombre?.includes('Diseño'))?.horas || 0
  );
  const [diasArmado, setDiasArmado] = useState<number>(
    itemManual.servicios?.find(s => s.servicio_nombre?.includes('Armado'))?.horas ? 
    Math.ceil((itemManual.servicios.find(s => s.servicio_nombre?.includes('Armado'))?.horas || 0) / 8) : 0
  );
  const [diasInstalacion, setDiasInstalacion] = useState<number>(
    itemManual.servicios?.find(s => s.servicio_nombre?.includes('Instalación'))?.horas ?
    Math.ceil((itemManual.servicios.find(s => s.servicio_nombre?.includes('Instalación'))?.horas || 0) / 8) : 0
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
  const [gastosExtrasPorcentaje, setGastosExtrasPorcentaje] = useState<number>(
    typeof gastosExtrasItem === 'number' ? gastosExtrasItem : 0
  );

  // Utilidad
  const [margenGanancia, setMargenGanancia] = useState<number>(itemManual.margen_ganancia || 30);

  // Calcular totales
  const calculos = useMemo(() => {
    const costoMateriales = materialesSeleccionados.reduce((sum, mat) => {
      return sum + (mat.cantidad * (mat.precio_unitario || 0));
    }, 0);

    const costoManoObra = 
      (horasMedidas * PRECIO_HORA_MANO_OBRA) +
      (horasDiseno * PRECIO_HORA_MANO_OBRA) +
      (diasArmado * PRECIO_DIA_TRABAJO) +
      (diasInstalacion * PRECIO_DIA_TRABAJO);

    const costosIndirectos = transporte + herramientas + alquilerEspacio + cajaChica;
    
    // Subtotal antes de gastos extras
    const subtotalAntesExtras = costoMateriales + costoManoObra + costosIndirectos;
    
    // Gastos extras como porcentaje del subtotal
    const gastosExtrasValor = subtotalAntesExtras * (gastosExtrasPorcentaje / 100);
    
    // Subtotal final (incluyendo gastos extras)
    const subtotal = subtotalAntesExtras + gastosExtrasValor;
    
    // Margen de ganancia
    const margenGananciaValor = subtotal * (margenGanancia / 100);
    
    // Precio unitario final
    const precioUnitario = subtotal + margenGananciaValor;
    
    // Precio total (unitario × cantidad)
    const precioTotal = precioUnitario * cantidad;

    return {
      costoMateriales,
      costoManoObra,
      costosIndirectos,
      subtotalAntesExtras,
      gastosExtrasValor,
      subtotal,
      margenGananciaValor,
      precioUnitario,
      precioTotal
    };
  }, [materialesSeleccionados, horasMedidas, horasDiseno, diasArmado, diasInstalacion, transporte, herramientas, alquilerEspacio, cajaChica, gastosExtrasPorcentaje, margenGanancia, cantidad]);

  // Agregar material
  const agregarMaterial = () => {
    if (!materialSeleccionado) return;

    const material = materiales.find(m => m.id === materialSeleccionado);
    if (!material) return;

    const nuevoMaterialMueble: MaterialMueble = {
      material_id: material.id,
      material_nombre: material.nombre,
      cantidad: parseFloat(cantidadMaterial) || 1,
      unidad: material.unidad,
      precio_unitario: material.costo_unitario
    };

    setMaterialesSeleccionados([...materialesSeleccionados, nuevoMaterialMueble]);
    setMaterialSeleccionado('');
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

    // Construir gastos extras - puede ser número (porcentaje) o array
    const gastosExtras = gastosExtrasPorcentaje > 0 ? gastosExtrasPorcentaje : undefined;

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
      margen_ganancia: margenGanancia
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
            {loadingMateriales ? (
              <p className="text-gray-500">Cargando materiales...</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {materialesSeleccionados.map((mat, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                      <span className="text-sm">
                        {mat.material_nombre || 'Material'} - {mat.cantidad} {mat.unidad} @ ${mat.precio_unitario?.toLocaleString('es-CO')}
                      </span>
                      <button
                        onClick={() => eliminarMaterial(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <select
                    value={materialSeleccionado}
                    onChange={(e) => setMaterialSeleccionado(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar Material</option>
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
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0.1"
                    step="0.1"
                    placeholder="Cantidad"
                  />
                  <button
                    onClick={agregarMaterial}
                    disabled={!materialSeleccionado || parseFloat(cantidadMaterial) <= 0}
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
          </div>

          {/* Costos Indirectos */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Costos Indirectos</h3>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Gastos Extras (%)</label>
              <input
                type="number"
                value={gastosExtrasPorcentaje}
                onChange={(e) => setGastosExtrasPorcentaje(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
                step="0.1"
              />
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
                <span>Gastos Extras ({gastosExtrasPorcentaje}%):</span>
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
