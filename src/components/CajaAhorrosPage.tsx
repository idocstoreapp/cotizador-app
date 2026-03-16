/**
 * Caja de ahorros: saldo real disponible (libre de IVA) y depósitos.
 * Lo ahorrado no se usa para pagar gastos fijos ni liquidaciones; todo pago descuenta del disponible.
 */
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import { obtenerSaldoDisponible } from '../services/saldo-disponible.service';
import { obtenerMovimientosAhorros, depositarAhorros } from '../services/caja-ahorros.service';
import type { UserProfile } from '../types/database';
import type { SaldoDisponibleResult } from '../services/saldo-disponible.service';
import type { CajaAhorrosMovimiento } from '../types/database';

export default function CajaAhorrosPage() {
  const { usuario: usuarioContexto } = useUser();
  const [usuarioLocal, setUsuarioLocal] = useState<UserProfile | null>(null);
  const [saldo, setSaldo] = useState<SaldoDisponibleResult | null>(null);
  const [movimientos, setMovimientos] = useState<CajaAhorrosMovimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModalDeposito, setMostrarModalDeposito] = useState(false);
  const [montoDeposito, setMontoDeposito] = useState<string>('');
  const [notaDeposito, setNotaDeposito] = useState('');
  const [guardando, setGuardando] = useState(false);

  const usuario = usuarioContexto || usuarioLocal;
  const esAdmin = usuario?.role === 'admin';

  useEffect(() => {
    if (!usuarioContexto?.id) {
      obtenerUsuarioActual().then(setUsuarioLocal).catch(() => {});
    }
  }, [usuarioContexto?.id]);

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
      await depositarAhorros({ monto, nota: notaDeposito.trim() || undefined });
      setMostrarModalDeposito(false);
      setMontoDeposito('');
      setNotaDeposito('');
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
          onClick={() => { setMostrarModalDeposito(true); setError(null); setMontoDeposito(''); setNotaDeposito(''); }}
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
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Saldo real disponible</p>
              <p className={`text-2xl font-bold mt-1 ${saldo.saldoRealDisponible >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${saldo.saldoRealDisponible.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-gray-400 mt-1">Cobrado − costos (incl. IVA) − liquidaciones − gastos fijos</p>
            </div>
            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-5 shadow-sm">
              <p className="text-sm font-medium text-indigo-800">En caja de ahorros</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                ${saldo.totalAhorros.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-indigo-600 mt-1">No se usa para pagos</p>
            </div>
            <div className="bg-white rounded-xl border-2 border-amber-300 p-5 shadow-sm bg-amber-50/30">
              <p className="text-sm font-medium text-amber-800">Disponible para gastar</p>
              <p className={`text-2xl font-bold mt-1 ${saldo.disponibleParaGastar >= 0 ? 'text-amber-700' : 'text-red-600'}`}>
                ${saldo.disponibleParaGastar.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-amber-700 mt-1">De aquí se descuentan gastos fijos y liquidaciones</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
              Movimientos (depósitos a ahorros)
            </h2>
            {movimientos.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">Aún no hay depósitos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(m.fecha).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600 text-right">
                          +${Number(m.monto).toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{m.nota || '—'}</td>
                      </tr>
                    ))}
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
    </div>
  );
}
