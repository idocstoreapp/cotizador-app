/**
 * Modal para asignar trabajadores de taller y definir pagos al aceptar una cotización
 */
import { useState, useEffect } from 'react';
import { obtenerTrabajadoresTaller } from '../../services/usuarios.service';
import type { UserProfile } from '../../types/database';

interface TrabajadorAsignado {
  trabajadorId: string;
  pagoTrabajador: number;
  notas?: string;
}

interface AsignarTrabajadoresModalProps {
  cotizacionId: string;
  pagoVendedor: number;
  onConfirmar: (
    pagoVendedor: number,
    trabajadores: TrabajadorAsignado[]
  ) => void;
  onCancelar: () => void;
}

export default function AsignarTrabajadoresModal({
  cotizacionId,
  pagoVendedor: pagoVendedorInicial,
  onConfirmar,
  onCancelar
}: AsignarTrabajadoresModalProps) {
  const [trabajadores, setTrabajadores] = useState<UserProfile[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pagoVendedor, setPagoVendedor] = useState(pagoVendedorInicial);
  const [trabajadoresSeleccionados, setTrabajadoresSeleccionados] = useState<
    Map<string, { pago: number; notas: string }>
  >(new Map());

  useEffect(() => {
    const cargarTrabajadores = async () => {
      try {
        setCargando(true);
        const trabajadoresData = await obtenerTrabajadoresTaller();
        setTrabajadores(trabajadoresData);
      } catch (error) {
        console.error('Error al cargar trabajadores:', error);
        alert('Error al cargar trabajadores de taller');
      } finally {
        setCargando(false);
      }
    };
    cargarTrabajadores();
  }, []);

  const toggleTrabajador = (trabajadorId: string) => {
    const nuevoMap = new Map(trabajadoresSeleccionados);
    if (nuevoMap.has(trabajadorId)) {
      nuevoMap.delete(trabajadorId);
    } else {
      nuevoMap.set(trabajadorId, { pago: 0, notas: '' });
    }
    setTrabajadoresSeleccionados(nuevoMap);
  };

  const actualizarPagoTrabajador = (trabajadorId: string, pago: number) => {
    const nuevoMap = new Map(trabajadoresSeleccionados);
    const actual = nuevoMap.get(trabajadorId);
    if (actual) {
      nuevoMap.set(trabajadorId, { ...actual, pago });
    }
    setTrabajadoresSeleccionados(nuevoMap);
  };

  const actualizarNotasTrabajador = (trabajadorId: string, notas: string) => {
    const nuevoMap = new Map(trabajadoresSeleccionados);
    const actual = nuevoMap.get(trabajadorId);
    if (actual) {
      nuevoMap.set(trabajadorId, { ...actual, notas });
    }
    setTrabajadoresSeleccionados(nuevoMap);
  };

  const handleConfirmar = () => {
    const trabajadoresArray: TrabajadorAsignado[] = Array.from(
      trabajadoresSeleccionados.entries()
    ).map(([trabajadorId, datos]) => ({
      trabajadorId,
      pagoTrabajador: datos.pago,
      notas: datos.notas || undefined
    }));

    onConfirmar(pagoVendedor, trabajadoresArray);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Asignar Trabajadores y Pagos
          </h2>
          <button
            onClick={onCancelar}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pago del vendedor */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pago del Vendedor (CLP)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pagoVendedor}
              onChange={(e) => setPagoVendedor(Number(e.target.value))}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>

          {/* Lista de trabajadores */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Trabajadores de Taller
            </h3>
            {cargando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando trabajadores...</p>
              </div>
            ) : trabajadores.length === 0 ? (
              <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-gray-600">
                  No hay trabajadores de taller registrados
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Un administrador debe crear trabajadores de taller primero
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {trabajadores.map((trabajador) => {
                  const estaSeleccionado = trabajadoresSeleccionados.has(
                    trabajador.id
                  );
                  const datos = trabajadoresSeleccionados.get(trabajador.id);

                  return (
                    <div
                      key={trabajador.id}
                      className={`border rounded-lg p-4 ${
                        estaSeleccionado
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={() => toggleTrabajador(trabajador.id)}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {trabajador.nombre || ''} {trabajador.apellido || ''} {!trabajador.nombre && !trabajador.apellido ? (trabajador.email || 'Sin nombre') : ''}
                              </p>
                              {trabajador.especialidad && (
                                <p className="text-sm text-gray-500">
                                  {trabajador.especialidad}
                                </p>
                              )}
                            </div>
                          </div>
                          {estaSeleccionado && (
                            <div className="space-y-2 mt-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Pago (CLP)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={datos?.pago || 0}
                                  onChange={(e) =>
                                    actualizarPagoTrabajador(
                                      trabajador.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Notas (opcional)
                                </label>
                                <textarea
                                  value={datos?.notas || ''}
                                  onChange={(e) =>
                                    actualizarNotasTrabajador(
                                      trabajador.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                  rows={2}
                                  placeholder="Notas sobre este trabajador..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Aceptar Cotización
          </button>
        </div>
      </div>
    </div>
  );
}

