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

    try {
      const response = await fetch('/api/actualizar-cotizacion-costos-reales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numeroCotizacion: numeroLimpio }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Guardar sugerencias si vienen en el error
        if (data.sugerencias) {
          setResultado({ sugerencias: data.sugerencias });
        }
        throw new Error(data.error || 'Error al actualizar la cotización');
      }

      setResultado(data);
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
            </div>
          )}

          {resultado && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✅ Actualización Exitosa</p>
              <div className="mt-3 space-y-2 text-sm">
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
                  <strong>Materiales Actualizados:</strong> {resultado.materialesActualizados || 0}
                </p>
                {resultado.totalAnterior !== undefined && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-gray-700 font-medium mb-2">Comparación de Totales:</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Total Anterior: <span className="font-semibold line-through">${resultado.totalAnterior.toLocaleString('es-CO')}</span>
                      </p>
                      <p className="text-gray-700 font-bold text-lg">
                        Total Nuevo: ${resultado.totales?.total.toLocaleString('es-CO')}
                      </p>
                      <p className={`font-semibold ${(resultado.totales?.total - resultado.totalAnterior) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Diferencia: {((resultado.totales?.total - resultado.totalAnterior) >= 0 ? '+' : '')}
                        ${(resultado.totales?.total - resultado.totalAnterior).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                )}
                {resultado.materiales && resultado.materiales.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-gray-700 font-medium mb-2">Materiales Actualizados:</p>
                    <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                      {resultado.materiales.map((mat: any, idx: number) => (
                        <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                          <p className="font-semibold text-gray-900">{mat.nombre}</p>
                          <p className="text-gray-600">
                            {mat.cantidad_por_unidad} {mat.unidad} × ${mat.precio_unitario.toLocaleString('es-CO')} = 
                            <span className="font-semibold ml-1">
                              ${(mat.cantidad_por_unidad * mat.precio_unitario).toLocaleString('es-CO')}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resultado.totales && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-gray-700 font-medium mb-2">Nuevos Totales:</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Subtotal: <span className="font-semibold">${resultado.totales.subtotal.toLocaleString('es-CO')}</span>
                      </p>
                      <p className="text-gray-600">
                        Descuento: <span className="font-semibold">${resultado.totales.descuento.toLocaleString('es-CO')}</span>
                      </p>
                      <p className="text-gray-600">
                        IVA: <span className="font-semibold">${resultado.totales.iva.toLocaleString('es-CO')}</span>
                      </p>
                      <p className="text-gray-700 font-bold text-lg">
                        Total: ${resultado.totales.total.toLocaleString('es-CO')}
                      </p>
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

