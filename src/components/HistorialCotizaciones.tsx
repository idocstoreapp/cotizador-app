/**
 * Página de Historial de Cotizaciones
 * Versión simplificada y directa - carga usuario directamente si no está en contexto
 */
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { obtenerCotizaciones, cambiarEstadoCotizacion } from '../services/cotizaciones.service';
import { obtenerHistorialModificaciones } from '../services/historial-modificaciones.service';
import { obtenerUsuarioActual } from '../services/auth.service';
import { downloadQuotePDF } from '../utils/pdf';
import { convertirCotizacionAPDF } from '../utils/convertirCotizacionAPDF';
import EditarCotizacionModal from './EditarCotizacionModal';
import { EMPRESAS } from '../types/empresas';
import type { Cotizacion, UserProfile, HistorialModificacion } from '../types/database';

/**
 * Calcula el total desde items si están disponibles, sino usa el total guardado
 */
function calcularTotalDesdeItems(cotizacion: Cotizacion): number {
  // Si hay items guardados, calcular desde items (más preciso)
  if (cotizacion.items && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    const subtotal = cotizacion.items.reduce((sum: number, item: any) => {
      return sum + (item.precio_total || 0);
    }, 0);
    
    // Aplicar descuento si existe (asumimos 0% por defecto)
    const descuento = 0; // TODO: obtener descuento de la cotización si está guardado
    const descuentoMonto = subtotal * (descuento / 100);
    const subtotalConDescuento = subtotal - descuentoMonto;
    
    // Calcular IVA (19% por defecto)
    const ivaPorcentaje = 19;
    const iva = subtotalConDescuento * (ivaPorcentaje / 100);
    
    // Total final
    return subtotalConDescuento + iva;
  }
  
  // Fallback: usar total guardado
  return cotizacion.total || 0;
}

