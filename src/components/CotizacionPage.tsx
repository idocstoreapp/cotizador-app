/**
 * Página de cotización (carrito)
 */
import { useState } from 'react';
import { useCotizacionStore } from '../store/cotizacionStore';
import CotizacionCart from './ui/CotizacionCart';
import AgregarItemManual from './ui/AgregarItemManual';
import { downloadQuotePDF } from '../utils/pdf';
import { convertirItemsAPDF } from '../utils/convertirItemsAPDF';
import { crearCotizacion } from '../services/cotizaciones.service';
import { obtenerUsuarioActual } from '../services/auth.service';
import { convertirItemsACotizacionInput } from '../utils/convertirCotizacionStore';

export default function CotizacionPage() {
  const { items, subtotal, descuento, iva, total } = useCotizacionStore();
  const [mostrarAgregarManual, setMostrarAgregarManual] = useState(false);
  const [mostrarFormularioCliente, setMostrarFormularioCliente] = useState(false);
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  /**
   * Genera el PDF y guarda la cotización en la base de datos
   */
  const handleGenerarPDF = async () => {
    if (items.length === 0) {
      alert('No hay items en la cotización');
      return;
    }

    // Si no hay datos del cliente, mostrar formulario
    if (!datosCliente.nombre) {
      setMostrarFormularioCliente(true);
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
      console.log('💾 Guardando cotización...', {
        usuarioId: usuario.id,
        itemsCount: items.length,
        clienteNombre: datosCliente.nombre,
        materialesCount: cotizacionInput.materiales.length,
        serviciosCount: cotizacionInput.servicios.length
      });
      
      const cotizacionGuardada = await crearCotizacion(cotizacionInput, usuario.id);
      
      console.log('✅ Cotización guardada:', {
        id: cotizacionGuardada.id,
        numero: cotizacionGuardada.numero,
        total: cotizacionGuardada.total
      });

      // Generar número de cotización
      const numero = cotizacionGuardada.numero;
      const fecha = new Date(cotizacionGuardada.created_at).toLocaleDateString('es-ES');

      // Convertir items al formato del PDF profesional
      const datosPDF = convertirItemsAPDF(
        items,
        datosCliente,
        numero,
        fecha,
        subtotal,
        descuento,
        iva,
        total
      );

      // Generar PDF profesional usando el nuevo sistema
      try {
        console.log('📄 Intentando generar PDF con datos:', {
          quoteNumber: numero,
          itemsCount: datosPDF.items.length,
          total: datosPDF.total
        });
        await downloadQuotePDF(datosPDF);
        alert(`✅ Cotización ${numero} guardada y PDF generado exitosamente`);
      } catch (pdfError: any) {
        console.error('❌ Error completo al generar PDF:', {
          message: pdfError.message,
          name: pdfError.name,
          stack: pdfError.stack
        });
        const errorMsg = pdfError.message || 'Error desconocido al generar PDF';
        alert(`⚠️ Cotización ${numero} guardada, pero hubo un error al generar el PDF:\n\n${errorMsg}\n\nRevisa la consola para más detalles.`);
      }

      // Limpiar el carrito después de guardar
      useCotizacionStore.getState().limpiarCotizacion();
      setDatosCliente({ nombre: '', telefono: '', email: '', direccion: '' });
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


