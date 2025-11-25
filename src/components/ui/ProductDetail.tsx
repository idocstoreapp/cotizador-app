/**
 * Componente de detalle de producto
 * Incluye imagen grande, selectores de opciones, cantidad y cálculo de precio
 * Con vista previa dinámica que cambia según las opciones seleccionadas
 */
import { useState, useMemo } from 'react';
import type { Mueble, OpcionesMueble } from '../../types/muebles';
import { useMueblePrice } from '../../hooks/useQuotationCalculator';

interface ProductDetailProps {
  mueble: Mueble;
  onAddToQuote: (mueble: Mueble, opciones: OpcionesMueble, cantidad: number) => void;
  onBack: () => void;
}

export default function ProductDetail({ mueble, onAddToQuote, onBack }: ProductDetailProps) {
  // Asegurar que opciones_disponibles tenga la estructura correcta
  const opcionesDisponibles = {
    colores: Array.isArray(mueble.opciones_disponibles?.colores) 
      ? mueble.opciones_disponibles.colores 
      : [],
    materiales: Array.isArray(mueble.opciones_disponibles?.materiales) 
      ? mueble.opciones_disponibles.materiales 
      : [],
    encimeras: Array.isArray(mueble.opciones_disponibles?.encimeras) 
      ? mueble.opciones_disponibles.encimeras 
      : [],
    canteados: Array.isArray(mueble.opciones_disponibles?.canteados) 
      ? mueble.opciones_disponibles.canteados 
      : [],
    opciones_personalizadas: mueble.opciones_disponibles?.opciones_personalizadas || undefined
  };

  // Debug: verificar opciones personalizadas
  if (mueble.categoria === 'cocina') {
    console.log('🍳 ProductDetail - Cocina detectada');
    console.log('Opciones personalizadas:', opcionesDisponibles.opciones_personalizadas);
    console.log('Mueble completo:', mueble);
  }

  // Validar y normalizar imagenes_por_variante
  const imagenesPorVariante = useMemo(() => {
    if (!mueble.imagenes_por_variante) {
      console.log('ProductDetail: No hay imagenes_por_variante en el mueble');
      return [];
    }

    if (!Array.isArray(mueble.imagenes_por_variante)) {
      console.warn('ProductDetail: imagenes_por_variante no es un array:', mueble.imagenes_por_variante);
      return [];
    }

    // Filtrar y validar que cada variante tenga imagen_url
    const variantesValidas = mueble.imagenes_por_variante.filter((v: any) => {
      const tieneUrl = v && (v.imagen_url || v.url);
      if (!tieneUrl) {
        console.warn('ProductDetail: Variante sin URL:', v);
      }
      return tieneUrl;
    }).map((v: any) => ({
      color: v.color || undefined,
      material: v.material || undefined,
      encimera: v.encimera || undefined,
      imagen_url: v.imagen_url || v.url || ''
    }));

    console.log(`ProductDetail: ${variantesValidas.length} variantes válidas de ${mueble.imagenes_por_variante.length} totales`);
    return variantesValidas;
  }, [mueble.imagenes_por_variante]);

  // Estado de opciones seleccionadas
  const [opciones, setOpciones] = useState<OpcionesMueble>({
    color: opcionesDisponibles.colores[0] || '',
    material: opcionesDisponibles.materiales[0] || '',
    encimera: opcionesDisponibles.encimeras[0] || '',
    cantear: opcionesDisponibles.canteados[0] || '',
    // Opciones personalizadas de cocina - inicialmente vacías hasta que el usuario confirme
    material_puertas: '',
    tipo_topes: ''
  });

  const [cantidad, setCantidad] = useState(1);
  
  // Estado para el flujo de selección de cocina
  const [pasoActual, setPasoActual] = useState<1 | 2>(1);
  const [seleccionTemporalPuertas, setSeleccionTemporalPuertas] = useState<string>('');
  const [seleccionTemporalTopes, setSeleccionTemporalTopes] = useState<string>('');
  const [seleccionConfirmadaPuertas, setSeleccionConfirmadaPuertas] = useState<string>('');
  const [seleccionConfirmadaTopes, setSeleccionConfirmadaTopes] = useState<string>('');
  const [mostrarEjemploPuertas, setMostrarEjemploPuertas] = useState<string | null>(null);
  const [mostrarEjemploTopes, setMostrarEjemploTopes] = useState<string | null>(null);
  
  // Usar el hook para calcular el precio
  const precioFinal = useMueblePrice(mueble, opciones);

  /**
   * Obtiene la URL de la imagen según las opciones seleccionadas
   * Prioridad: tipo_topes > material_puertas > imagenes_por_variante > imagen principal
   * Para cocinas, usa selecciones temporales si están en proceso de selección
   */
  const imagenActual = useMemo(() => {
    // Si es cocina y hay opciones personalizadas, buscar imagen según las opciones seleccionadas
    if (mueble.categoria === 'cocina' && opcionesDisponibles.opciones_personalizadas) {
      // Prioridad 1: Imagen de ejemplo explícita (botón "Ver ejemplo" o click en círculo)
      if (mostrarEjemploTopes) {
        console.log('🍳 Imagen actual: mostrarEjemploTopes =', mostrarEjemploTopes);
        return mostrarEjemploTopes;
      }
      if (mostrarEjemploPuertas) {
        console.log('🍳 Imagen actual: mostrarEjemploPuertas =', mostrarEjemploPuertas);
        return mostrarEjemploPuertas;
      }
      
      // Prioridad 2: Selección temporal (mientras el usuario está eligiendo)
      if (seleccionTemporalTopes && opcionesDisponibles.opciones_personalizadas.tipo_topes) {
        const opcionTope = opcionesDisponibles.opciones_personalizadas.tipo_topes.find(
          op => op.nombre === seleccionTemporalTopes
        );
        if (opcionTope?.imagen_url) {
          return opcionTope.imagen_url;
        }
      }
      
      if (seleccionTemporalPuertas && opcionesDisponibles.opciones_personalizadas.material_puertas) {
        const opcionPuerta = opcionesDisponibles.opciones_personalizadas.material_puertas.find(
          op => op.nombre === seleccionTemporalPuertas
        );
        if (opcionPuerta?.imagen_url) {
          return opcionPuerta.imagen_url;
        }
      }
      
      // Prioridad 3: Tipo de Topes confirmado (más específico)
      if (seleccionConfirmadaTopes && opcionesDisponibles.opciones_personalizadas.tipo_topes) {
        const opcionTope = opcionesDisponibles.opciones_personalizadas.tipo_topes.find(
          op => op.nombre === seleccionConfirmadaTopes
        );
        if (opcionTope?.imagen_url) {
          return opcionTope.imagen_url;
        }
      }

      // Prioridad 4: Material de Puertas confirmado
      if (seleccionConfirmadaPuertas && opcionesDisponibles.opciones_personalizadas.material_puertas) {
        const opcionPuerta = opcionesDisponibles.opciones_personalizadas.material_puertas.find(
          op => op.nombre === seleccionConfirmadaPuertas
        );
        if (opcionPuerta?.imagen_url) {
          return opcionPuerta.imagen_url;
        }
      }
    }

    // Si hay imagenes_por_variante, buscar por opciones tradicionales
    if (imagenesPorVariante.length > 0) {
      // Buscar una variante que coincida con las opciones actuales
      const variante = imagenesPorVariante.find(v => {
        const matchColor = !v.color || v.color === opciones.color;
        const matchMaterial = !v.material || v.material === opciones.material;
        const matchEncimera = !v.encimera || v.encimera === opciones.encimera;
        return matchColor && matchMaterial && matchEncimera;
      });
      
      if (variante) {
        return variante.imagen_url;
      }
      
      // Si no hay coincidencia exacta, buscar por color solamente
      const variantePorColor = imagenesPorVariante.find(v => v.color === opciones.color);
      if (variantePorColor) {
        return variantePorColor.imagen_url;
      }
    }
    
    // Fallback a imagen principal
    return mueble.imagen || '';
  }, [
    imagenesPorVariante, 
    seleccionConfirmadaPuertas,
    seleccionConfirmadaTopes,
    seleccionTemporalPuertas,
    seleccionTemporalTopes,
    mostrarEjemploPuertas,
    mostrarEjemploTopes,
    pasoActual,
    opciones.color,
    opciones.material,
    opciones.encimera,
    mueble.imagen, 
    mueble.categoria,
    opcionesDisponibles.opciones_personalizadas
  ]);

  /**
   * Actualiza una opción específica
   */
  const actualizarOpcion = (key: keyof OpcionesMueble, value: string) => {
    setOpciones(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Confirma la selección del paso 1 (Material de Puertas)
   */
  const confirmarSeleccionPuertas = () => {
    if (seleccionTemporalPuertas) {
      setSeleccionConfirmadaPuertas(seleccionTemporalPuertas);
      actualizarOpcion('material_puertas', seleccionTemporalPuertas);
      setPasoActual(2);
      setMostrarEjemploPuertas(null);
    }
  };

  /**
   * Confirma la selección del paso 2 (Tipo de Topes)
   */
  const confirmarSeleccionTopes = () => {
    if (seleccionTemporalTopes) {
      setSeleccionConfirmadaTopes(seleccionTemporalTopes);
      actualizarOpcion('tipo_topes', seleccionTemporalTopes);
      setMostrarEjemploTopes(null);
    }
  };

  /**
   * Permite volver al paso 1 para modificar la selección
   */
  const volverAPaso1 = () => {
    setPasoActual(1);
    setSeleccionTemporalPuertas(seleccionConfirmadaPuertas);
  };

  /**
   * Incrementa la cantidad
   */
  const incrementarCantidad = () => {
    setCantidad(prev => prev + 1);
  };

  /**
   * Decrementa la cantidad
   */
  const decrementarCantidad = () => {
    if (cantidad > 1) {
      setCantidad(prev => prev - 1);
    }
  };

  /**
   * Maneja el agregado a cotización
   */
  const handleAddToQuote = () => {
    onAddToQuote(mueble, opciones, cantidad);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda: Imagen grande y thumbnails (2/3 del ancho) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Imagen principal grande */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
              <img
                key={imagenActual} // Forzar re-render cuando cambia la imagen
                src={imagenActual}
                alt={`${mueble.nombre} - ${opciones.material_puertas || opciones.tipo_topes || 'Cocina'}`}
                className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x800?text=' + encodeURIComponent(mueble.nombre);
                }}
              />
              {/* Indicador de carga suave */}
              <div className="absolute inset-0 bg-gray-200 animate-pulse opacity-0 pointer-events-none transition-opacity duration-300" 
                   id="image-loading-indicator"></div>
            </div>
            
            {/* Thumbnails de variantes (si existen) */}
            {imagenesPorVariante.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Variantes disponibles:</h3>
                <div className="grid grid-cols-4 gap-2">
                  {imagenesPorVariante.map((variante, index) => {
                    const isActive = variante.imagen_url === imagenActual;
                    return (
                      <button
                        key={`${variante.imagen_url}-${index}`}
                        onClick={() => {
                          if (variante.color) setOpciones(prev => ({ ...prev, color: variante.color! }));
                          if (variante.material) setOpciones(prev => ({ ...prev, material: variante.material! }));
                          if (variante.encimera) setOpciones(prev => ({ ...prev, encimera: variante.encimera! }));
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          isActive 
                            ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title={`${variante.color || 'Variante'} ${variante.material ? `- ${variante.material}` : ''}`}
                      >
                        <img
                          src={variante.imagen_url}
                          alt={`Variante ${variante.color || index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Error al cargar imagen de variante:', variante.imagen_url);
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=Variante';
                          }}
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-indigo-600 bg-opacity-20"></div>
                        )}
                        {variante.color && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate">
                            {variante.color}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: Información y opciones (1/3 del ancho) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {mueble.nombre}
            </h1>
            {mueble.descripcion && (
              <p className="text-sm text-gray-500 mb-6">{mueble.descripcion}</p>
            )}

            {/* Selector de Color con vista previa de imágenes */}
            {opcionesDisponibles.colores.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Color:
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {opcionesDisponibles.colores.map((color) => {
                    // Buscar si hay una imagen para este color
                    const varianteColor = imagenesPorVariante.find(v => v.color === color);
                    const isActive = opciones.color === color;
                    
                    return (
                      <button
                        key={color}
                        onClick={() => actualizarOpcion('color', color)}
                        className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                          isActive
                            ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{
                          backgroundColor: color.toLowerCase() === 'blanco' ? '#ffffff' :
                                         color.toLowerCase() === 'negro' ? '#000000' :
                                         color.toLowerCase() === 'marrón' || color.toLowerCase() === 'marron' || color.toLowerCase() === 'marron' ? '#8B4513' :
                                         color.toLowerCase() === 'gris' ? '#808080' :
                                         color.toLowerCase() === 'azul rey' || color.toLowerCase() === 'azul' ? '#1e3a8a' :
                                         color.toLowerCase() === 'beige' ? '#f5f5dc' :
                                         color.toLowerCase() === 'melanina' ? '#f5f5f5' : '#f5f5f5'
                        }}
                        title={color}
                      >
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-indigo-600 bg-opacity-20"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <select
                  value={opciones.color}
                  onChange={(e) => actualizarOpcion('color', e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  {opcionesDisponibles.colores.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Material */}
            {opcionesDisponibles.materiales.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material:
                </label>
                <select
                  value={opciones.material}
                  onChange={(e) => actualizarOpcion('material', e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  {opcionesDisponibles.materiales.map((material) => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Encimera (si está disponible) */}
            {opcionesDisponibles.encimeras.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encimera:
                </label>
                <select
                  value={opciones.encimera}
                  onChange={(e) => actualizarOpcion('encimera', e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  {opcionesDisponibles.encimeras.map((encimera) => (
                    <option key={encimera} value={encimera}>{encimera}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Cantear (si está disponible) */}
            {opcionesDisponibles.canteados.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantear:
                </label>
                <input
                  type="text"
                  value={opciones.cantear || ''}
                  onChange={(e) => actualizarOpcion('cantear', e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="Ingrese tipo de cantear"
                />
              </div>
            )}

            {/* Opciones Personalizadas de Cocina */}
            {mueble.categoria === 'cocina' && opcionesDisponibles.opciones_personalizadas && (
              <>
                {/* Paso 1: Material de Puertas */}
                {pasoActual === 1 && opcionesDisponibles.opciones_personalizadas.material_puertas && 
                 opcionesDisponibles.opciones_personalizadas.material_puertas.length > 0 && (
                  <div className="mb-6 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      🚪 Paso 1: Selecciona el Material de Puertas
                    </label>
                    <div className="flex gap-3 justify-center flex-wrap mb-4">
                      {opcionesDisponibles.opciones_personalizadas.material_puertas.map((opcion) => {
                        const isSelected = seleccionTemporalPuertas === opcion.nombre;
                        const isConfirmed = seleccionConfirmadaPuertas === opcion.nombre;
                        return (
                          <div key={opcion.nombre} className="flex flex-col items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const nuevaSeleccion = opcion.nombre;
                                console.log('🚪 Click en opción de Material de Puertas:', nuevaSeleccion);
                                setSeleccionTemporalPuertas(nuevaSeleccion);
                                // Actualizar la imagen de ejemplo inmediatamente
                                if (opcion.imagen_url) {
                                  console.log('Actualizando imagen de puertas a:', opcion.imagen_url);
                                  setMostrarEjemploPuertas(opcion.imagen_url);
                                  // Limpiar el ejemplo de topes si estaba mostrándose
                                  setMostrarEjemploTopes(null);
                                } else {
                                  console.warn('No hay imagen_url en la opción:', opcion);
                                }
                              }}
                              className={`relative flex flex-col items-center gap-2 transition-all ${
                                isSelected
                                  ? 'scale-110'
                                  : 'hover:scale-105'
                              }`}
                              title={opcion.nombre}
                            >
                              {opcion.imagen_url && (
                                <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                                  isSelected || isConfirmed
                                    ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-lg'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}>
                                  <img
                                    src={opcion.imagen_url}
                                    alt={opcion.nombre}
                                    className="w-full h-full object-cover"
                                  />
                                  {(isSelected || isConfirmed) && (
                                    <div className="absolute inset-0 bg-indigo-600 bg-opacity-20"></div>
                                  )}
                                </div>
                              )}
                              <p className={`text-xs font-medium text-center max-w-[80px] ${
                                isSelected || isConfirmed ? 'text-indigo-600' : 'text-gray-700'
                              }`}>
                                {opcion.nombre}
                              </p>
                              {(opcion.precio_adicional || opcion.multiplicador) && (
                                <p className="text-xs text-gray-500">
                                  {opcion.precio_adicional
                                    ? `+$${opcion.precio_adicional.toLocaleString('es-CO')}`
                                    : opcion.multiplicador && opcion.multiplicador !== 1
                                    ? `${opcion.multiplicador}x`
                                    : ''}
                                </p>
                              )}
                            </button>
                            {opcion.imagen_url && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMostrarEjemploPuertas(opcion.imagen_url || null);
                                  setMostrarEjemploTopes(null); // Limpiar ejemplo de topes
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                              >
                                Ver ejemplo
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {seleccionTemporalPuertas && (
                      <button
                        type="button"
                        onClick={confirmarSeleccionPuertas}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        ✓ Confirmar y Continuar al Paso 2
                      </button>
                    )}
                  </div>
                )}

                {/* Paso 2: Tipo de Topes */}
                {pasoActual === 2 && opcionesDisponibles.opciones_personalizadas.tipo_topes && 
                 opcionesDisponibles.opciones_personalizadas.tipo_topes.length > 0 && 
                 !seleccionConfirmadaTopes && (
                  <div className="mb-6 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-900">
                        🏔️ Paso 2: Selecciona el Tipo de Topes
                      </label>
                      {seleccionConfirmadaPuertas && (
                        <button
                          type="button"
                          onClick={volverAPaso1}
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                        >
                          ← Modificar Puertas
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3 justify-center flex-wrap mb-4">
                      {opcionesDisponibles.opciones_personalizadas.tipo_topes.map((opcion) => {
                        const isSelected = seleccionTemporalTopes === opcion.nombre;
                        return (
                          <div key={opcion.nombre} className="flex flex-col items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const nuevaSeleccion = opcion.nombre;
                                console.log('🏔️ Click en opción de Tipo de Topes:', nuevaSeleccion);
                                setSeleccionTemporalTopes(nuevaSeleccion);
                                // Actualizar la imagen de ejemplo inmediatamente
                                if (opcion.imagen_url) {
                                  console.log('Actualizando imagen de topes a:', opcion.imagen_url);
                                  setMostrarEjemploTopes(opcion.imagen_url);
                                  // Limpiar el ejemplo de puertas si estaba mostrándose
                                  setMostrarEjemploPuertas(null);
                                } else {
                                  console.warn('No hay imagen_url en la opción:', opcion);
                                }
                              }}
                              className={`relative flex flex-col items-center gap-2 transition-all ${
                                isSelected
                                  ? 'scale-110'
                                  : 'hover:scale-105'
                              }`}
                              title={opcion.nombre}
                            >
                              {opcion.imagen_url && (
                                <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                                  isSelected
                                    ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-lg'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}>
                                  <img
                                    src={opcion.imagen_url}
                                    alt={opcion.nombre}
                                    className="w-full h-full object-cover"
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-indigo-600 bg-opacity-20"></div>
                                  )}
                                </div>
                              )}
                              <p className={`text-xs font-medium text-center max-w-[80px] ${
                                isSelected ? 'text-indigo-600' : 'text-gray-700'
                              }`}>
                                {opcion.nombre}
                              </p>
                              {(opcion.precio_adicional || opcion.multiplicador) && (
                                <p className="text-xs text-gray-500">
                                  {opcion.precio_adicional
                                    ? `+$${opcion.precio_adicional.toLocaleString('es-CO')}`
                                    : opcion.multiplicador && opcion.multiplicador !== 1
                                    ? `${opcion.multiplicador}x`
                                    : ''}
                                </p>
                              )}
                            </button>
                            {opcion.imagen_url && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMostrarEjemploTopes(opcion.imagen_url || null);
                                  setMostrarEjemploPuertas(null); // Limpiar ejemplo de puertas
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                              >
                                Ver ejemplo
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {seleccionTemporalTopes && (
                      <button
                        type="button"
                        onClick={confirmarSeleccionTopes}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        ✓ Confirmar Selección
                      </button>
                    )}
                  </div>
                )}

                {/* Vista Final: Solo círculos de opciones confirmadas */}
                {seleccionConfirmadaPuertas && seleccionConfirmadaTopes && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      ✅ Tu Selección
                    </label>
                    <div className="flex gap-6 justify-center items-start mb-4">
                      {/* Círculo de Material de Puertas */}
                      {opcionesDisponibles.opciones_personalizadas.material_puertas && (
                        <div className="flex flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              console.log('🚪 Click en círculo de Material de Puertas');
                              const opcion = opcionesDisponibles.opciones_personalizadas?.material_puertas?.find(
                                op => op.nombre === seleccionConfirmadaPuertas
                              );
                              console.log('Opcion encontrada:', opcion);
                              if (opcion?.imagen_url) {
                                console.log('Actualizando imagen a:', opcion.imagen_url);
                                setMostrarEjemploPuertas(opcion.imagen_url);
                                setMostrarEjemploTopes(null); // Limpiar ejemplo de topes
                              } else {
                                console.warn('No se encontró imagen para:', seleccionConfirmadaPuertas);
                              }
                            }}
                            className="relative group"
                            title={`Click para ver: ${seleccionConfirmadaPuertas}`}
                          >
                            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-600 ring-2 ring-indigo-200 shadow-lg transition-all hover:scale-110 cursor-pointer">
                              {(() => {
                                const opcion = opcionesDisponibles.opciones_personalizadas?.material_puertas?.find(
                                  op => op.nombre === seleccionConfirmadaPuertas
                                );
                                return opcion?.imagen_url ? (
                                  <img
                                    src={opcion.imagen_url}
                                    alt={seleccionConfirmadaPuertas}
                                    className="w-full h-full object-cover"
                                  />
                                ) : null;
                              })()}
                              <div className="absolute inset-0 bg-indigo-600 bg-opacity-20"></div>
                            </div>
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Click para ver
                            </div>
                          </button>
                          <p className="text-xs font-medium text-center text-gray-700 max-w-[100px]">
                            {seleccionConfirmadaPuertas}
                          </p>
                          <p className="text-xs text-gray-500">Material de Puertas</p>
                        </div>
                      )}

                      {/* Círculo de Tipo de Topes */}
                      {opcionesDisponibles.opciones_personalizadas.tipo_topes && (
                        <div className="flex flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              console.log('🏔️ Click en círculo de Tipo de Topes');
                              const opcion = opcionesDisponibles.opciones_personalizadas?.tipo_topes?.find(
                                op => op.nombre === seleccionConfirmadaTopes
                              );
                              console.log('Opcion encontrada:', opcion);
                              if (opcion?.imagen_url) {
                                console.log('Actualizando imagen a:', opcion.imagen_url);
                                setMostrarEjemploTopes(opcion.imagen_url);
                                setMostrarEjemploPuertas(null); // Limpiar ejemplo de puertas
                              } else {
                                console.warn('No se encontró imagen para:', seleccionConfirmadaTopes);
                              }
                            }}
                            className="relative group"
                            title={`Click para ver: ${seleccionConfirmadaTopes}`}
                          >
                            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-600 ring-2 ring-indigo-200 shadow-lg transition-all hover:scale-110 cursor-pointer">
                              {(() => {
                                const opcion = opcionesDisponibles.opciones_personalizadas?.tipo_topes?.find(
                                  op => op.nombre === seleccionConfirmadaTopes
                                );
                                return opcion?.imagen_url ? (
                                  <img
                                    src={opcion.imagen_url}
                                    alt={seleccionConfirmadaTopes}
                                    className="w-full h-full object-cover"
                                  />
                                ) : null;
                              })()}
                              <div className="absolute inset-0 bg-indigo-600 bg-opacity-20"></div>
                            </div>
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Click para ver
                            </div>
                          </button>
                          <p className="text-xs font-medium text-center text-gray-700 max-w-[100px]">
                            {seleccionConfirmadaTopes}
                          </p>
                          <p className="text-xs text-gray-500">Tipo de Topes</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resumen de Selecciones - Solo cuando ambos pasos estén confirmados */}
                {seleccionConfirmadaPuertas && seleccionConfirmadaTopes && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 Resumen de tu Selección:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Material de Puertas:</span>
                        <span className="font-medium text-gray-900">{seleccionConfirmadaPuertas}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPasoActual(1);
                            setSeleccionTemporalPuertas(seleccionConfirmadaPuertas);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-2"
                        >
                          Cambiar
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Tipo de Topes:</span>
                        <span className="font-medium text-gray-900">{seleccionConfirmadaTopes}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPasoActual(2);
                            setSeleccionTemporalTopes(seleccionConfirmadaTopes);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-2"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Selector de Cantidad */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad:
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={decrementarCantidad}
                  className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-medium text-sm"
                >
                  −
                </button>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setCantidad(Math.max(1, value));
                  }}
                  className="w-16 text-center rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  min="1"
                />
                <button
                  onClick={incrementarCantidad}
                  className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-medium text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Precios */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Precio Base:</span>
                <span className="text-sm font-medium">${mueble.precio_base.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-base font-semibold text-gray-900">Precio Final:</span>
                <span className="text-xl font-bold text-indigo-600">
                  ${precioFinal.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={handleAddToQuote}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Agregar a la Cotización
              </button>
              <button
                onClick={onBack}
                className="w-full px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                ← Volver al Catálogo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

