/**
 * Caja de ahorros: saldo real disponible (libre de IVA) y depósitos.
 * Lo ahorrado no se usa para pagar gastos fijos ni liquidaciones; todo pago descuenta del disponible.
 */
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import { obtenerSaldoDisponible, type SaldoDisponibleResult } from '../services/saldo-disponible.service';
import { obtenerMovimientosAhorros, depositarAhorros } from '../services/caja-ahorros.service';
import { editarMovimientoAhorros, eliminarMovimientoAhorros } from '../services/caja-ahorros.service';
import type { UserProfile } from '../types/database';
import type { CajaAhorrosMovimiento } from '../types/database';

export default function CajaAhorrosPage() {
  const formatearFechaHoyLocal = (): string => {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
    const [editandoMovimiento, setEditandoMovimiento] = useState<CajaAhorrosMovimiento | null>(null);
    const [montoEdit, setMontoEdit] = useState('');
    const [notaEdit, setNotaEdit] = useState('');
    const [fechaEdit, setFechaEdit] = useState('');
    const [guardandoEdit, setGuardandoEdit] = useState(false);
  const { usuario: usuarioContexto } = useUser();
  const [usuarioLocal, setUsuarioLocal] = useState<UserProfile | null>(null);
  const [saldo, setSaldo] = useState<SaldoDisponibleResult| null>(null);
  const [movimientos, setMovimientos] = useState<CajaAhorrosMovimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModalDeposito, setMostrarModalDeposito] = useState(false);
  const [montoDeposito, setMontoDeposito] = useState<string>('');
  const [notaDeposito, setNotaDeposito] = useState('');
  const [fechaDeposito, setFechaDeposito] = useState<string>(formatearFechaHoyLocal());
  const [guardando, setGuardando] = useState(false);

  const usuario = usuarioContexto || usuarioLocal;
  const esAdmin = usuario?.role === 'admin';

  useEffect(() => {
    if (!usuarioContexto?.id) {
      obtenerUsuarioActual().then(setUsuarioLocal).catch(() => {});
    }
  }, [usuarioContexto?.id]);

  useEffect(() => {
    console.log('SALDO CAJA:', saldo);
  }, [saldo]);

  const recargar = async () => {
    if (!esAdmin) return;
    setCargando(true);
    setError(null);
    try {
      const [saldoData, movs] = await Promise.all([
        obtenerSaldoDisponible(),
        obtenerMovimientosAhorros()
      ]);
      setSaldo(saldoData);
      setMovimientos(movs);
    } catch (e: any) {
      console.error('[CajaAhorros] Error real:', e);
setError(typeof e === 'string' ? e : (e?.message || JSON.stringify(e)));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (esAdmin) recargar();
    else setCargando(false);
  }, [esAdmin]);

  const handleDepositar = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoDeposito.replace(/,/g, '.').replace(/\s/g, ''));
    if (isNaN(monto) || monto <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }
    if (saldo && monto > saldo.disponibleParaGastar) {
      setError(`No puedes ahorrar más de lo disponible ($${saldo.disponibleParaGastar.toLocaleString('es-CO')}).`);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await depositarAhorros({ 
        monto, 
        fecha: fechaDeposito,
        nota: notaDeposito.trim() || undefined,
        created_by: usuario?.id || undefined // Registrar quién hizo el depósito
      });
      setMostrarModalDeposito(false);
      setMontoDeposito('');
      setNotaDeposito('');
      setFechaDeposito(formatearFechaHoyLocal());
      await recargar();
    } catch (e: any) {
      setError(e.message || 'Error al registrar depósito');
    } finally {
      setGuardando(false);
    }
  };

  const aplicarOpcion = (opcion: 'todo' | 'mitad') => {
    if (!saldo) return;
    if (opcion === 'todo') setMontoDeposito(String(Math.max(0, saldo.disponibleParaGastar)));
    if (opcion === 'mitad') setMontoDeposito(String(Math.max(0, Math.floor(saldo.disponibleParaGastar / 2))));
  };

  if (!usuario) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-600 font-medium">Solo administradores pueden acceder a la Caja de Ahorros.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja de Ahorros</h1>
          <p className="text-gray-600 mt-1">
            Saldo real libre de IVA. Lo que ingreses aquí no se usa para pagar gastos ni liquidaciones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMostrarModalDeposito(true);
            setError(null);
            setMontoDeposito('');
            setNotaDeposito('');
            setFechaDeposito(formatearFechaHoyLocal());
          }}
          disabled={cargando || (saldo !== null && saldo.disponibleParaGastar <= 0)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Ingresar a ahorros
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : saldo ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-500 rounded-xl border-l-4 border-green-300 p-5 shadow-md">
              <p className="text-sm font-medium text-gray-100">Dinero real en caja (antes de ahorro)</p>
              <p className={`text-2xl font-bold mt-1 ${saldo.saldoRealDisponible >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                ${saldo.saldoRealDisponible.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-gray-100 mt-1">Cobrado − costos (incl. IVA) − liquidaciones − gastos fijos (todavía sin restar ahorros)</p>
            </div>
            <div className="bg-gray-500 rounded-xl border-l-4 border-indigo-300 p-5 shadow-md">
              <p className="text-sm font-medium text-gray-100">En caja de ahorros</p>
              <p className="text-2xl font-bold text-indigo-200 mt-1">
                ${saldo.totalAhorros.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-gray-100 mt-1">No se usa para pagos</p>
            </div>
            <div className="bg-gray-500 rounded-xl border-l-4 border-amber-300 p-5 shadow-md">
              <p className="text-sm font-medium text-gray-100">Dinero real disponible (después de ahorro)</p>
              <p className={`text-2xl font-bold mt-1 ${saldo.disponibleParaGastar >= 0 ? 'text-amber-200' : 'text-red-200'}`}>
                ${saldo.disponibleParaGastar.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-gray-100 mt-1">Aquí ya se descontó la caja de ahorros. De este monto salen pagos y gastos.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">📜 Historial de Movimientos</h2>
              <p className="text-xs text-gray-500 mt-1">Todos los depósitos registrados con fecha y detalles</p>
            </div>
            {movimientos.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">Aún no hay depósitos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">📅 Fecha</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">💰 Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">📝 Nota</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acumulado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movimientos.map((m, index) => {
                      // La tabla está ordenada por fecha DESC; para mostrar acumulado correcto
                      // a la fecha del movimiento, sumar desde ese movimiento hacia los más antiguos.
                      const acumulado = movimientos.slice(index).reduce((sum, mov) => sum + Number(mov.monto), 0);
                      return (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {new Date(m.fecha).toLocaleDateString('es-CO', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit' 
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-indigo-600 text-right">
                            +${Number(m.monto).toLocaleString('es-CO')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {m.nota ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                                {m.nota}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            ${acumulado.toLocaleString('es-CO')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              className="text-xs text-blue-600 hover:underline mr-2"
                              onClick={() => {
                                setEditandoMovimiento(m);
                                setMontoEdit(String(m.monto));
                                setNotaEdit(m.nota || '');
                                setFechaEdit(m.fecha);
                                setError(null);
                              }}
                              disabled={guardando || guardandoEdit}
                            >Editar</button>
                            <button
                              className="text-xs text-red-600 hover:underline"
                              onClick={async () => {
                                if (!window.confirm('¿Eliminar este movimiento?')) return;
                                setGuardando(true);
                                try {
                                  await eliminarMovimientoAhorros(m.id);
                                  await recargar();
                                } catch (e: any) {
                                  setError(e.message || 'Error al eliminar');
                                } finally {
                                  setGuardando(false);
                                }
                              }}
                              disabled={guardando || guardandoEdit}
                            >Eliminar</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {mostrarModalDeposito && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresar a caja de ahorros</h3>
            <p className="text-sm text-gray-600 mb-4">
              Disponible para gastar: <strong>${saldo?.disponibleParaGastar.toLocaleString('es-CO') ?? 0}</strong>. No podrás usar lo ahorrado para pagos.
            </p>
            <form onSubmit={handleDepositar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={montoDeposito}
                  onChange={(e) => setMontoDeposito(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => aplicarOpcion('mitad')} className="text-sm text-indigo-600 hover:underline">
                    Mitad
                  </button>
                  <button type="button" onClick={() => aplicarOpcion('todo')} className="text-sm text-indigo-600 hover:underline">
                    Todo
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del movimiento</label>
                <input
                  type="date"
                  value={fechaDeposito}
                  onChange={(e) => setFechaDeposito(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  max={formatearFechaHoyLocal()}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  value={notaDeposito}
                  onChange={(e) => setNotaDeposito(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: ahorro mes marzo"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setMostrarModalDeposito(false); setError(null); }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !montoDeposito.trim()}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {guardando ? 'Guardando...' : 'Depositar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar movimiento */}
      {editandoMovimiento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar movimiento</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setGuardandoEdit(true);
                setError(null);
                try {
                  const monto = parseFloat(montoEdit.replace(/,/g, '.').replace(/\s/g, ''));
                  if (isNaN(monto) || monto <= 0) throw new Error('Ingresa un monto válido.');
                  if (!fechaEdit) throw new Error('Ingresa una fecha válida.');
                  await editarMovimientoAhorros(editandoMovimiento.id, { monto, nota: notaEdit, fecha: fechaEdit });
                  setEditandoMovimiento(null);
                  await recargar();
                } catch (e: any) {
                  setError(e.message || 'Error al editar');
                } finally {
                  setGuardandoEdit(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={montoEdit}
                  onChange={(e) => setMontoEdit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={fechaEdit}
                  onChange={(e) => setFechaEdit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  max={formatearFechaHoyLocal()}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  value={notaEdit}
                  onChange={(e) => setNotaEdit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditandoMovimiento(null)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdit || !montoEdit.trim()}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