export default function HistorialCotizaciones() {
  const contextoUsuario = useUser();
  const [usuarioLocal, setUsuarioLocal] = useState<UserProfile | null>(null);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cotizacionDetalles, setCotizacionDetalles] = useState<Cotizacion | null>(null);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [cotizacionEditando, setCotizacionEditando] = useState<Cotizacion | null>(null);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [historialModificaciones, setHistorialModificaciones] = useState<HistorialModificacion[]>([]);

  // Usar usuario del contexto o cargar directamente
  const usuario = contextoUsuario.usuario || usuarioLocal;
  const esAdmin = usuario?.role === 'admin' || false;

  // Cargar usuario directamente si no está en contexto
  useEffect(() => {
    const cargarUsuario = async () => {
      // Si ya tenemos usuario del contexto, usarlo
      if (contextoUsuario.usuario?.id) {
        console.log('✅ Usuario disponible desde contexto:', contextoUsuario.usuario.email);
        setUsuarioLocal(null);
        return;
      }

      // Si no, cargar directamente desde Supabase
      try {
        console.log('📥 Cargando usuario directamente desde Supabase...');
        const usuarioDirecto = await obtenerUsuarioActual();
        if (usuarioDirecto) {
          console.log('✅ Usuario cargado directamente:', usuarioDirecto.email);
          setUsuarioLocal(usuarioDirecto);
        }
      } catch (err: any) {
        console.error('❌ Error al cargar usuario:', err);
        setError('Error al cargar usuario: ' + (err.message || 'Error desconocido'));
        setCargando(false);
      }
    };

    cargarUsuario();
  }, [contextoUsuario.usuario?.id]);

  // Cargar cotizaciones cuando el usuario esté disponible
  useEffect(() => {
    if (!usuario?.id) {
      console.log('⏳ Esperando usuario...');
      setCargando(true);
      return;
    }

    const cargarCotizaciones = async () => {
      try {
        setCargando(true);
        setError(null);
        console.log('📥 Iniciando carga de cotizaciones...', { 
          esAdmin, 
          usuarioId: usuario.id,
          email: usuario.email 
        });
        
        const resultado = await obtenerCotizaciones(esAdmin ? undefined : usuario.id);
        console.log('✅ Cotizaciones obtenidas exitosamente:', {
          cantidad: resultado.length
        });
        
        setCotizaciones(resultado);
        setCargando(false);
      } catch (err: any) {
        console.error('❌ ERROR al cargar cotizaciones:', {
          message: err.message,
          code: err.code,
          details: err.details
        });
        setError(err.message || 'Error al cargar cotizaciones');
        setCargando(false);
      }
    };

    cargarCotizaciones();
  }, [usuario?.id, esAdmin]);

  // Generar PDF
  const generarPDF = async (cotizacion: Cotizacion) => {
    try {
      const datosPDF = convertirCotizacionAPDF(cotizacion);
      await downloadQuotePDF(datosPDF);
    } catch (error: any) {
      alert('Error al generar PDF: ' + (error.message || 'Error desconocido'));
    }
  };

  // Cambiar estado
  const cambiarEstado = async (cotizacion: Cotizacion, nuevoEstado: string) => {
    try {
      await cambiarEstadoCotizacion(cotizacion.id, nuevoEstado as any);
      // Recargar cotizaciones
      const resultado = await obtenerCotizaciones(esAdmin ? undefined : usuario?.id);
      setCotizaciones(resultado);
    } catch (error: any) {
      alert('Error al cambiar estado: ' + (error.message || 'Error desconocido'));
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

  // Debug: Log del estado
  console.log('📊 HistorialCotizaciones render:', {
    tieneUsuario: !!usuario,
    usuarioId: usuario?.id,
    esAdmin,
    cargando,
    error,
    cotizacionesCount: cotizaciones.length
  });

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cotizaciones...</p>
          <p className="text-xs text-gray-400 mt-2">
            Usuario: {usuario?.email} | Admin: {esAdmin ? 'Sí' : 'No'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Error</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
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
            <h1 className="text-3xl font-bold text-gray-900">
              {esAdmin ? 'Historial de Cotizaciones' : 'Mis Cotizaciones'}
            </h1>
            <p className="text-gray-600 mt-1">
              {esAdmin ? 'Todas las cotizaciones del sistema' : 'Tus cotizaciones'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold text-indigo-600">{cotizaciones.length}</div>
          </div>
        </div>

        {/* Tabla de cotizaciones */}
        {cotizaciones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No hay cotizaciones</p>
            <a
              href="/cotizacion"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mt-4"
            >
              Crear Nueva Cotización
            </a>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  {esAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado por</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cotizaciones.map((cotizacion) => (
                  <tr key={cotizacion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cotizacion.numero}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cotizacion.empresa ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={EMPRESAS[cotizacion.empresa].logo}
                            alt={EMPRESAS[cotizacion.empresa].nombre}
                            className="h-6 w-auto object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="text-sm text-gray-900">{EMPRESAS[cotizacion.empresa].nombre}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cotizacion.cliente_nombre}</div>
                      {cotizacion.cliente_email && (
                        <div className="text-xs text-gray-500">{cotizacion.cliente_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${calcularTotalDesdeItems(cotizacion).toLocaleString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={cotizacion.estado}
                        onChange={(e) => cambiarEstado(cotizacion, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border-0 ${
                          cotizacion.estado === 'aceptada' ? 'bg-green-100 text-green-800' :
                          cotizacion.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="aceptada">Aceptada</option>
                        <option value="rechazada">Rechazada</option>
                      </select>
                    </td>
                    {esAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(cotizacion.usuario as any)?.nombre || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(cotizacion.usuario as any)?.email || 'N/A'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cotizacion.vendedor ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {(cotizacion.vendedor as any)?.nombre || 'N/A'}
                          </div>
                          {cotizacion.pago_vendedor && cotizacion.pago_vendedor > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              ${cotizacion.pago_vendedor.toLocaleString('es-CO')}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Sin vendedor</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(cotizacion.created_at).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(cotizacion.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCotizacionDetalles(cotizacion);
                            setMostrarModalDetalles(true);
                          }}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          Detalles
                        </button>
                        <button
                          onClick={() => generarPDF(cotizacion)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          PDF
                        </button>
                        {cotizacion.estado === 'aceptada' && esAdmin && (
                          <a
                            href={`/cotizaciones/${cotizacion.id}/costos`}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                            title="Control de Costos"
                          >
                            💰 Costos
                          </a>
                        )}
                        {esAdmin && (
                          <button
                            onClick={() => {
                              setCotizacionEditando(cotizacion);
                              setMostrarModalEditar(true);
                            }}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            title="Editar cotización"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {mostrarModalDetalles && cotizacionDetalles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Detalles de la Cotización</h2>
              <button
                onClick={() => {
                  setMostrarModalDetalles(false);
                  setCotizacionDetalles(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Información General */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información General</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Número:</span>
                    <span className="ml-2 text-gray-900">{cotizacionDetalles.numero}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      cotizacionDetalles.estado === 'aceptada' ? 'bg-green-100 text-green-800' :
                      cotizacionDetalles.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {cotizacionDetalles.estado}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fecha:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(cotizacionDetalles.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Total:</span>
                    <span className="ml-2 text-gray-900 font-semibold">
                      ${calcularTotalDesdeItems(cotizacionDetalles).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nombre:</span>
                    <span className="ml-2 text-gray-900">{cotizacionDetalles.cliente_nombre}</span>
                  </div>
                  {cotizacionDetalles.cliente_email && (
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">{cotizacionDetalles.cliente_email}</span>
                    </div>
                  )}
                  {cotizacionDetalles.cliente_telefono && (
                    <div>
                      <span className="font-medium text-gray-700">Teléfono:</span>
                      <span className="ml-2 text-gray-900">{cotizacionDetalles.cliente_telefono}</span>
                    </div>
                  )}
                  {cotizacionDetalles.cliente_direccion && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Dirección:</span>
                      <span className="ml-2 text-gray-900">{cotizacionDetalles.cliente_direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Persona que Cotizó */}
              {cotizacionDetalles.usuario && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Persona que Cotizó</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Nombre:</span>
                      <span className="ml-2 text-gray-900">{(cotizacionDetalles.usuario as any)?.nombre || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">{(cotizacionDetalles.usuario as any)?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Rol:</span>
                      <span className="ml-2 text-gray-900">{(cotizacionDetalles.usuario as any)?.role || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Completos */}
              {cotizacionDetalles.items && Array.isArray(cotizacionDetalles.items) && cotizacionDetalles.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Items de la Cotización ({cotizacionDetalles.items.length})</h3>
                  <div className="space-y-6">
                    {cotizacionDetalles.items.map((item: any, index: number) => {
                      // Calcular totales del item
                      const totalMateriales = item.materiales?.reduce((sum: number, mat: any) => 
                        sum + ((mat.precio_unitario || 0) * (mat.cantidad || 1)), 0) || 0;
                      const totalServicios = item.servicios?.reduce((sum: number, serv: any) => 
                        sum + ((serv.precio_por_hora || 0) * (serv.horas || 0)), 0) || 0;
                      const subtotalItem = totalMateriales + totalServicios;
                      
                      // Manejar gastos_extras: puede ser un array de objetos {concepto, monto} o un porcentaje
                      let gastosExtrasValor = 0;
                      let gastosExtrasPorcentaje: number | null = null;
                      let gastosExtrasArray: Array<{concepto: string; monto: number}> | null = null;
                      
                      if (Array.isArray(item.gastos_extras)) {
                        // Es un array de objetos {concepto, monto}
                        gastosExtrasArray = item.gastos_extras;
                        gastosExtrasValor = item.gastos_extras.reduce((sum: number, gasto: any) => 
                          sum + (gasto.monto || 0), 0);
                      } else if (typeof item.gastos_extras === 'number') {
                        // Es un porcentaje
                        gastosExtrasPorcentaje = item.gastos_extras;
                        gastosExtrasValor = subtotalItem * item.gastos_extras / 100;
                      } else if (item.gastos_extras && typeof item.gastos_extras === 'object') {
                        // Es un objeto único {concepto, monto}
                        gastosExtrasValor = item.gastos_extras.monto || 0;
                        gastosExtrasArray = [item.gastos_extras];
                      }
                      
                      const costosIndirectos = item.costos_indirectos || 0;
                      const subtotalConExtras = subtotalItem + gastosExtrasValor + costosIndirectos;
                      const margenGananciaValor = item.margen_ganancia ? (subtotalConExtras * item.margen_ganancia / 100) : 0;
                      const precioFinalItem = subtotalConExtras + margenGananciaValor;
                      
                      return (
                        <div key={index} className="border-2 border-gray-300 rounded-lg p-5 bg-gray-50">
                          {/* Header del Item */}
                          <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-gray-300">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-900">
                                {item.nombre || `Item ${index + 1}`}
                                {item.cantidad > 1 && (
                                  <span className="ml-2 text-base font-normal text-gray-600">
                                    (Cantidad: {item.cantidad})
                                  </span>
                                )}
                              </h4>
                              {item.descripcion && (
                                <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded border border-gray-200">
                                  {item.descripcion}
                                </p>
                              )}
                              {item.medidas && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <span className="font-medium">Medidas:</span> {item.medidas.ancho} x {item.medidas.alto} x {item.medidas.profundidad} {item.medidas.unidad || 'cm'}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xl font-bold text-indigo-600">
                                ${precioFinalItem.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              {item.cantidad > 1 && item.precio_unitario && (
                                <p className="text-sm text-gray-500 mt-1">
                                  ${item.precio_unitario.toLocaleString('es-CO')} c/u
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Materiales Detallados */}
                          {item.materiales && Array.isArray(item.materiales) && item.materiales.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span>📦</span> Materiales ({item.materiales.length})
                              </h5>
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Material</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Tipo</th>
                                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Cantidad</th>
                                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Precio Unit.</th>
                                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {item.materiales.map((mat: any, matIndex: number) => {
                                      const totalMat = (mat.precio_unitario || 0) * (mat.cantidad || 1);
                                      return (
                                        <tr key={matIndex} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                            {mat.material_nombre || mat.nombre || 'Material'}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600">
                                            {mat.material_tipo || 'N/A'}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600 text-right">
                                            {mat.cantidad || 0} {mat.unidad || 'un'}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600 text-right">
                                            ${(mat.precio_unitario || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                          <td className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                                            ${totalMat.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot className="bg-gray-100">
                                    <tr>
                                      <td colSpan={4} className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                        Subtotal Materiales:
                                      </td>
                                      <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                        ${totalMateriales.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Servicios Detallados */}
                          {item.servicios && Array.isArray(item.servicios) && item.servicios.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span>🔧</span> Servicios / Mano de Obra ({item.servicios.length})
                              </h5>
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Servicio</th>
                                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Horas</th>
                                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Precio/Hora</th>
                                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {item.servicios.map((serv: any, servIndex: number) => {
                                      const totalServ = (serv.precio_por_hora || 0) * (serv.horas || 0);
                                      return (
                                        <tr key={servIndex} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                            {serv.servicio_nombre || serv.nombre || 'Servicio'}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600 text-right">
                                            {serv.horas || 0} hrs
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600 text-right">
                                            ${(serv.precio_por_hora || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                          <td className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                                            ${totalServ.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot className="bg-gray-100">
                                    <tr>
                                      <td colSpan={3} className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                        Subtotal Servicios:
                                      </td>
                                      <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                        ${totalServicios.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Resumen de Costos y Utilidades */}
                          <div className="bg-white rounded-lg border-2 border-indigo-200 p-4">
                            <h5 className="text-base font-bold text-gray-900 mb-3">💰 Resumen de Costos y Utilidades</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between py-1 border-b border-gray-200">
                                <span className="text-gray-700">Subtotal Materiales:</span>
                                <span className="font-medium text-gray-900">
                                  ${totalMateriales.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-gray-200">
                                <span className="text-gray-700">Subtotal Servicios:</span>
                                <span className="font-medium text-gray-900">
                                  ${totalServicios.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-gray-200">
                                <span className="text-gray-700">Subtotal:</span>
                                <span className="font-semibold text-gray-900">
                                  ${subtotalItem.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              {(gastosExtrasArray || gastosExtrasPorcentaje !== null) && (
                                <div className="py-1 border-b border-gray-200">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-gray-700 font-semibold">Gastos Extras:</span>
                                    <span className="font-medium text-orange-600">
                                      + ${gastosExtrasValor.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  {gastosExtrasPorcentaje !== null && (
                                    <div className="text-xs text-gray-500 ml-2">
                                      ({gastosExtrasPorcentaje}% del subtotal)
                                    </div>
                                  )}
                                  {gastosExtrasArray && gastosExtrasArray.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {gastosExtrasArray.map((gasto: any, gastoIndex: number) => (
                                        <div key={gastoIndex} className="text-xs text-gray-600 ml-4 flex justify-between">
                                          <span>• {gasto.concepto || 'Gasto extra'}:</span>
                                          <span className="font-medium">${(gasto.monto || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {item.costos_indirectos && item.costos_indirectos > 0 && (
                                <div className="flex justify-between py-1 border-b border-gray-200">
                                  <span className="text-gray-700">Costos Indirectos:</span>
                                  <span className="font-medium text-orange-600">
                                    + ${costosIndirectos.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between py-1 border-b-2 border-gray-300">
                                <span className="text-gray-700 font-semibold">Subtotal con Extras:</span>
                                <span className="font-bold text-gray-900">
                                  ${subtotalConExtras.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              {item.margen_ganancia && (
                                <div className="flex justify-between py-1 border-b border-gray-200">
                                  <span className="text-gray-700">
                                    Margen de Ganancia ({item.margen_ganancia}%):
                                  </span>
                                  <span className="font-medium text-green-600">
                                    + ${margenGananciaValor.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between py-2 bg-indigo-50 rounded px-2 mt-2">
                                <span className="text-lg font-bold text-gray-900">Precio Total del Item:</span>
                                <span className="text-xl font-bold text-indigo-600">
                                  ${precioFinalItem.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Materiales y Servicios (si no hay items detallados) */}
              {(!cotizacionDetalles.items || !Array.isArray(cotizacionDetalles.items) || cotizacionDetalles.items.length === 0) && (
                <>
                  {/* Materiales */}
                  {cotizacionDetalles.materiales && Array.isArray(cotizacionDetalles.materiales) && cotizacionDetalles.materiales.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Materiales</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unitario</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cotizacionDetalles.materiales.map((mat: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {mat.material?.nombre || mat.material_nombre || 'Material'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">{mat.cantidad}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  ${mat.precio_unitario.toLocaleString('es-CO')}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  ${(mat.cantidad * mat.precio_unitario).toLocaleString('es-CO')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Servicios */}
                  {cotizacionDetalles.servicios && Array.isArray(cotizacionDetalles.servicios) && cotizacionDetalles.servicios.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Servicios / Mano de Obra</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio por Hora</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cotizacionDetalles.servicios.map((serv: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {serv.servicio?.nombre || serv.servicio_nombre || 'Servicio'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">{serv.horas}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  ${serv.precio_por_hora.toLocaleString('es-CO')}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  ${(serv.horas * serv.precio_por_hora).toLocaleString('es-CO')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Resumen Financiero */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumen Financiero</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal Materiales:</span>
                    <span className="font-medium text-gray-900">
                      ${cotizacionDetalles.subtotal_materiales.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal Servicios:</span>
                    <span className="font-medium text-gray-900">
                      ${cotizacionDetalles.subtotal_servicios.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-medium text-gray-900">
                      ${cotizacionDetalles.subtotal.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">IVA (19%):</span>
                    <span className="font-medium text-gray-900">
                      ${cotizacionDetalles.iva.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Margen de Ganancia:</span>
                    <span className="font-medium text-gray-900">
                      {cotizacionDetalles.margen_ganancia}%
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-indigo-600">
                      ${calcularTotalDesdeItems(cotizacionDetalles).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial de Modificaciones */}
              {historialModificaciones.length > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-gray-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Historial de Modificaciones</h3>
                  <div className="space-y-4">
                    {historialModificaciones.map((modificacion) => (
                      <div key={modificacion.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{modificacion.descripcion}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Por: {modificacion.usuario?.nombre || modificacion.usuario?.email || 'Usuario'} | 
                              Fecha: {new Date(modificacion.created_at).toLocaleString('es-ES')}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            {modificacion.total_anterior !== undefined && modificacion.total_nuevo !== undefined && (
                              <div className="text-sm">
                                <span className="text-gray-600 line-through">
                                  ${modificacion.total_anterior.toLocaleString('es-CO')}
                                </span>
                                <span className="ml-2 font-semibold text-indigo-600">
                                  ${modificacion.total_nuevo.toLocaleString('es-CO')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Cerrar */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setMostrarModalDetalles(false);
                    setCotizacionDetalles(null);
                    setHistorialModificaciones([]);
                  }}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Cotización */}
          {mostrarModalEditar && cotizacionEditando && usuario?.id && (
            <EditarCotizacionModal
              cotizacion={cotizacionEditando}
              usuarioId={usuario.id}
              onClose={() => {
                setMostrarModalEditar(false);
                setCotizacionEditando(null);
              }}
              onSuccess={async () => {
                // Recargar cotizaciones después de editar
                try {
                  const resultado = await obtenerCotizaciones(esAdmin ? undefined : usuario?.id);
                  setCotizaciones(resultado);
                } catch (err: any) {
                  console.error('Error al recargar cotizaciones:', err);
                }
              }}
            />
          )}
        </>
      );
    }

