/**
 * Página de gestión de clientes
 * Muestra todos los clientes con su historial de trabajos
 */
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerUsuarioActual } from '../services/auth.service';
import { obtenerClientes, obtenerClienteConTrabajos } from '../services/clientes.service';
import { obtenerCotizacionesPorCliente } from '../services/cotizaciones.service';
import { obtenerPagosPorCotizacion, agregarPagoCotizacion, asegurarHistorialPagos, actualizarFechaPagoCotizacion, actualizarMontoPagoCotizacion, eliminarPagoCotizacion } from '../services/cotizacion-pagos.service';
import { downloadQuotePDF } from '../utils/pdf';
import { convertirCotizacionAPDF } from '../utils/convertirCotizacionAPDF';
import EditarCotizacionModal from './EditarCotizacionModal';
import type { Cliente, Cotizacion } from '../types/database';
import type { CotizacionPago } from '../types/database';

export default function ClientesPage() {
  const contextoUsuario = useUser();
  const [usuarioLocal, setUsuarioLocal] = useState<any>(null);
  const [clientes, setClientes] = useState<(Cliente & { trabajos?: any[] })[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [trabajosCliente, setTrabajosCliente] = useState<any[]>([]);
  const [cotizacionesCliente, setCotizacionesCliente] = useState<Cotizacion[]>([]);
  const [cotizacionEditando, setCotizacionEditando] = useState<Cotizacion | null>(null);
  const [cotizacionEditandoPago, setCotizacionEditandoPago] = useState<Cotizacion | null>(null);
  const [pagosCotizacionModal, setPagosCotizacionModal] = useState<CotizacionPago[]>([]);
  const [nuevoPagoMonto, setNuevoPagoMonto] = useState<string>('');
  const [nuevoPagoFecha, setNuevoPagoFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [nuevoPagoNota, setNuevoPagoNota] = useState('');
  const [guardandoPago, setGuardandoPago] = useState(false);

  // Usar usuario del contexto o cargar directamente
  const usuario = contextoUsuario.usuario || usuarioLocal;
  const esAdmin = usuario?.role === 'admin' || false;

  // Cargar usuario directamente si no está en contexto
  useEffect(() => {
    const cargarUsuario = async () => {
      if (contextoUsuario.usuario?.id) {
        setUsuarioLocal(null);
        return;
      }
      try {
        const usuarioDirecto = await obtenerUsuarioActual();
        if (usuarioDirecto) {
          setUsuarioLocal(usuarioDirecto);
        }
      } catch (err: any) {
        setError('Error al cargar usuario: ' + (err.message || 'Error desconocido'));
        setCargando(false);
      }
    };
    cargarUsuario();
  }, [contextoUsuario.usuario?.id]);

  // Cargar clientes
  useEffect(() => {
    if (!usuario?.id || !esAdmin) {
      setCargando(false);
      return;
    }

    const cargarClientes = async () => {
      try {
        setCargando(true);
        setError(null);
        const resultado = await obtenerClientes();
        setClientes(resultado);
        setCargando(false);
      } catch (err: any) {
        setError(err.message || 'Error al cargar clientes');
        setCargando(false);
      }
    };

    cargarClientes();
  }, [usuario?.id, esAdmin]);

  // Cargar trabajos del cliente seleccionado
  const cargarTrabajosCliente = async (clienteId: string) => {
    try {
      const clienteConTrabajos = await obtenerClienteConTrabajos(clienteId);
      if (clienteConTrabajos) {
        setTrabajosCliente(clienteConTrabajos.trabajos || []);
      }
    } catch (err: any) {
      console.error('Error al cargar trabajos:', err);
      setTrabajosCliente([]);
    }
  };

  // Cargar cotizaciones del cliente
  const cargarCotizacionesCliente = async (cliente: Cliente) => {
    try {
      const cotizaciones = await obtenerCotizacionesPorCliente(
        cliente.nombre,
        cliente.email || undefined
      );
      setCotizacionesCliente(cotizaciones);
    } catch (err: any) {
      console.error('Error al cargar cotizaciones:', err);
      setCotizacionesCliente([]);
    }
  };

  const verDetalles = async (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setMostrarModalDetalles(true);
    await cargarTrabajosCliente(cliente.id);
    await cargarCotizacionesCliente(cliente);
  };

  // Al abrir el modal de pago, cargar historial (y migrar si hay monto_pagado sin registros)
  useEffect(() => {
    if (!cotizacionEditandoPago) {
      setPagosCotizacionModal([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        let pagos = await obtenerPagosPorCotizacion(cotizacionEditandoPago.id);
        const montoActual = cotizacionEditandoPago.monto_pagado || 0;
        if (pagos.length === 0 && montoActual > 0) {
          await asegurarHistorialPagos(
            cotizacionEditandoPago.id,
            montoActual,
            cotizacionEditandoPago.updated_at?.slice(0, 10) || new Date().toISOString().split('T')[0]
          );
          if (!cancelled) pagos = await obtenerPagosPorCotizacion(cotizacionEditandoPago.id);
        }
        if (!cancelled) setPagosCotizacionModal(pagos);
        setNuevoPagoMonto('');
        setNuevoPagoFecha(new Date().toISOString().split('T')[0]);
        setNuevoPagoNota('');
      } catch (e) {
        if (!cancelled) setPagosCotizacionModal([]);
      }
    })();
    return () => { cancelled = true; };
  }, [cotizacionEditandoPago?.id]);

  // Generar PDF de cotización
  const generarPDF = async (cotizacion: Cotizacion) => {
    try {
      const datosPDF = convertirCotizacionAPDF(cotizacion);
      await downloadQuotePDF(datosPDF);
    } catch (error: any) {
      alert('Error al generar PDF: ' + (error.message || 'Error desconocido'));
    }
  };

  // Agregar pago (parcial o total) con fecha; actualiza historial y monto_pagado
  const agregarPago = async (cotizacion: Cotizacion, monto: number, fechaPago: string, nota?: string) => {
    try {
      const total = cotizacion.total || 0;
      const { montoPagadoTotal, estadoPago } = await agregarPagoCotizacion(cotizacion.id, monto, fechaPago, nota, total);
      setCotizacionEditandoPago(prev => prev && prev.id === cotizacion.id ? { ...prev, monto_pagado: montoPagadoTotal, estado_pago: estadoPago } : prev);
      const pagos = await obtenerPagosPorCotizacion(cotizacion.id);
      setPagosCotizacionModal(pagos);
      if (clienteSeleccionado) {
        await cargarCotizacionesCliente(clienteSeleccionado);
        await cargarTrabajosCliente(clienteSeleccionado.id);
      }
      alert('✅ Pago registrado correctamente');
    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      alert('Error al registrar pago: ' + (error.message || 'Error desconocido'));
    }
  };

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">No tienes permisos para ver esta página</p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-1">Gestiona todos los clientes de la empresa</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total de clientes</div>
            <div className="text-2xl font-bold text-indigo-600">{clientes.length}</div>
          </div>
        </div>

        {/* Tabla de clientes */}
        {clientes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No hay clientes registrados</p>
            <p className="text-gray-400 text-sm">
              Los clientes se crearán automáticamente cuando una cotización sea aceptada
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cliente.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cliente.telefono || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{cliente.direccion || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(cliente.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => verDetalles(cliente)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalles del Cliente */}
      {mostrarModalDetalles && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Historial de {clienteSeleccionado.nombre}</h2>
              <button
                onClick={() => {
                  setMostrarModalDetalles(false);
                  setClienteSeleccionado(null);
                  setTrabajosCliente([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Información del Cliente */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nombre:</span>
                    <span className="ml-2 text-gray-900">{clienteSeleccionado.nombre}</span>
                  </div>
                  {clienteSeleccionado.email && (
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">{clienteSeleccionado.email}</span>
                    </div>
                  )}
                  {clienteSeleccionado.telefono && (
                    <div>
                      <span className="font-medium text-gray-700">Teléfono:</span>
                      <span className="ml-2 text-gray-900">{clienteSeleccionado.telefono}</span>
                    </div>
                  )}
                  {clienteSeleccionado.direccion && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Dirección:</span>
                      <span className="ml-2 text-gray-900">{clienteSeleccionado.direccion}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Cliente desde:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(clienteSeleccionado.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial de Cotizaciones */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Cotizaciones ({cotizacionesCliente.length})
                </h3>
                {cotizacionesCliente.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Este cliente aún no tiene cotizaciones</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {cotizacionesCliente.map((cotizacion: Cotizacion) => {
                      // Calcular estado de pago automáticamente si no está definido
                      const montoPagado = cotizacion.monto_pagado || 0;
                      const total = cotizacion.total || 0;
                      let estadoPagoCalculado: 'no_pagado' | 'pago_parcial' | 'pagado' = cotizacion.estado_pago || 'no_pagado';
                      
                      if (cotizacion.estado === 'aceptada') {
                        if (montoPagado >= total) {
                          estadoPagoCalculado = 'pagado';
                        } else if (montoPagado > 0) {
                          estadoPagoCalculado = 'pago_parcial';
                        } else {
                          estadoPagoCalculado = 'no_pagado';
                        }
                      }

                      return (
                        <div key={cotizacion.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {cotizacion.numero}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(cotizacion.created_at).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  cotizacion.estado === 'aceptada'
                                    ? 'bg-green-100 text-green-800'
                                    : cotizacion.estado === 'rechazada'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {cotizacion.estado === 'aceptada'
                                  ? 'Aceptada'
                                  : cotizacion.estado === 'rechazada'
                                  ? 'Rechazada'
                                  : 'Pendiente'}
                              </span>
                              {cotizacion.estado === 'aceptada' && (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    estadoPagoCalculado === 'pagado'
                                      ? 'bg-blue-100 text-blue-800'
                                      : estadoPagoCalculado === 'pago_parcial'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {estadoPagoCalculado === 'pagado'
                                    ? 'Pagado'
                                    : estadoPagoCalculado === 'pago_parcial'
                                    ? 'Pago Parcial'
                                    : 'No Pagado'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Total:</span>
                              <span className="ml-2 font-semibold text-gray-900">
                                ${cotizacion.total?.toLocaleString('es-CO') || '0'}
                              </span>
                            </div>
                            {cotizacion.estado === 'aceptada' && (
                              <>
                                <div>
                                  <span className="font-medium">Pagado:</span>
                                  <span className="ml-2 font-semibold text-gray-900">
                                    ${montoPagado.toLocaleString('es-CO')} / ${total.toLocaleString('es-CO')}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <span className="font-medium">Resta por cobrar:</span>
                                  <span className="ml-2 font-semibold text-red-600">
                                    ${(total - montoPagado).toLocaleString('es-CO')}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => generarPDF(cotizacion)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              PDF
                            </button>
                            <button
                              onClick={() => setCotizacionEditando(cotizacion)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                            {cotizacion.estado === 'aceptada' && (
                              <button
                                onClick={() => setCotizacionEditandoPago(cotizacion)}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Pagos / Historial
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Historial de Trabajos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Trabajos Realizados ({trabajosCliente.length})
                </h3>
                {trabajosCliente.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Este cliente aún no tiene trabajos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trabajosCliente.map((trabajo: any) => (
                      <div key={trabajo.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Trabajo #{trabajo.id.slice(0, 8)}
                            </h4>
                            {trabajo.cotizacion && (
                              <div className="mt-1">
                                <p className="text-sm text-gray-600">
                                  Cotización: {trabajo.cotizacion.numero}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Estado: <span className={`font-semibold ${
                                    trabajo.cotizacion.estado === 'aceptada' ? 'text-green-600' :
                                    trabajo.cotizacion.estado === 'rechazada' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>
                                    {trabajo.cotizacion.estado === 'aceptada' ? 'Aceptada' :
                                     trabajo.cotizacion.estado === 'rechazada' ? 'Rechazada' :
                                     'Pendiente'}
                                  </span>
                                  {trabajo.cotizacion.estado === 'aceptada' && trabajo.cotizacion.estado_pago && (
                                    <span className="ml-2 text-gray-500">
                                      | Pago: <span className={`font-semibold ${
                                        trabajo.cotizacion.estado_pago === 'pagado' ? 'text-blue-600' :
                                        trabajo.cotizacion.estado_pago === 'pago_parcial' ? 'text-orange-600' :
                                        'text-gray-600'
                                      }`}>
                                        {trabajo.cotizacion.estado_pago === 'pagado' ? 'Pagado' :
                                         trabajo.cotizacion.estado_pago === 'pago_parcial' ? 'Pago Parcial' :
                                         'No Pagado'}
                                      </span>
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              trabajo.estado === 'completado'
                                ? 'bg-green-100 text-green-800'
                                : trabajo.estado === 'en_proceso'
                                ? 'bg-blue-100 text-blue-800'
                                : trabajo.estado === 'cancelado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {trabajo.estado === 'completado'
                              ? 'Completado'
                              : trabajo.estado === 'en_proceso'
                              ? 'En Proceso'
                              : trabajo.estado === 'cancelado'
                              ? 'Cancelado'
                              : 'Pendiente'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Fecha de inicio:</span>
                            <span className="ml-2">
                              {trabajo.fecha_inicio
                                ? new Date(trabajo.fecha_inicio).toLocaleDateString('es-ES')
                                : 'No iniciado'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Fecha fin estimada:</span>
                            <span className="ml-2">
                              {trabajo.fecha_fin_estimada
                                ? new Date(trabajo.fecha_fin_estimada).toLocaleDateString('es-ES')
                                : 'No definida'}
                            </span>
                          </div>
                          {trabajo.cotizacion && (
                            <div className="col-span-2">
                              <span className="font-medium">Total cotización:</span>
                              <span className="ml-2 font-semibold text-gray-900">
                                ${trabajo.cotizacion.total?.toLocaleString('es-CO') || '0'}
                              </span>
                            </div>
                          )}
                        </div>
                        {trabajo.empleados_asignados && trabajo.empleados_asignados.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-700">Empleados asignados: </span>
                            <span className="text-sm text-gray-600">
                              {trabajo.empleados_asignados.length} empleado(s)
                            </span>
                          </div>
                        )}
                        {trabajo.notas && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">{trabajo.notas}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200 px-6 pb-6">
              <button
                onClick={() => {
                  setMostrarModalDetalles(false);
                  setClienteSeleccionado(null);
                  setTrabajosCliente([]);
                  setCotizacionesCliente([]);
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar cotización */}
      {cotizacionEditando && (
        <EditarCotizacionModal
          cotizacion={cotizacionEditando}
          usuarioId={usuario?.id || ''}
          onClose={() => {
            setCotizacionEditando(null);
            if (clienteSeleccionado) {
              cargarCotizacionesCliente(clienteSeleccionado);
            }
          }}
          onSuccess={() => {
            setCotizacionEditando(null);
            if (clienteSeleccionado) {
              cargarCotizacionesCliente(clienteSeleccionado);
            }
          }}
        />
      )}

      {/* Modal de pagos: historial + agregar pago (fecha y monto) */}
      {cotizacionEditandoPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Pagos – {cotizacionEditandoPago.numero}</h2>
              <button
                onClick={() => { setCotizacionEditandoPago(null); setPagosCotizacionModal([]); }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Total cotización:</span>
                  <span className="ml-2 font-semibold">${(cotizacionEditandoPago.total || 0).toLocaleString('es-CO')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total pagado:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    ${(cotizacionEditandoPago.monto_pagado ?? pagosCotizacionModal.reduce((s, p) => s + Number(p.monto), 0)).toLocaleString('es-CO')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Resta por cobrar:</span>
                  <span className="ml-2 font-bold text-red-600">
                    ${((cotizacionEditandoPago.total || 0) - (cotizacionEditandoPago.monto_pagado ?? pagosCotizacionModal.reduce((s, p) => s + Number(p.monto), 0))).toLocaleString('es-CO')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <span className={`ml-2 font-semibold ${
                    cotizacionEditandoPago.estado_pago === 'pagado' ? 'text-blue-600' :
                    cotizacionEditandoPago.estado_pago === 'pago_parcial' ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {cotizacionEditandoPago.estado_pago === 'pagado' ? 'Pagado' :
                     cotizacionEditandoPago.estado_pago === 'pago_parcial' ? 'Pago parcial' : 'No pagado'}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Historial de pagos</h3>
              {pagosCotizacionModal.length === 0 ? (
                <p className="text-gray-500 text-sm mb-4">Aún no hay pagos registrados.</p>
              ) : (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600 font-medium">Fecha</th>
                        <th className="text-right py-2 text-gray-600 font-medium">Monto</th>
                        <th className="text-left py-2 text-gray-600 font-medium">Nota</th>
                {esAdmin && <th className="py-2 text-gray-600 font-medium text-center">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
              {pagosCotizacionModal.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2">
                    {esAdmin ? (
                      <input
                        type="date"
                        defaultValue={p.fecha_pago?.slice(0, 10) || ''}
                        onChange={async (e) => {
                          const nuevaFecha = e.target.value;
                          if (!nuevaFecha) return;
                          try {
                            await actualizarFechaPagoCotizacion(p.id, nuevaFecha);
                            const pagosActualizados = await obtenerPagosPorCotizacion(p.cotizacion_id);
                            setPagosCotizacionModal(pagosActualizados);
                          } catch (err: any) {
                            alert('Error al actualizar fecha de pago: ' + (err.message || 'Error desconocido'));
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                      />
                    ) : (
                      new Date(p.fecha_pago).toLocaleDateString('es-CO')
                    )}
                  </td>
                  <td className="py-2 text-right font-medium text-green-600">+${Number(p.monto).toLocaleString('es-CO')}</td>
                  <td className="py-2 text-gray-500">{p.nota || '—'}</td>
                  {esAdmin && (
                    <td className="py-2 text-center flex gap-2 justify-center">
                      <button
                        onClick={async () => {
                          const nuevoMonto = prompt(`Nuevo monto para este pago (actual: $${Number(p.monto).toLocaleString('es-CO')}):`, String(p.monto));
                          if (!nuevoMonto || isNaN(Number(nuevoMonto))) return;
                          try {
                            const { montoPagadoTotal, estadoPago } = await actualizarMontoPagoCotizacion(p.id, Number(nuevoMonto), p.cotizacion_id, cotizacionEditandoPago.total);
                            setCotizacionEditandoPago(prev => prev && prev.id === p.cotizacion_id ? { ...prev, monto_pagado: montoPagadoTotal, estado_pago: estadoPago } : prev);
                            const pagosActualizados = await obtenerPagosPorCotizacion(p.cotizacion_id);
                            setPagosCotizacionModal(pagosActualizados);
                            // Recargar la cotización en la lista general
                            if (clienteSeleccionado) {
                              await cargarCotizacionesCliente(clienteSeleccionado);
                            }
                          } catch (err: any) {
                            alert('Error al actualizar monto: ' + (err.message || 'Error desconocido'));
                          }
                        }}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded transition"
                        title="Editar monto"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`¿Seguro que quieres eliminar este pago de $${Number(p.monto).toLocaleString('es-CO')}? Esta acción es irreversible.`)) return;
                          try {
                            const { montoPagadoTotal, estadoPago } = await eliminarPagoCotizacion(p.id, p.cotizacion_id, cotizacionEditandoPago.total);
                            setCotizacionEditandoPago(prev => prev && prev.id === p.cotizacion_id ? { ...prev, monto_pagado: montoPagadoTotal, estado_pago: estadoPago } : prev);
                            const pagosActualizados = await obtenerPagosPorCotizacion(p.cotizacion_id);
                            setPagosCotizacionModal(pagosActualizados);
                            // Recargar la cotización en la lista general
                            if (clienteSeleccionado) {
                              await cargarCotizacionesCliente(clienteSeleccionado);
                            }
                          } catch (err: any) {
                            alert('Error al eliminar pago: ' + (err.message || 'Error desconocido'));
                          }
                        }}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition"
                        title="Eliminar pago"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
                    </tbody>
                  </table>
                </div>
              )}
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Agregar pago</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
                  <input
                    type="number"
                    value={nuevoPagoMonto}
                    onChange={(e) => setNuevoPagoMonto(e.target.value)}
                    min="0"
                    step="1000"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha del pago</label>
                  <input
                    type="date"
                    value={nuevoPagoFecha}
                    onChange={(e) => setNuevoPagoFecha(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nota (opcional)</label>
                  <input
                    type="text"
                    value={nuevoPagoNota}
                    onChange={(e) => setNuevoPagoNota(e.target.value)}
                    placeholder="Ej. Abono inicial"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => { setCotizacionEditandoPago(null); setPagosCotizacionModal([]); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
              >
                Cerrar
              </button>
              <button
                disabled={guardandoPago || !nuevoPagoMonto || parseFloat(nuevoPagoMonto) <= 0}
                onClick={async () => {
                  if (!cotizacionEditandoPago) return;
                  const monto = parseFloat(nuevoPagoMonto);
                  if (isNaN(monto) || monto <= 0) return;
                  setGuardandoPago(true);
                  try {
                    await agregarPago(cotizacionEditandoPago, monto, nuevoPagoFecha, nuevoPagoNota.trim() || undefined);
                    setNuevoPagoMonto('');
                    setNuevoPagoFecha(new Date().toISOString().split('T')[0]);
                    setNuevoPagoNota('');
                  } finally {
                    setGuardandoPago(false);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg"
              >
                {guardandoPago ? 'Guardando...' : 'Agregar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

