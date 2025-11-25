/**
 * Componente para gestión del catálogo de muebles (solo admin)
 * Permite crear, editar y eliminar muebles del catálogo
 */
import { useState, useEffect, Component, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { obtenerMueblesAdmin, crearMuebleAdmin, actualizarMuebleAdmin, eliminarMuebleAdmin } from '../../services/muebles-admin.service';
import { obtenerMateriales } from '../../services/materiales.service';
import { obtenerServicios } from '../../services/servicios.service';
import { subirImagen, validarImagen } from '../../services/storage.service';
import type { Mueble, MaterialMueble, MedidasMueble, OpcionPersonalizada } from '../../types/muebles';
import type { Material } from '../../types/database';
import type { Servicio } from '../../types/database';

interface ImagenAdicional {
  file?: File;
  url?: string;
  color: string;
  descripcion?: string;
}

interface ImagenVariante {
  file?: File;
  url?: string;
  color?: string;
  material?: string;
  encimera?: string;
}

// Componente interno que usa React Query
// Este componente DEBE estar dentro de un QueryProvider
// Si QueryProvider no está montado, el Error Boundary capturará el error
function GestionarCatalogoContent() {
  // useQueryClient() debe llamarse incondicionalmente (regla de hooks)
  // Si QueryProvider no está montado, lanzará un error que el Error Boundary capturará
  const queryClient = useQueryClient();
  
  const [muebleEditando, setMuebleEditando] = useState<Mueble | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenPrincipal, setImagenPrincipal] = useState<File | null>(null);
  const [imagenPrincipalUrl, setImagenPrincipalUrl] = useState<string>('');
  const [precioBase, setPrecioBase] = useState<number>(0);
  const [categoria, setCategoria] = useState<'closet' | 'cocina' | 'bano' | 'sensorial' | 'otros'>('closet');
  
  // Medidas
  const [medidas, setMedidas] = useState<MedidasMueble>({
    ancho: undefined,
    alto: undefined,
    profundidad: undefined,
    unidad: 'cm'
  });

  // Opciones disponibles
  const [colores, setColores] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [materialesOpciones, setMaterialesOpciones] = useState<string[]>([]);
  const [materialInput, setMaterialInput] = useState('');
  const [encimeras, setEncimeras] = useState<string[]>([]);
  const [encimeraInput, setEncimeraInput] = useState('');
  const [canteados, setCanteados] = useState<string[]>([]);
  const [cantearInput, setCantearInput] = useState('');

  // Materiales predeterminados
  const [materialesPredeterminados, setMaterialesPredeterminados] = useState<MaterialMueble[]>([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState<string>('');
  const [cantidadMaterial, setCantidadMaterial] = useState<string>('1');
  const [unidadMaterial, setUnidadMaterial] = useState<string>('m²');

  // Servicios predeterminados
  const [serviciosPredeterminados, setServiciosPredeterminados] = useState<Array<{
    servicio_id: string;
    servicio_nombre?: string;
    horas: number;
    precio_por_hora: number;
  }>>([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('');
  const [horasServicio, setHorasServicio] = useState<string>('1');

  // Imágenes adicionales con colores (legacy)
  const [imagenesAdicionales, setImagenesAdicionales] = useState<ImagenAdicional[]>([]);
  
  // Imágenes por variante (nuevo sistema)
  const [imagenesPorVariante, setImagenesPorVariante] = useState<ImagenVariante[]>([]);

  // Configuración de fabricación
  const [diasFabricacion, setDiasFabricacion] = useState<number>(0);
  const [horasManoObra, setHorasManoObra] = useState<number>(0);
  const [margenGanancia, setMargenGanancia] = useState<number>(30);

  // Opciones personalizadas para cocinas
  const [opcionesPersonalizadas, setOpcionesPersonalizadas] = useState<{
    tipo_cocina?: OpcionPersonalizada[];
    material_puertas?: OpcionPersonalizada[];
    tipo_topes?: OpcionPersonalizada[];
  }>({});

  // Obtener datos
  const { data: muebles = [], isLoading: loadingMuebles } = useQuery({
    queryKey: ['muebles-admin'],
    queryFn: obtenerMueblesAdmin
  });

  const { data: materiales = [] } = useQuery({
    queryKey: ['materiales'],
    queryFn: obtenerMateriales
  });

  const { data: servicios = [] } = useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios
  });

  // Mutaciones
  const crearMutation = useMutation({
    mutationFn: crearMuebleAdmin,
    onSuccess: () => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['muebles-admin'] });
      queryClient.invalidateQueries({ queryKey: ['muebles'] });
      
      // Resetear formulario
      resetFormulario();
      setMostrarFormulario(false);
      
      // Mostrar mensaje de éxito
      alert('✅ Mueble creado exitosamente. El catálogo se actualizará automáticamente.');
      
      // Forzar refetch después de un breve delay para asegurar que los datos se actualicen
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['muebles'] });
        queryClient.refetchQueries({ queryKey: ['muebles-admin'] });
      }, 500);
    },
    onError: (error: any) => {
      let mensajeError = 'Error al crear mueble: ' + error.message;
      
      // Si el error es sobre el bucket, mostrar instrucciones más claras
      if (error.message?.includes('bucket') || error.message?.includes('Bucket')) {
        mensajeError = `❌ El bucket de Storage no existe.\n\n` +
          `📋 PASOS PARA SOLUCIONAR:\n\n` +
          `1. Ve a Supabase Dashboard (https://app.supabase.com)\n` +
          `2. Selecciona tu proyecto\n` +
          `3. Ve a "Storage" en el menú lateral\n` +
          `4. Haz clic en "New bucket"\n` +
          `5. Nombre: muebles-imagenes\n` +
          `6. Marca "Public bucket" como ✅\n` +
          `7. Haz clic en "Create bucket"\n\n` +
          `📄 Ver el archivo SOLUCION-BUCKET.md para más detalles.`;
      }
      
      alert(mensajeError);
      console.error('Error completo:', error);
    }
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => actualizarMuebleAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muebles-admin'] });
      queryClient.invalidateQueries({ queryKey: ['muebles'] });
      resetFormulario();
      setMostrarFormulario(false);
      alert('Mueble actualizado exitosamente');
    },
    onError: (error: any) => {
      let mensajeError = 'Error al actualizar mueble: ' + error.message;
      
      if (error.message?.includes('bucket') || error.message?.includes('Bucket')) {
        mensajeError = `❌ El bucket de Storage no existe.\n\n` +
          `Por favor crea el bucket "muebles-imagenes" en Supabase Storage.\n` +
          `Ver SOLUCION-BUCKET.md para instrucciones.`;
      }
      
      alert(mensajeError);
      console.error('Error completo:', error);
    }
  });

  const eliminarMutation = useMutation({
    mutationFn: eliminarMuebleAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muebles-admin'] });
      queryClient.invalidateQueries({ queryKey: ['muebles'] });
      alert('Mueble eliminado exitosamente');
    },
    onError: (error: any) => {
      alert('Error al eliminar mueble: ' + error.message);
    }
  });

  /**
   * Resetea el formulario
   */
  function resetFormulario() {
    setNombre('');
    setDescripcion('');
    setImagenPrincipal(null);
    setImagenPrincipalUrl('');
    setPrecioBase(0);
    setCategoria('closet');
    setMedidas({ ancho: undefined, alto: undefined, profundidad: undefined, unidad: 'cm' });
    setColores([]);
    setMaterialesOpciones([]);
    setEncimeras([]);
    setCanteados([]);
    setMaterialesPredeterminados([]);
    setServiciosPredeterminados([]);
    setImagenesAdicionales([]);
    setImagenesPorVariante([]);
    setDiasFabricacion(0);
    setHorasManoObra(0);
    setMargenGanancia(30);
    setMuebleEditando(null);
    setOpcionesPersonalizadas({});
  }

  /**
   * Carga los datos de un mueble para editar
   */
  function cargarMuebleParaEditar(mueble: Mueble) {
    setMuebleEditando(mueble);
    setNombre(mueble.nombre);
    setDescripcion(mueble.descripcion || '');
    setImagenPrincipalUrl(mueble.imagen);
    setPrecioBase(mueble.precio_base);
    setCategoria(mueble.categoria);
    setMedidas(mueble.medidas || { ancho: undefined, alto: undefined, profundidad: undefined, unidad: 'cm' });
    setColores(mueble.opciones_disponibles?.colores || []);
    setMaterialesOpciones(mueble.opciones_disponibles?.materiales || []);
    setEncimeras(mueble.opciones_disponibles?.encimeras || []);
    setCanteados(mueble.opciones_disponibles?.canteados || []);
    setMaterialesPredeterminados(mueble.materiales_predeterminados || []);
    setDiasFabricacion(mueble.dias_fabricacion || 0);
    setHorasManoObra(mueble.horas_mano_obra || 0);
    setMargenGanancia(mueble.margen_ganancia || 30);
    
    // Cargar imágenes adicionales (si existen en el formato correcto)
    if (mueble.imagenes_adicionales && mueble.imagenes_adicionales.length > 0) {
      // Asumimos que las URLs están en el array, pero necesitamos los colores
      // Por ahora, solo cargamos las URLs
      setImagenesAdicionales(mueble.imagenes_adicionales.map((url: string) => ({
        url,
        color: ''
      })));
    }
    
    // Cargar imágenes por variante
    if (mueble.imagenes_por_variante && mueble.imagenes_por_variante.length > 0) {
      setImagenesPorVariante(mueble.imagenes_por_variante);
    } else {
      setImagenesPorVariante([]);
    }
    
    // Cargar opciones personalizadas
    if (mueble.opciones_disponibles?.opciones_personalizadas) {
      setOpcionesPersonalizadas(mueble.opciones_disponibles.opciones_personalizadas);
    } else {
      setOpcionesPersonalizadas({});
    }
    
    setMostrarFormulario(true);
  }

  /**
   * Agrega un color a la lista
   */
  function agregarColor() {
    if (colorInput.trim() && !colores.includes(colorInput.trim())) {
      setColores([...colores, colorInput.trim()]);
      setColorInput('');
    }
  }

  /**
   * Elimina un color
   */
  function eliminarColor(color: string) {
    setColores(colores.filter(c => c !== color));
  }

  /**
   * Agrega un material a las opciones
   */
  function agregarMaterialOpcion() {
    if (materialInput.trim() && !materialesOpciones.includes(materialInput.trim())) {
      setMaterialesOpciones([...materialesOpciones, materialInput.trim()]);
      setMaterialInput('');
    }
  }

  /**
   * Agrega un material predeterminado
   */
  function agregarMaterialPredeterminado() {
    const material = materiales.find(m => m.id === materialSeleccionado);
    if (!material) return;

    const nuevoMaterial: MaterialMueble = {
      material_id: material.id,
      material_nombre: material.nombre,
      cantidad: parseFloat(cantidadMaterial) || 1,
      unidad: unidadMaterial,
      precio_unitario: material.costo_unitario
    };

    setMaterialesPredeterminados([...materialesPredeterminados, nuevoMaterial]);
    setMaterialSeleccionado('');
    setCantidadMaterial('1');
  }

  /**
   * Agrega un servicio predeterminado
   */
  function agregarServicioPredeterminado() {
    const servicio = servicios.find(s => s.id === servicioSeleccionado);
    if (!servicio) return;

    const nuevoServicio = {
      servicio_id: servicio.id,
      servicio_nombre: servicio.nombre,
      horas: parseFloat(horasServicio) || 1,
      precio_por_hora: servicio.precio_por_hora
    };

    setServiciosPredeterminados([...serviciosPredeterminados, nuevoServicio]);
    setServicioSeleccionado('');
    setHorasServicio('1');
  }

  /**
   * Maneja la subida de imagen adicional
   */
  async function handleAgregarImagenAdicional(file: File, color: string, descripcion?: string) {
    if (!validarImagen(file)) {
      alert('Imagen inválida. Debe ser JPG, PNG o WEBP y menor a 5MB');
      return;
    }

    try {
      const url = await subirImagen(file);
      setImagenesAdicionales([...imagenesAdicionales, { url, color, descripcion }]);
    } catch (error: any) {
      alert('Error al subir imagen: ' + error.message);
    }
  }

  /**
   * Maneja el envío del formulario
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (!imagenPrincipal && !imagenPrincipalUrl) {
      alert('Debes subir una imagen principal');
      return;
    }

    const muebleData: any = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      imagen: imagenPrincipal || imagenPrincipalUrl,
      precio_base: precioBase,
      categoria,
      medidas: medidas.ancho || medidas.alto || medidas.profundidad ? medidas : undefined,
      opciones_disponibles: {
        colores,
        materiales: materialesOpciones,
        encimeras: encimeras.length > 0 ? encimeras : undefined,
        canteados: canteados.length > 0 ? canteados : undefined,
        opciones_personalizadas: Object.keys(opcionesPersonalizadas).length > 0 ? opcionesPersonalizadas : undefined
      },
      materiales_predeterminados: materialesPredeterminados,
      servicios_predeterminados: serviciosPredeterminados,
      imagenes_adicionales: imagenesAdicionales,
      imagenes_por_variante: imagenesPorVariante.map(img => ({
        color: img.color,
        material: img.material,
        encimera: img.encimera,
        imagen_url: img.url || ''
      })),
      dias_fabricacion: diasFabricacion || undefined,
      horas_mano_obra: horasManoObra || undefined,
      margen_ganancia: margenGanancia
    };

    if (muebleEditando) {
      actualizarMutation.mutate({ id: muebleEditando.id, data: muebleData });
    } else {
      crearMutation.mutate(muebleData);
    }
  }

  if (loadingMuebles) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Catálogo</h1>
        <button
          onClick={() => {
            resetFormulario();
            setMostrarFormulario(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          + Nuevo Mueble
        </button>
      </div>

      {/* Lista de muebles */}
      {!mostrarFormulario && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {muebles.map((mueble) => (
            <div key={mueble.id} className="bg-white rounded-xl shadow-sm p-6">
              <img
                src={mueble.imagen}
                alt={mueble.nombre}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{mueble.nombre}</h3>
              <p className="text-sm text-gray-600 mb-4">{mueble.descripcion}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-indigo-600">
                  ${mueble.precio_base.toLocaleString('es-CO')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => cargarMuebleParaEditar(mueble)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar este mueble?')) {
                        eliminarMutation.mutate(mueble.id);
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario de creación/edición */}
      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {muebleEditando ? 'Editar Mueble' : 'Nuevo Mueble'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Mueble *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as any)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="closet">Closet</option>
                  <option value="cocina">Cocina</option>
                  <option value="bano">Baño</option>
                  <option value="sensorial">Sensorial</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Base *
                </label>
                <input
                  type="number"
                  value={precioBase}
                  onChange={(e) => setPrecioBase(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Imagen principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen Principal *
              </label>
              {imagenPrincipalUrl && !imagenPrincipal && (
                <img src={imagenPrincipalUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg mb-2" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (validarImagen(file)) {
                      setImagenPrincipal(file);
                      setImagenPrincipalUrl('');
                    } else {
                      alert('Imagen inválida. Debe ser JPG, PNG o WEBP y menor a 5MB');
                    }
                  }
                }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Medidas */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Medidas Predeterminadas</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ancho (cm)</label>
                  <input
                    type="number"
                    value={medidas.ancho || ''}
                    onChange={(e) => setMedidas({ ...medidas, ancho: parseFloat(e.target.value) || undefined })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ancho"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Alto (cm)</label>
                  <input
                    type="number"
                    value={medidas.alto || ''}
                    onChange={(e) => setMedidas({ ...medidas, alto: parseFloat(e.target.value) || undefined })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Alto"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Profundidad (cm)</label>
                  <input
                    type="number"
                    value={medidas.profundidad || ''}
                    onChange={(e) => setMedidas({ ...medidas, profundidad: parseFloat(e.target.value) || undefined })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Profundidad"
                  />
                </div>
              </div>
            </div>

            {/* Opciones disponibles */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opciones Disponibles</h3>
              
              {/* Colores */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Colores</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarColor())}
                    placeholder="Agregar color"
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={agregarColor}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colores.map((color) => (
                    <span
                      key={color}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => eliminarColor(color)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Materiales (opciones) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Materiales (Opciones)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={materialInput}
                    onChange={(e) => setMaterialInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarMaterialOpcion())}
                    placeholder="Agregar material"
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={agregarMaterialOpcion}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {materialesOpciones.map((mat) => (
                    <span
                      key={mat}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {mat}
                      <button
                        type="button"
                        onClick={() => setMaterialesOpciones(materialesOpciones.filter(m => m !== mat))}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Opciones Personalizadas para Cocinas */}
            {categoria === 'cocina' && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🍳 Opciones Personalizadas de Cocina
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configura las opciones específicas de cocina con imágenes y precios
                </p>

                {/* Tipo de Cocina */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Cocina
                  </label>
                  <div className="space-y-3">
                    {(opcionesPersonalizadas.tipo_cocina || []).map((opcion, index) => (
                      <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {opcion.imagen_url && (
                          <img src={opcion.imagen_url} alt={opcion.nombre} className="w-20 h-20 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{opcion.nombre}</p>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            {opcion.precio_adicional !== undefined && (
                              <span>Precio adicional: ${opcion.precio_adicional.toLocaleString('es-CO')}</span>
                            )}
                            {opcion.multiplicador !== undefined && opcion.multiplicador !== 1 && (
                              <span>Multiplicador: {opcion.multiplicador}x</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nuevas = [...(opcionesPersonalizadas.tipo_cocina || [])];
                            nuevas.splice(index, 1);
                            setOpcionesPersonalizadas({ ...opcionesPersonalizadas, tipo_cocina: nuevas });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && validarImagen(file)) {
                            try {
                              const url = await subirImagen(file);
                              const nombre = prompt('Nombre del tipo de cocina (ej: Recta, Cara a Cara, En L, Irregular):') || 'Sin nombre';
                              const precioAdicional = prompt('Precio adicional (dejar vacío para usar multiplicador):');
                              const multiplicador = prompt('Multiplicador (dejar vacío para usar precio adicional, ej: 1.2):');
                              
                              const nuevaOpcion: OpcionPersonalizada = {
                                nombre,
                                imagen_url: url,
                                precio_adicional: precioAdicional ? parseFloat(precioAdicional) : undefined,
                                multiplicador: multiplicador ? parseFloat(multiplicador) : undefined
                              };
                              
                              setOpcionesPersonalizadas({
                                ...opcionesPersonalizadas,
                                tipo_cocina: [...(opcionesPersonalizadas.tipo_cocina || []), nuevaOpcion]
                              });
                              e.target.value = '';
                            } catch (error: any) {
                              alert('Error al subir imagen: ' + error.message);
                            }
                          }
                        }}
                        className="hidden"
                        id="input-tipo-cocina"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('input-tipo-cocina')?.click()}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        + Agregar Tipo de Cocina
                      </button>
                    </div>
                  </div>
                </div>

                {/* Material de Puertas */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Material de Puertas
                  </label>
                  <div className="space-y-3">
                    {(opcionesPersonalizadas.material_puertas || []).map((opcion, index) => (
                      <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {opcion.imagen_url && (
                          <img src={opcion.imagen_url} alt={opcion.nombre} className="w-20 h-20 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{opcion.nombre}</p>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            {opcion.precio_adicional !== undefined && (
                              <span>Precio adicional: ${opcion.precio_adicional.toLocaleString('es-CO')}</span>
                            )}
                            {opcion.multiplicador !== undefined && opcion.multiplicador !== 1 && (
                              <span>Multiplicador: {opcion.multiplicador}x</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nuevas = [...(opcionesPersonalizadas.material_puertas || [])];
                            nuevas.splice(index, 1);
                            setOpcionesPersonalizadas({ ...opcionesPersonalizadas, material_puertas: nuevas });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && validarImagen(file)) {
                            try {
                              const url = await subirImagen(file);
                              const nombre = prompt('Nombre del material (ej: Vidrio, Brillantes, Vintage, Melamina):') || 'Sin nombre';
                              const precioAdicional = prompt('Precio adicional (dejar vacío para usar multiplicador):');
                              const multiplicador = prompt('Multiplicador (dejar vacío para usar precio adicional, ej: 1.2):');
                              
                              const nuevaOpcion: OpcionPersonalizada = {
                                nombre,
                                imagen_url: url,
                                precio_adicional: precioAdicional ? parseFloat(precioAdicional) : undefined,
                                multiplicador: multiplicador ? parseFloat(multiplicador) : undefined
                              };
                              
                              setOpcionesPersonalizadas({
                                ...opcionesPersonalizadas,
                                material_puertas: [...(opcionesPersonalizadas.material_puertas || []), nuevaOpcion]
                              });
                              e.target.value = '';
                            } catch (error: any) {
                              alert('Error al subir imagen: ' + error.message);
                            }
                          }
                        }}
                        className="hidden"
                        id="input-material-puertas"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('input-material-puertas')?.click()}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        + Agregar Material de Puertas
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tipo de Topes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Topes
                  </label>
                  <div className="space-y-3">
                    {(opcionesPersonalizadas.tipo_topes || []).map((opcion, index) => (
                      <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {opcion.imagen_url && (
                          <img src={opcion.imagen_url} alt={opcion.nombre} className="w-20 h-20 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{opcion.nombre}</p>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            {opcion.precio_adicional !== undefined && (
                              <span>Precio adicional: ${opcion.precio_adicional.toLocaleString('es-CO')}</span>
                            )}
                            {opcion.multiplicador !== undefined && opcion.multiplicador !== 1 && (
                              <span>Multiplicador: {opcion.multiplicador}x</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nuevas = [...(opcionesPersonalizadas.tipo_topes || [])];
                            nuevas.splice(index, 1);
                            setOpcionesPersonalizadas({ ...opcionesPersonalizadas, tipo_topes: nuevas });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && validarImagen(file)) {
                            try {
                              const url = await subirImagen(file);
                              const nombre = prompt('Nombre del tipo de tope (ej: Cuarzo, Madera, Granito, Mármol, Laminado):') || 'Sin nombre';
                              const precioAdicional = prompt('Precio adicional (dejar vacío para usar multiplicador):');
                              const multiplicador = prompt('Multiplicador (dejar vacío para usar precio adicional, ej: 1.2):');
                              
                              const nuevaOpcion: OpcionPersonalizada = {
                                nombre,
                                imagen_url: url,
                                precio_adicional: precioAdicional ? parseFloat(precioAdicional) : undefined,
                                multiplicador: multiplicador ? parseFloat(multiplicador) : undefined
                              };
                              
                              setOpcionesPersonalizadas({
                                ...opcionesPersonalizadas,
                                tipo_topes: [...(opcionesPersonalizadas.tipo_topes || []), nuevaOpcion]
                              });
                              e.target.value = '';
                            } catch (error: any) {
                              alert('Error al subir imagen: ' + error.message);
                            }
                          }
                        }}
                        className="hidden"
                        id="input-tipo-topes"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('input-tipo-topes')?.click()}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        + Agregar Tipo de Tope
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Materiales predeterminados */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Materiales Predeterminados</h3>
              <div className="flex gap-2 mb-4">
                <select
                  value={materialSeleccionado}
                  onChange={(e) => setMaterialSeleccionado(e.target.value)}
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar material...</option>
                  {materiales.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.nombre} - ${mat.costo_unitario.toLocaleString('es-CO')} / {mat.unidad}
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
                  className="w-32 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <select
                  value={unidadMaterial}
                  onChange={(e) => setUnidadMaterial(e.target.value)}
                  className="w-32 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="m²">m²</option>
                  <option value="metro lineal">metro lineal</option>
                  <option value="unidad">unidad</option>
                  <option value="par">par</option>
                  <option value="kg">kg</option>
                </select>
                <button
                  type="button"
                  onClick={agregarMaterialPredeterminado}
                  disabled={!materialSeleccionado}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              {materialesPredeterminados.length > 0 && (
                <div className="space-y-2">
                  {materialesPredeterminados.map((mat, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium">{mat.material_nombre}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {mat.cantidad} {mat.unidad} × ${mat.precio_unitario?.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMaterialesPredeterminados(materialesPredeterminados.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Servicios predeterminados */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicios / Mano de Obra Predeterminados</h3>
              <div className="flex gap-2 mb-4">
                <select
                  value={servicioSeleccionado}
                  onChange={(e) => setServicioSeleccionado(e.target.value)}
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar servicio...</option>
                  {servicios.map((serv) => (
                    <option key={serv.id} value={serv.id}>
                      {serv.nombre} - ${serv.precio_por_hora.toLocaleString('es-CO')} / hora
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={horasServicio}
                  onChange={(e) => setHorasServicio(e.target.value)}
                  placeholder="Horas"
                  min="0.5"
                  step="0.5"
                  className="w-32 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={agregarServicioPredeterminado}
                  disabled={!servicioSeleccionado}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              {serviciosPredeterminados.length > 0 && (
                <div className="space-y-2">
                  {serviciosPredeterminados.map((serv, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium">{serv.servicio_nombre}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {serv.horas} horas × ${serv.precio_por_hora.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setServiciosPredeterminados(serviciosPredeterminados.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Imágenes por variante (NUEVO SISTEMA) */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎨 Imágenes por Variante (Vista Previa Dinámica)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Sube imágenes que se mostrarán cuando el cliente seleccione diferentes opciones de color, material o encimera.
              </p>
              <div className="space-y-4">
                {imagenesPorVariante.map((img, index) => (
                  <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {img.url && (
                      <img src={img.url} alt={`Variante ${index + 1}`} className="w-24 h-24 object-cover rounded-lg" />
                    )}
                    <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Color:</span>
                        <p className="font-medium">{img.color || 'Cualquiera'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Material:</span>
                        <p className="font-medium">{img.material || 'Cualquiera'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Encimera:</span>
                        <p className="font-medium">{img.encimera || 'Cualquiera'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagenesPorVariante(imagenesPorVariante.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    ➕ Agregar nueva imagen por variante ({imagenesPorVariante.length} agregadas):
                  </p>
                  <label className="block">
                    <div className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!validarImagen(file)) {
                              alert('Imagen inválida. Debe ser JPG, PNG o WEBP y menor a 5MB');
                              // Resetear el input
                              e.target.value = '';
                              return;
                            }
                            
                            try {
                              const url = await subirImagen(file);
                              
                              // Pedir opciones para esta variante
                              const color = prompt('¿Qué color representa esta imagen? (Deja vacío si aplica a todos):') || undefined;
                              const material = prompt('¿Qué material representa esta imagen? (Deja vacío si aplica a todos):') || undefined;
                              const encimera = prompt('¿Qué encimera representa esta imagen? (Deja vacío si aplica a todos):') || undefined;
                              
                              setImagenesPorVariante([...imagenesPorVariante, { url, color, material, encimera }]);
                              
                              // IMPORTANTE: Resetear el input para permitir agregar otra imagen
                              e.target.value = '';
                            } catch (error: any) {
                              alert('Error al subir imagen: ' + error.message);
                              // Resetear el input incluso si hay error
                              e.target.value = '';
                            }
                          }
                        }}
                        className="hidden"
                        id="input-variante-imagen"
                      />
                      <span className="flex-1 px-4 py-2 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors text-sm text-gray-700 cursor-pointer">
                        📁 Seleccionar imagen...
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('input-variante-imagen')?.click();
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        Subir Imagen
                      </button>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-3">
                    💡 Tip: Puedes agregar múltiples imágenes. Después de subir una, haz clic en "Subir Imagen" nuevamente para agregar otra.
                    <br />
                    💡 Si dejas un campo vacío, la imagen se mostrará para cualquier opción de ese tipo.
                  </p>
                </div>
              </div>
            </div>

            {/* Imágenes adicionales con colores (LEGACY - mantener por compatibilidad) */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Imágenes Adicionales (Legacy)</h3>
              <p className="text-sm text-gray-500 mb-4">Usa el sistema de "Imágenes por Variante" arriba para mejor funcionalidad.</p>
              <div className="space-y-4">
                {imagenesAdicionales.map((img, index) => (
                  <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                    {img.url && (
                      <img src={img.url} alt={`Imagen ${index + 1}`} className="w-24 h-24 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Color: {img.color || 'Sin color'}</p>
                      {img.descripcion && <p className="text-xs text-gray-500">{img.descripcion}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagenesAdicionales(imagenesAdicionales.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const color = prompt('¿Qué color representa esta imagen?');
                        if (color) {
                          const descripcion = prompt('Descripción (opcional):');
                          await handleAgregarImagenAdicional(file, color, descripcion || undefined);
                        }
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Configuración de fabricación */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Fabricación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Días de Fabricación</label>
                  <input
                    type="number"
                    value={diasFabricacion}
                    onChange={(e) => setDiasFabricacion(parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas de Mano de Obra</label>
                  <input
                    type="number"
                    value={horasManoObra}
                    onChange={(e) => setHorasManoObra(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Margen de Ganancia (%)</label>
                  <input
                    type="number"
                    value={margenGanancia}
                    onChange={(e) => setMargenGanancia(parseFloat(e.target.value) || 30)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={crearMutation.isPending || actualizarMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {crearMutation.isPending || actualizarMutation.isPending
                  ? 'Guardando...'
                  : muebleEditando
                  ? 'Actualizar Mueble'
                  : 'Crear Mueble'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFormulario();
                  setMostrarFormulario(false);
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Error Boundary de clase para capturar errores de QueryClient
class QueryClientErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error en GestionarCatalogo (QueryClient):', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12 bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <p className="text-red-600 text-lg mb-2 font-bold">⚠️ Error: QueryClient no disponible</p>
          <p className="text-gray-700 mb-4">
            {this.state.error?.message || 'El componente necesita React Query para funcionar.'}
          </p>
          <p className="text-gray-600 text-sm mb-4">
            Asegúrate de que el componente esté dentro de un QueryProvider.
          </p>
          <div className="space-x-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Crear un QueryClient local para GestionarCatalogo si no hay uno disponible
// Esto asegura que el componente funcione independientemente de si está dentro de un QueryProvider
let localQueryClient: QueryClient | null = null;

function getOrCreateQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // En el servidor, crear uno nuevo
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

  // En el cliente, crear uno local si no existe
  if (!localQueryClient) {
    localQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000
        }
      }
    });
  }

  return localQueryClient;
}

// Componente que intenta usar el QueryClient del contexto, o crea uno local
function GestionarCatalogoWithProvider() {
  const [useLocalProvider, setUseLocalProvider] = useState(false);
  const [queryClient] = useState(() => getOrCreateQueryClient());

  useEffect(() => {
    // Intentar verificar si hay un QueryProvider en el árbol
    // Si no hay, usar nuestro QueryClient local
    const timer = setTimeout(() => {
      // Intentar usar el QueryClient del contexto
      try {
        // Si llegamos aquí sin error, hay un QueryProvider
        // No hacer nada, usar el del contexto
      } catch (error) {
        // Si hay error, usar nuestro QueryClient local
        setUseLocalProvider(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Si necesitamos usar el provider local, envolver el contenido
  if (useLocalProvider) {
    return (
      <QueryClientProvider client={queryClient}>
        <GestionarCatalogoContent />
      </QueryClientProvider>
    );
  }

  // Si hay un QueryProvider en el árbol, renderizar directamente
  // El Error Boundary capturará cualquier error
  return (
    <QueryClientErrorBoundary>
      <GestionarCatalogoContent />
    </QueryClientErrorBoundary>
  );
}

// Componente wrapper que solo se renderiza en el cliente
export default function GestionarCatalogo() {
  // Verificar que estamos en el cliente
  if (typeof window === 'undefined') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Cargando...</p>
      </div>
    );
  }

  // Siempre usar nuestro propio QueryProvider para garantizar que funcione
  const [queryClient] = useState(() => getOrCreateQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <QueryClientErrorBoundary>
        <GestionarCatalogoContent />
      </QueryClientErrorBoundary>
    </QueryClientProvider>
  );
}

