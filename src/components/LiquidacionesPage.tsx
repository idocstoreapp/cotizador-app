/**
 * Página de Liquidaciones
 * Permite ver el balance de trabajadores/vendedores y realizar pagos
 * Solo accesible para administradores
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { esAdmin } from '../services/auth.service';
import {
  obtenerBalanceTodos,
  obtenerLiquidacionesPorPersona,
  crearLiquidacion,
  calcularBalancePersona
} from '../services/liquidaciones.service';
import { obtenerTrabajadoresPorCotizacion } from '../services/cotizacion-trabajadores.service';
import type { Liquidacion } from '../types/database';

interface BalancePersona {
  persona: {
    id: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    role: string;
    especialidad?: string;
  };
  totalGanado: number;
  totalLiquidado: number;
  balancePendiente: number;
}

interface ModalLiquidarProps {
  persona: BalancePersona['persona'];
  balancePendiente: number;
  onClose: () => void;
  onSuccess: () => void;
}

function ModalLiquidar({ persona, balancePendiente, onClose, onSuccess }: ModalLiquidarProps) {
  const [monto, setMonto] = useState(balancePendiente);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'cheque' | 'otro'>('efectivo');
  const [numeroReferencia, setNumeroReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (monto > balancePendiente) {
      setError('El monto no puede ser mayor al balance pendiente');
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      await crearLiquidacion({
        persona_id: persona.id,
        tipo_persona: persona.role as 'vendedor' | 'trabajador_taller',
        monto,
        metodo_pago: metodoPago,
        numero_referencia: numeroReferencia || undefined,
        notas: notas || undefined
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar liquidación');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Liquidar a {persona.nombre} {persona.apellido}
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Balance pendiente:</span>{' '}
              <span className="text-lg font-bold">${balancePendiente.toLocaleString('es-CO')}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto a liquidar *
              </label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max={balancePendiente}
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de pago *
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de referencia
              </label>
              <input
                type="text"
                value={numeroReferencia}
                onChange={(e) => setNumeroReferencia(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nº de transacción, cheque, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Confirmar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ModalHistorialProps {
  persona: BalancePersona['persona'];
  onClose: () => void;
}

function ModalHistorial({ persona, onClose }: ModalHistorialProps) {
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerLiquidacionesPorPersona(persona.id);
        setLiquidaciones(data);
      } catch (error) {
        console.error('Error al cargar historial:', error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [persona.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Liquidaciones - {persona.nombre} {persona.apellido}
          </h3>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {cargando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : liquidaciones.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay liquidaciones registradas
            </p>
          ) : (
            <div className="space-y-3">
              {liquidaciones.map((liq) => (
                <div
                  key={liq.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-green-600 text-lg">
                        ${liq.monto.toLocaleString('es-CO')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(liq.fecha_liquidacion).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded capitalize">
                      {liq.metodo_pago || 'Sin especificar'}
                    </span>
                  </div>
                  {liq.numero_referencia && (
                    <p className="text-sm text-gray-500 mt-2">
                      Ref: {liq.numero_referencia}
                    </p>
                  )}
                  {liq.notas && (
                    <p className="text-sm text-gray-500 mt-1 italic">
                      {liq.notas}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LiquidacionesPage() {
  const { usuario, cargando: cargandoAuth } = useAuth();
  const [balances, setBalances] = useState<BalancePersona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'vendedor' | 'trabajador_taller'>('todos');
  const [modalLiquidar, setModalLiquidar] = useState<BalancePersona | null>(null);
  const [modalHistorial, setModalHistorial] = useState<BalancePersona['persona'] | null>(null);

  const cargarBalances = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerBalanceTodos();
      setBalances(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar balances');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!cargandoAuth && usuario) {
      cargarBalances();
    }
  }, [cargandoAuth, usuario]);

  if (cargandoAuth) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!esAdmin(usuario)) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
        <p>Solo los administradores pueden acceder a esta sección.</p>
      </div>
    );
  }

  const balancesFiltrados = balances.filter(b => 
    filtroTipo === 'todos' || b.persona.role === filtroTipo
  );

  const totalPendienteVendedores = balances
    .filter(b => b.persona.role === 'vendedor')
    .reduce((sum, b) => sum + b.balancePendiente, 0);

  const totalPendienteTrabajadores = balances
    .filter(b => b.persona.role === 'trabajador_taller')
    .reduce((sum, b) => sum + b.balancePendiente, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liquidaciones</h1>
          <p className="text-gray-600">Gestiona los pagos a vendedores y trabajadores</p>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendiente Vendedores</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totalPendienteVendedores.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendiente Trabajadores</p>
              <p className="text-2xl font-bold text-amber-600">
                ${totalPendienteTrabajadores.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pendiente</p>
              <p className="text-2xl font-bold text-green-600">
                ${(totalPendienteVendedores + totalPendienteTrabajadores).toLocaleString('es-CO')}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroTipo('todos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroTipo === 'todos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({balances.length})
          </button>
          <button
            onClick={() => setFiltroTipo('vendedor')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroTipo === 'vendedor'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vendedores ({balances.filter(b => b.persona.role === 'vendedor').length})
          </button>
          <button
            onClick={() => setFiltroTipo('trabajador_taller')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroTipo === 'trabajador_taller'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Trabajadores ({balances.filter(b => b.persona.role === 'trabajador_taller').length})
          </button>
        </div>
      </div>

      {/* Contenido */}
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      ) : cargando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : balancesFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No hay personal registrado</h3>
          <p className="mt-2 text-gray-500">
            Crea vendedores o trabajadores de taller en la sección de Personal
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Persona
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Ganado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liquidado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendiente
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {balancesFiltrados.map((balance) => (
                  <tr key={balance.persona.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                            balance.persona.role === 'vendedor' ? 'bg-blue-500' : 'bg-amber-500'
                          }`}>
                            {(balance.persona.nombre?.[0] || '?').toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {balance.persona.nombre} {balance.persona.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            {balance.persona.email || balance.persona.especialidad || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        balance.persona.role === 'vendedor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {balance.persona.role === 'vendedor' ? 'Vendedor' : 'Trabajador'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ${balance.totalGanado.toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      ${balance.totalLiquidado.toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-semibold ${
                        balance.balancePendiente > 0 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        ${balance.balancePendiente.toLocaleString('es-CO')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setModalHistorial(balance.persona)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Ver historial"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        {balance.balancePendiente > 0 && (
                          <button
                            onClick={() => setModalLiquidar(balance)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            title="Liquidar"
                          >
                            Liquidar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      {modalLiquidar && (
        <ModalLiquidar
          persona={modalLiquidar.persona}
          balancePendiente={modalLiquidar.balancePendiente}
          onClose={() => setModalLiquidar(null)}
          onSuccess={cargarBalances}
        />
      )}

      {modalHistorial && (
        <ModalHistorial
          persona={modalHistorial}
          onClose={() => setModalHistorial(null)}
        />
      )}
    </div>
  );
}








