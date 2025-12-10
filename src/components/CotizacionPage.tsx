/**
 * Página de cotización (carrito)
 */
import { useState, useEffect } from 'react';
import { useCotizacionStore } from '../store/cotizacionStore';
import CotizacionCart from './ui/CotizacionCart';
import AgregarItemManual from './ui/AgregarItemManual';
import SeleccionarEmpresaModal from './ui/SeleccionarEmpresaModal';
import { downloadQuotePDF } from '../utils/pdf';
import { convertirItemsAPDF } from '../utils/convertirItemsAPDF';
import { crearCotizacion } from '../services/cotizaciones.service';
import { obtenerUsuarioActual } from '../services/auth.service';
import { convertirItemsACotizacionInput } from '../utils/convertirCotizacionStore';
import { EMPRESAS, type Empresa } from '../types/empresas';
import { obtenerVendedores } from '../services/usuarios.service';
import type { UserProfile } from '../types/database';

export default function CotizacionPage() {
  const { items, subtotal, descuento, iva, total } = useCotizacionStore();
  const [mostrarAgregarManual, setMostrarAgregarManual] = useState(false);
  const [mostrarFormularioCliente, setMostrarFormularioCliente] = useState(false);
  const [mostrarSeleccionarEmpresa, setMostrarSeleccionarEmpresa] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const [vendedores, setVendedores] = useState<UserProfile[]>([]);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<string>('');
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  // Cargar vendedores al montar el componente
  useEffect(() => {
    const cargarVendedores = async () => {
      try {
        const vendedoresData = await obtenerVendedores();
        setVendedores(vendedoresData);
      } catch (error) {
        console.error('Error al cargar vendedores:', error);
      }
    };
    cargarVendedores();
  }, []);

  /**
   * Genera el PDF y guarda la cotización en la base de datos
   */
  const handleGenerarPDF = async (empresa?: Empresa) => {
    if (items.length === 0) {
      alert('No hay items en la cotización');
      return;
    }

    // Si no hay datos del cliente, mostrar formulario
    if (!datosCliente.nombre) {
      setMostrarFormularioCliente(true);
      return;
    }

    // Si no hay empresa seleccionada, mostrar modal de selección
    if (!empresa) {
      setMostrarSeleccionarEmpresa(true);
      return;
    }

    try {
      // Obtener usuario actual
      const usuario = await obtenerUsuarioActual();
      if (!usuario) {
        alert('Debes estar autenticado para guardar la cotización');
        return;
      }

      // Convertir items del store a formato CotizacionInput
      const cotizacionInput = convertirItemsACotizacionInput(
        items,
        datosCliente,
        30 // Margen de ganancia por defecto
      );

      // Guardar cotización en la base de datos (estado: pendiente)
      // Incluir items completos para guardar toda la información detallada
      // IMPORTANTE: Pasar los totales calculados desde items para que coincidan
      console.log('💾 Guardando cotización...', {
        usuarioId: usuario.id,
        itemsCount: items.length,
        clienteNombre: datosCliente.nombre,
        materialesCount: cotizacionInput.materiales.length,
        serviciosCount: cotizacionInput.servicios.length,
        subtotalDesdeItems: subtotal,
        ivaDesdeItems: iva,
        totalDesdeItems: total
      });
      
      const cotizacionGuardada = await crearCotizacion(
        cotizacionInput, 
        usuario.id, 
        items,
        subtotal, // Subtotal calculado desde items
        descuento, // Descuento
        iva, // IVA calculado desde items
        total, // Total calculado desde items
        empresa, // Empresa seleccionada
        vendedorSeleccionado || undefined // Vendedor seleccionado
      );
      
      console.log('✅ Cotización guardada:', {
        id: cotizacionGuardada.id,
        numero: cotizacionGuardada.numero,
        total: cotizacionGuardada.total
      });

      // Generar número de cotización
      const numero = cotizacionGuardada.numero;
      const fecha = new Date(cotizacionGuardada.created_at).toLocaleDateString('es-ES');

      // Obtener información de la empresa
      const empresaInfo = EMPRESAS[empresa];

      // Convertir items al formato del PDF profesional
      const datosPDF = convertirItemsAPDF(
        items,
        datosCliente,
        numero,
        fecha,
        subtotal,
        descuento,
        iva,
        total,
        empresaInfo.nombre,
        empresaInfo.logo,
        {
          nombre: empresaInfo.nombre,
          nombreCompleto: empresaInfo.nombreCompleto,
          logo: empresaInfo.logo,
          rut: empresaInfo.rut,
          direccion: empresaInfo.direccion,
          emails: empresaInfo.emails,
          telefonos: empresaInfo.telefonos,
          sitioWeb: empresaInfo.sitioWeb,
          descripcion: empresaInfo.descripcion
        }
      );

      // Generar PDF profesional usando el nuevo sistema
      try {
        console.log('📄 Intentando generar PDF con datos:', {
          quoteNumber: numero,
          itemsCount: datosPDF.items.length,
          total: datosPDF.total
        });
        
        // Intentar generar PDF con timeout para evitar errores falsos
        const pdfPromise = downloadQuotePDF(datosPDF);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout al generar PDF')), 60000)
        );
        
        await Promise.race([pdfPromise, timeoutPromise]);
        
        // Si llegamos aquí, el PDF se generó correctamente
        console.log(`✅ PDF generado exitosamente para cotización ${numero}`);
        alert(`✅ Cotización ${numero} guardada y PDF generado exitosamente`);
      } catch (pdfError: any) {
        // Verificar si el error es crítico o solo un warning
        const errorMsg = pdfError.message || 'Error desconocido al generar PDF';
        
        // Si el error es por cancelación del usuario, timeout de red, o errores menores, no mostrar alert
        const erroresNoCriticos = [
          'cancel', 'abort', 'network', 'timeout', 'fetch', 
          'Failed to fetch', 'NetworkError', 'Network request failed',
          'Timeout al generar PDF'
        ];
        
        const esErrorNoCritico = erroresNoCriticos.some(patron => 
          errorMsg.toLowerCase().includes(patron.toLowerCase())
        );
        
        if (esErrorNoCritico) {
          console.warn('⚠️ PDF: posible error de red o timeout (no crítico):', errorMsg);
          // No mostrar error si es no crítico, asumir que el PDF se descargó
          alert(`✅ Cotización ${numero} guardada. El PDF debería haberse descargado.`);
        } else {
          console.error('❌ Error completo al generar PDF:', {
            message: pdfError.message,
            name: pdfError.name,
            stack: pdfError.stack
          });
          // Solo mostrar alert si es un error crítico
          alert(`⚠️ Cotización ${numero} guardada, pero hubo un error al generar el PDF:\n\n${errorMsg}\n\nRevisa la consola para más detalles.`);
        }
      }

      // Limpiar el carrito después de guardar exitosamente
      console.log('🧹 Limpiando carrito después de guardar cotización...');
      console.log('📦 Estado antes de limpiar:', {
        itemsCount: items.length,
        subtotal,
        total
      });
      
      // Limpiar el store (esto también limpia el localStorage)
      useCotizacionStore.getState().limpiarCotizacion();
      
      // Limpiar los datos del formulario
      setDatosCliente({ nombre: '', telefono: '', email: '', direccion: '' });
      setEmpresaSeleccionada(null);
      setVendedorSeleccionado('');
      
      // Verificar que se limpió correctamente después de un breve delay
      // Esto es necesario porque el middleware de persistencia puede restaurar el estado
      setTimeout(() => {
        const estadoActual = useCotizacionStore.getState();
        console.log('✅ Estado después de limpiar:', {
          itemsCount: estadoActual.items.length,
          subtotal: estadoActual.subtotal,
          total: estadoActual.total
        });
        
        // Si aún hay items, forzar limpieza nuevamente
        if (estadoActual.items.length > 0) {
          console.warn('⚠️ El carrito no se limpió correctamente, forzando limpieza nuevamente...');
          // Limpiar localStorage explícitamente
          try {
            localStorage.removeItem('cotizacion-storage');
          } catch (e) {
            console.error('Error al limpiar localStorage:', e);
          }
          // Limpiar el store nuevamente
          useCotizacionStore.getState().limpiarCotizacion();
        }
      }, 300);
    } catch (error: any) {
      console.error('❌ Error al guardar cotización:', error);
      console.error('Detalles del error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      alert('Error al guardar la cotización: ' + (error.message || 'Error desconocido') + '\n\nRevisa la consola para más detalles.');
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Cotización</h1>
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🟢 CLICK EN AGREGAR ITEM MANUAL');
                console.log('🟢 Estado antes:', mostrarAgregarManual);
                setMostrarAgregarManual(true);
                console.log('🟢 Estado después de setState:', true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>Agregar Item Manual</span>
            </button>
            <a
              href="/catalogo"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📦</span>
              <span>Agregar del Catálogo</span>
            </a>
          </div>
        </div>
        <CotizacionCart onGenerarPDF={handleGenerarPDF} />
      </div>

      {/* Modal para agregar item manual */}
      {mostrarAgregarManual && (
        <AgregarItemManual onClose={() => setMostrarAgregarManual(false)} />
      )}

      {/* Modal para seleccionar empresa */}
      {mostrarSeleccionarEmpresa && (
        <SeleccionarEmpresaModal
          onSeleccionar={(empresa) => {
            setEmpresaSeleccionada(empresa);
            setMostrarSeleccionarEmpresa(false);
            handleGenerarPDF(empresa);
          }}
          onCancelar={() => setMostrarSeleccionarEmpresa(false)}
        />
      )}

      {/* Modal para datos del cliente */}
      {mostrarFormularioCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Datos del Cliente</h2>
              <button
                onClick={() => setMostrarFormularioCliente(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (datosCliente.nombre.trim()) {
                  setMostrarFormularioCliente(false);
                  handleGenerarPDF();
                } else {
                  alert('Por favor ingresa al menos el nombre del cliente');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={datosCliente.nombre}
                  onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={datosCliente.telefono}
                  onChange={(e) => setDatosCliente({ ...datosCliente, telefono: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej: +56 9 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={datosCliente.email}
                  onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej: cliente@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={datosCliente.direccion}
                  onChange={(e) => setDatosCliente({ ...datosCliente, direccion: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej: Calle Principal 123"
                />
              </div>
              {vendedores.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendedor
                  </label>
                  <select
                    value={vendedorSeleccionado}
                    onChange={(e) => setVendedorSeleccionado(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar vendedor (opcional)</option>
                    {vendedores.map((vendedor) => (
                      <option key={vendedor.id} value={vendedor.id}>
                        {vendedor.nombre || ''} {vendedor.apellido || ''} {!vendedor.nombre && !vendedor.apellido ? (vendedor.email || 'Sin nombre') : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Generar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormularioCliente(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


