/**
 * Página para actualizar una cotización con materiales desde costos reales
 */
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import { obtenerCotizaciones } from '../services/cotizaciones.service';
import type { UserProfile } from '../types/database';

export default function ActualizarCotizacionPage() {
  const contextoUsuario = useUser();
  const [usuarioLocal, setUsuarioLocal] = useState<UserProfile | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [numeroCotizacion, setNumeroCotizacion] = useState('kub-1001');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cotizacionesDisponibles, setCotizacionesDisponibles] = useState<string[]>([]);
  const [buscandoCotizaciones, setBuscandoCotizaciones] = useState(false);

  // Usar usuario del contexto o cargar directamente
  const usuario = contextoUsuario.usuario || usuarioLocal;
  const esAdmin = usuario?.role === 'admin' || false;

  // Cargar usuario directamente si no está en contexto
  useEffect(() => {
    const cargarUsuario = async () => {
      if (contextoUsuario.usuario?.id) {
        setUsuarioLocal(null);
        setCargandoUsuario(false);
        return;
      }
      try {
        setCargandoUsuario(true);
        const usuarioDirecto = await obtenerUsuarioActual();
        if (usuarioDirecto) {
          setUsuarioLocal(usuarioDirecto);
        }
      } catch (err: any) {
        console.error('Error al cargar usuario:', err);
      } finally {
        setCargandoUsuario(false);
      }
    };
    cargarUsuario();
  }, [contextoUsuario.usuario?.id]);

  // Cargar lista de cotizaciones disponibles
  useEffect(() => {
    const cargarCotizaciones = async () => {
      try {
        setBuscandoCotizaciones(true);
        const cotizaciones = await obtenerCotizaciones();
        const numeros = cotizaciones.map(c => c.numero).filter(Boolean).sort();
        setCotizacionesDisponibles(numeros);
      } catch (err) {
        console.error('Error al cargar cotizaciones:', err);
      } finally {
        setBuscandoCotizaciones(false);
      }
    };
    if (esAdmin && !cargandoUsuario) {
      cargarCotizaciones();
    }
  }, [esAdmin, cargandoUsuario]);

  // Mostrar loading mientras se carga el usuario
  if (cargandoUsuario) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Solo los administradores pueden acceder a esta página.</p>
        </div>
      </div>
    );
  }

  const handleActualizar = async () => {
    const numeroLimpio = numeroCotizacion.trim().toUpperCase();
    
    if (!numeroLimpio) {
      setError('Por favor ingresa un número de cotización');
      return;
    }

    setCargando(true);
    setError(null);
    setResultado(null);

    // Primero verificar que el endpoint esté disponible
    try {
      console.log('🔍 Verificando conexión con el endpoint...');
      const testResponse = await fetch('/api/actualizar-costos', {
        method: 'GET',
      });
      
      if (!testResponse.ok && testResponse.status !== 405) {
        // 405 es "Method Not Allowed" que es aceptable para GET
        console.warn('⚠️ Endpoint responde pero con status:', testResponse.status);
      } else {
        console.log('✅ Endpoint está disponible');
      }
    } catch (testError) {
      console.warn('⚠️ No se pudo verificar el endpoint (continuando de todas formas):', testError);
    }

    try {
      // Intentar con la ruta más corta
      const apiUrl = '/api/actualizar-costos';
      const urlCompleta = window.location.origin + apiUrl;
      console.log('🔍 [Frontend] Llamando a:', apiUrl);
      console.log('🔍 [Frontend] URL completa:', urlCompleta);
      console.log('🔍 [Frontend] Body:', { numeroCotizacion: numeroLimpio });
      
      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ numeroCotizacion: numeroLimpio }),
        });
      } catch (fetchError: any) {
        console.error('❌ [Frontend] Error en fetch:', fetchError);
        const mensajeError = fetchError.message || 'Error desconocido';
        
        // Verificar si es un error de red
        if (mensajeError.includes('Failed to fetch') || mensajeError.includes('NetworkError')) {
          setError(`Error de conexión: No se pudo conectar al servidor. 
          
Verifica que:
1. El servidor esté corriendo (npm run dev)
2. Estés accediendo desde http://localhost:4321
3. No haya problemas de firewall o proxy

URL intentada: ${urlCompleta}`);
        } else {
          setError(`Error de conexión: ${mensajeError}`);
        }
        return;
      }

      console.log('📥 [Frontend] Response status:', response.status);
      console.log('📥 [Frontend] Response ok:', response.ok);
      console.log('📥 [Frontend] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorText: string;
        try {
          errorText = await response.text();
          console.error('❌ [Frontend] Response error:', errorText);
          
          // Intentar parsear como JSON
          try {
            const errorData = JSON.parse(errorText);
            const mensajeError = errorData.error || `Error ${response.status}`;
            
            // Si es 404, dar mensaje más específico
            if (response.status === 404) {
              setError(`Endpoint no encontrado (404). 
              
El servidor no encontró la ruta /api/actualizar-costos.

Verifica que:
1. El archivo src/pages/api/actualizar-costos.ts existe
2. El servidor se haya reiniciado después de crear el archivo
3. No haya errores de sintaxis en el endpoint

Error: ${mensajeError}`);
            } else {
              setError(mensajeError);
            }
            
            // Guardar información adicional si está disponible
            if (errorData.materialesEnGastosReales || errorData.materialesNoEncontrados) {
              setResultado({
                materialesEnGastosReales: errorData.materialesEnGastosReales,
                materialesNoEncontrados: errorData.materialesNoEncontrados,
                sugerencias: errorData.sugerencias
              });
            }
            return;
          } catch {
            // No es JSON, usar el texto directamente
            throw new Error(`Error ${response.status}: ${errorText}`);
          }
        } catch (parseError) {
          setError(`Error ${response.status}: No se pudo leer la respuesta del servidor`);
          return;
        }
      }

      const data = await response.json();
      console.log('📥 [Frontend] Response data:', data);

      if (!response.ok) {
        // Guardar sugerencias si vienen en el error
        if (data.sugerencias) {
          setResultado({ sugerencias: data.sugerencias });
        }
        // Guardar información adicional del error para mostrar
        if (data.materialesEnGastosRealesLista || data.materialesEnGastosReales) {
          setResultado({ 
            sugerencias: data.sugerencias,
            materialesEnGastosReales: data.materialesEnGastosReales,
            materialesEnGastosRealesLista: data.materialesEnGastosRealesLista,
            materialesNoEncontrados: data.materialesNoEncontrados,
            itemsCount: data.itemsCount,
            materialesEnItems: data.materialesEnItems
          });
        }
        throw new Error(data.error || 'Error al actualizar la cotización');
      }

      // Solo mostrar éxito si realmente se actualizó algo
      if (data.materialesActualizados === 0) {
        setError('No se encontraron materiales para actualizar. Verifica que los nombres coincidan.');
        setResultado({
          materialesEnGastosReales: data.materialesEnGastosReales,
          materialesEnGastosRealesLista: data.materiales?.map((m: any) => m.nombre) || [],
          materialesActualizados: 0
        });
      } else {
        setResultado(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      // Si el error es 404, puede ser que el servidor no esté corriendo
      if (err.message?.includes('Failed to fetch') || err.message?.includes('404')) {
        setError('Error de conexión. Verifica que el servidor esté corriendo (npm run dev)');
      }
    } finally {
      setCargando(false);
    }
  };

  const handleCorregirTotal = async () => {
    const numeroLimpio = numeroCotizacion.trim().toUpperCase();
    
    if (!numeroLimpio) {
      setError('Por favor ingresa un número de cotización');
      return;
    }

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch('/api/corregir-total-cotizacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numeroCotizacion: numeroLimpio }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al corregir el total');
      }

      setResultado({
        ...data,
        tipo: 'correccion_total'
      });
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🔄 Actualizar Cotización desde Costos Reales
        </h1>
        
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>⚠️ Si el total de la cotización está incorrecto:</strong>
          </p>
          <button
            onClick={handleCorregirTotal}
            disabled={cargando || !numeroCotizacion.trim()}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 text-sm"
          >
            🔧 Corregir Solo el Total (sin modificar items)
          </button>
          <p className="text-xs text-yellow-700 mt-2">
            Esto recalcula el total desde el precio_total de los items y actualiza solo subtotal, IVA y total.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Cotización
            </label>
            <input
              type="text"
              value={numeroCotizacion}
              onChange={(e) => setNumeroCotizacion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: kub-1001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingresa el número de la cotización que deseas actualizar con los materiales registrados en costos reales.
            </p>
            {cotizacionesDisponibles.length > 0 && (
              <div className="mt-2">
                <details className="text-xs">
                  <summary className="text-indigo-600 hover:text-indigo-800 cursor-pointer">
                    Ver cotizaciones disponibles ({cotizacionesDisponibles.length})
                  </summary>
                  <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="grid grid-cols-3 gap-2">
                      {cotizacionesDisponibles.map((num, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setNumeroCotizacion(num);
                            setError(null);
                            setResultado(null);
                          }}
                          className="text-left text-xs px-2 py-1 bg-white hover:bg-indigo-50 rounded border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>

          <button
            onClick={handleActualizar}
            disabled={cargando || !numeroCotizacion.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {cargando ? '⏳ Actualizando...' : '🔄 Actualizar Cotización'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">❌ Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              {resultado?.sugerencias && resultado.sugerencias.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-red-700 text-sm font-medium mb-2">¿Quisiste decir?</p>
                  <ul className="space-y-1">
                    {resultado.sugerencias.map((sug: string, idx: number) => (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            setNumeroCotizacion(sug);
                            setError(null);
                            setResultado(null);
                          }}
                          className="text-red-600 hover:text-red-800 underline text-sm"
                        >
                          {sug}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resultado?.materialesEnGastosRealesLista && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-red-700 text-sm font-medium mb-2">
                    Materiales encontrados en gastos reales ({resultado.materialesEnGastosReales || 0}):
                  </p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {resultado.materialesEnGastosRealesLista.map((nombre: string, idx: number) => (
                      <li key={idx}>• {nombre}</li>
                    ))}
                  </ul>
                  <p className="text-red-700 text-xs mt-2">
                    Estos materiales están registrados en gastos reales pero no se encontraron en los items de la cotización.
                    Verifica que los nombres coincidan exactamente.
                  </p>
                </div>
              )}
            </div>
          )}

          {resultado && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                {resultado.tipo === 'correccion_total' ? '✅ Total Corregido' : '✅ Actualización Exitosa'}
              </p>
              <div className="mt-3 space-y-2 text-sm">
                {resultado.tipo === 'correccion_total' ? (
                  <>
                    <p className="text-gray-700">
                      <strong>Cotización:</strong> {numeroCotizacion}
                    </p>
                    {resultado.totalesAnteriores && resultado.totalesNuevos && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-gray-700 font-medium mb-2">Totales Corregidos:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal anterior:</span>
                            <span className="line-through text-gray-500">${(resultado.totalesAnteriores.subtotal || 0).toLocaleString('es-CO')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal nuevo:</span>
                            <span className="font-semibold text-green-700">${(resultado.totalesNuevos.subtotal || 0).toLocaleString('es-CO')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">IVA anterior:</span>
                            <span className="line-through text-gray-500">${(resultado.totalesAnteriores.iva || 0).toLocaleString('es-CO')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">IVA nuevo:</span>
                            <span className="font-semibold text-green-700">${(resultado.totalesNuevos.iva || 0).toLocaleString('es-CO')}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-green-300">
                            <span className="text-gray-700 font-bold">Total anterior:</span>
                            <span className="line-through text-red-600 font-bold">${(resultado.totalesAnteriores.total || 0).toLocaleString('es-CO')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-bold">Total nuevo:</span>
                            <span className="font-bold text-green-700 text-lg">${(resultado.totalesNuevos.total || 0).toLocaleString('es-CO')}</span>
                          </div>
                        </div>
                        {resultado.items && resultado.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-gray-700 font-medium mb-2 text-xs">Items usados para el cálculo:</p>
                            <div className="space-y-1 text-xs">
                              {resultado.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-gray-600">
                                  <span>{item.nombre} (×{item.cantidad}):</span>
                                  <span>${(item.precio_total || 0).toLocaleString('es-CO')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-gray-700">
                      <strong>Cotización:</strong> {numeroCotizacion}
                    </p>
                    <p className="text-gray-700">
                      <strong>Cantidad del Item:</strong> {resultado.cantidadItem} unidades
                    </p>
                    <p className="text-gray-700">
                      <strong>Items Actualizados:</strong> {resultado.itemsActualizados || 0}
                    </p>
                    <p className="text-gray-700">
                      <strong>Materiales en Gastos Reales:</strong> {resultado.materialesEnGastosReales || 0}
                    </p>
                  </>
                )}
                <p className="text-gray-700">
                  <strong>Materiales Actualizados:</strong> {resultado.materialesActualizados || 0}
                </p>
                {resultado.materialesNoEncontrados && resultado.materialesNoEncontrados.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-xs font-medium mb-1">
                      ⚠️ Materiales no encontrados en items ({resultado.materialesNoEncontrados.length}):
                    </p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {resultado.materialesNoEncontrados.map((nombre: string, idx: number) => (
                        <li key={idx}>• {nombre}</li>
                      ))}
                    </ul>
                    <p className="text-yellow-700 text-xs mt-2">
                      Estos materiales están en gastos reales pero no se encontraron en los items de la cotización. 
                      Verifica que los nombres coincidan exactamente.
                    </p>
                  </div>
                )}
                {resultado.totalCotizado !== undefined && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-gray-700 font-medium mb-2">Comparación Cotizado vs Real:</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Total Cotizado (mantiene original): <span className="font-semibold">${(resultado.totalCotizado || resultado.totales?.total || 0).toLocaleString('es-CO')}</span>
                      </p>
                      {resultado.costoMaterialesReal !== undefined && (
                        <>
                          <p className="text-gray-600">
                            Costo Materiales Real (×{resultado.cantidadItem || 15} unidades): <span className="font-semibold text-blue-600">${(resultado.costoMaterialesReal || 0).toLocaleString('es-CO')}</span>
                          </p>
                          {resultado.utilidadReal !== undefined && (
                            <p className={`text-gray-700 font-bold text-lg ${resultado.utilidadReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Utilidad Real (hasta ahora, solo materiales): ${(resultado.utilidadReal || 0).toLocaleString('es-CO')}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                {resultado.materiales && resultado.materiales.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-gray-700 font-medium mb-2">Materiales Actualizados:</p>
                    <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                      {resultado.materiales.map((mat: any, idx: number) => (
                        <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                          <p className="font-semibold text-gray-900">{mat.nombre || 'Material sin nombre'}</p>
                          <p className="text-gray-600">
                            {mat.cantidad_total !== undefined ? (
                              <>
                                {mat.cantidad_total} {mat.unidad || 'unidad'} × ${(mat.precio_unitario || 0).toLocaleString('es-CO')} = 
                                <span className="font-semibold ml-1">
                                  ${(mat.costo_total || (mat.cantidad_total * (mat.precio_unitario || 0))).toLocaleString('es-CO')}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({mat.cantidad_por_unidad} por unidad × {resultado.cantidadItem || 15})
                                </span>
                              </>
                            ) : (
                              <>
                                {(mat.cantidad_por_unidad || 0)} {mat.unidad || 'unidad'} × ${(mat.precio_unitario || 0).toLocaleString('es-CO')} = 
                                <span className="font-semibold ml-1">
                                  ${((mat.cantidad_por_unidad || 0) * (mat.precio_unitario || 0)).toLocaleString('es-CO')}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resultado.totales && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-gray-700 font-medium mb-2">Totales Cotizados (mantiene original):</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Subtotal: <span className="font-semibold">${(resultado.totales.subtotal || 0).toLocaleString('es-CO')}</span>
                      </p>
                      <p className="text-gray-600">
                        IVA: <span className="font-semibold">${(resultado.totales.iva || 0).toLocaleString('es-CO')}</span>
                      </p>
                      <p className="text-gray-700 font-bold text-lg">
                        Total Cotizado: ${(resultado.totales.total || resultado.totalCotizado || 0).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                )}
                {resultado.costoMaterialesReal !== undefined && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-blue-700 font-medium mb-2">Costos Reales (hasta ahora):</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Costo Materiales Real (×{resultado.cantidadItem || 15} unidades): <span className="font-semibold text-blue-600">${(resultado.costoMaterialesReal || 0).toLocaleString('es-CO')}</span>
                      </p>
                      {resultado.utilidadReal !== undefined && (
                        <p className="text-gray-700 font-bold text-lg">
                          Utilidad Real: <span className={resultado.utilidadReal >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${(resultado.utilidadReal || 0).toLocaleString('es-CO')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ ¿Qué hace esta herramienta?</strong>
          </p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>Busca la cotización por número</li>
            <li>Obtiene los materiales registrados en costos reales</li>
            <li>Calcula la cantidad por unidad dividiendo por la cantidad del item (ej: 15 unidades)</li>
            <li>Actualiza los materiales de la cotización con los valores reales</li>
            <li>Recalcula los totales de la cotización</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

