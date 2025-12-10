/**
 * Componente de detalle de producto público
 * Similar a ProductDetail pero sin autenticación y con cotizador público
 */
import { useState, useMemo } from 'react';
import type { Mueble, OpcionesMueble } from '../../types/muebles';
import { useMueblePrice } from '../../hooks/useQuotationCalculator';
import CotizadorPublico from './CotizadorPublico';

interface ProductDetailPublicoProps {
  mueble: Mueble;
  onBack: () => void;
}

export default function ProductDetailPublico({ mueble, onBack }: ProductDetailPublicoProps) {
  const [mostrarCotizador, setMostrarCotizador] = useState(false);
  
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

  // Estado de opciones seleccionadas
  const [opciones, setOpciones] = useState<OpcionesMueble>({
    color: opcionesDisponibles.colores[0] || '',
    material: opcionesDisponibles.materiales[0] || '',
    encimera: opcionesDisponibles.encimeras[0] || '',
    cantear: opcionesDisponibles.canteados[0] || '',
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
   */
  const imagenActual = useMemo(() => {
    if (mueble.categoria === 'cocina' && opcionesDisponibles.opciones_personalizadas) {
      if (mostrarEjemploTopes) {
        return mostrarEjemploTopes;
      }
      if (mostrarEjemploPuertas) {
        return mostrarEjemploPuertas;
      }
      
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
      
      if (seleccionConfirmadaTopes && opcionesDisponibles.opciones_personalizadas.tipo_topes) {
        const opcionTope = opcionesDisponibles.opciones_personalizadas.tipo_topes.find(
          op => op.nombre === seleccionConfirmadaTopes
        );
        if (opcionTope?.imagen_url) {
          return opcionTope.imagen_url;
        }
      }

      if (seleccionConfirmadaPuertas && opcionesDisponibles.opciones_personalizadas.material_puertas) {
        const opcionPuerta = opcionesDisponibles.opciones_personalizadas.material_puertas.find(
          op => op.nombre === seleccionConfirmadaPuertas
        );
        if (opcionPuerta?.imagen_url) {
          return opcionPuerta.imagen_url;
        }
      }
    }
    
    return mueble.imagen || '';
  }, [
    mueble.imagen,
    mueble.categoria,
    opcionesDisponibles.opciones_personalizadas,
    seleccionTemporalPuertas,
    seleccionTemporalTopes,
    seleccionConfirmadaPuertas,
    seleccionConfirmadaTopes,
    mostrarEjemploPuertas,
    mostrarEjemploTopes
  ]);

  const actualizarOpcion = (key: keyof OpcionesMueble, value: string) => {
    setOpciones(prev => ({ ...prev, [key]: value }));
  };

  const confirmarSeleccionPuertas = () => {
    if (seleccionTemporalPuertas) {
      setSeleccionConfirmadaPuertas(seleccionTemporalPuertas);
      actualizarOpcion('material_puertas', seleccionTemporalPuertas);
      setPasoActual(2);
      setMostrarEjemploPuertas(null);
    }
  };

  const confirmarSeleccionTopes = () => {
    if (seleccionTemporalTopes) {
      setSeleccionConfirmadaTopes(seleccionTemporalTopes);
      actualizarOpcion('tipo_topes', seleccionTemporalTopes);
      setMostrarEjemploTopes(null);
    }
  };

  const volverAPaso1 = () => {
    setPasoActual(1);
    setSeleccionTemporalPuertas(seleccionConfirmadaPuertas);
  };

  // Si se muestra el cotizador, renderizar ese componente
  if (mostrarCotizador) {
    return (
      <CotizadorPublico
        mueble={mueble}
        opciones={opciones}
        cantidad={cantidad}
        precioFinal={precioFinal}
        onBack={() => setMostrarCotizador(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
        >
          ← Volver al Catálogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda: Imagen */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  key={imagenActual}
                  src={imagenActual}
                  alt={mueble.nombre}
                  className="w-full h-full object-cover transition-all duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x800?text=' + encodeURIComponent(mueble.nombre);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Columna derecha: Información y opciones */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {mueble.nombre}
              </h1>
              {mueble.descripcion && (
                <p className="text-sm text-gray-500 mb-6">{mueble.descripcion}</p>
              )}

              {/* Opciones Personalizadas de Cocina - Mismo código que ProductDetail */}
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
                          return (
                            <div key={opcion.nombre} className="flex flex-col items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSeleccionTemporalPuertas(opcion.nombre);
                                  if (opcion.imagen_url) {
                                    setMostrarEjemploPuertas(opcion.imagen_url);
                                    setMostrarEjemploTopes(null);
                                  }
                                }}
                                className={`relative flex flex-col items-center gap-2 transition-all ${
                                  isSelected ? 'scale-110' : 'hover:scale-105'
                                }`}
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
                              </button>
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
                                  setSeleccionTemporalTopes(opcion.nombre);
                                  if (opcion.imagen_url) {
                                    setMostrarEjemploTopes(opcion.imagen_url);
                                    setMostrarEjemploPuertas(null);
                                  }
                                }}
                                className={`relative flex flex-col items-center gap-2 transition-all ${
                                  isSelected ? 'scale-110' : 'hover:scale-105'
                                }`}
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
                              </button>
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
                        {opcionesDisponibles.opciones_personalizadas.material_puertas && (
                          <div className="flex flex-col items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const opcion = opcionesDisponibles.opciones_personalizadas?.material_puertas?.find(
                                  op => op.nombre === seleccionConfirmadaPuertas
                                );
                                if (opcion?.imagen_url) {
                                  setMostrarEjemploPuertas(opcion.imagen_url);
                                  setMostrarEjemploTopes(null);
                                }
                              }}
                              className="relative group"
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
                            </button>
                            <p className="text-xs font-medium text-center text-gray-700 max-w-[100px]">
                              {seleccionConfirmadaPuertas}
                            </p>
                            <p className="text-xs text-gray-500">Material de Puertas</p>
                          </div>
                        )}

                        {opcionesDisponibles.opciones_personalizadas.tipo_topes && (
                          <div className="flex flex-col items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const opcion = opcionesDisponibles.opciones_personalizadas?.tipo_topes?.find(
                                  op => op.nombre === seleccionConfirmadaTopes
                                );
                                if (opcion?.imagen_url) {
                                  setMostrarEjemploTopes(opcion.imagen_url);
                                  setMostrarEjemploPuertas(null);
                                }
                              }}
                              className="relative group"
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

                  {/* Resumen */}
                  {seleccionConfirmadaPuertas && seleccionConfirmadaTopes && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 Resumen:</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Material de Puertas:</span>
                          <span className="font-medium text-gray-900">{seleccionConfirmadaPuertas}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Tipo de Topes:</span>
                          <span className="font-medium text-gray-900">{seleccionConfirmadaTopes}</span>
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
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
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
                    onClick={() => setCantidad(cantidad + 1)}
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

              {/* Botón para cotizar */}
              <button
                onClick={() => setMostrarCotizador(true)}
                disabled={mueble.categoria === 'cocina' && (!seleccionConfirmadaPuertas || !seleccionConfirmadaTopes)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Cotizar Cocina
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

