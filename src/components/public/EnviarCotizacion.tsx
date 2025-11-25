/**
 * Componente para enviar cotización pública
 * Opciones: WhatsApp, Email, Formulario de contacto
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { guardarCotizacionPublica } from '../../services/cotizaciones-publicas.service';
import { CONFIG_PUBLICO } from '../../config/public';
import type { Mueble, OpcionesMueble } from '../../types/muebles';

interface EnviarCotizacionProps {
  mueble: Mueble;
  opciones: OpcionesMueble;
  cantidad: number;
  precioFinal: number;
  precioTotal: number;
  ivaMonto: number;
  totalConIva: number;
}

export default function EnviarCotizacion({
  mueble,
  opciones,
  cantidad,
  precioFinal,
  precioTotal,
  ivaMonto,
  totalConIva
}: EnviarCotizacionProps) {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'whatsapp' | 'email' | 'formulario' | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  });

  // Mutación para guardar cotización
  const guardarMutation = useMutation({
    mutationFn: guardarCotizacionPublica,
    onSuccess: (data) => {
      console.log('Cotización guardada:', data.id);
      // Después de guardar, abrir el método de contacto correspondiente
      if (metodoSeleccionado === 'whatsapp') {
        abrirWhatsApp();
      } else if (metodoSeleccionado === 'email') {
        abrirEmail();
      } else {
        alert('✅ Cotización enviada exitosamente. Nos pondremos en contacto contigo pronto.');
      }
    },
    onError: (error: any) => {
      console.error('Error al guardar cotización:', error);
      alert('Error al guardar la cotización. Por favor intenta nuevamente.');
    }
  });

  const abrirWhatsApp = () => {
    const mensaje = generarMensajeWhatsApp();
    const url = `https://wa.me/${CONFIG_PUBLICO.whatsapp.numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const abrirEmail = () => {
    const asunto = CONFIG_PUBLICO.email.asunto;
    const cuerpo = generarMensajeEmail();
    const url = `mailto:${CONFIG_PUBLICO.email.direccion}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = url;
  };

  const generarMensajeWhatsApp = (): string => {
    return `${CONFIG_PUBLICO.whatsapp.mensajeInicial}

📋 *Detalles de la Cotización:*

*Producto:* ${mueble.nombre}
${opciones.material_puertas ? `*Material de Puertas:* ${opciones.material_puertas}` : ''}
${opciones.tipo_topes ? `*Tipo de Topes:* ${opciones.tipo_topes}` : ''}
${opciones.color ? `*Color:* ${opciones.color}` : ''}
*Cantidad:* ${cantidad}
*Precio Unitario:* $${precioFinal.toLocaleString('es-CO')}
*Total:* $${totalConIva.toLocaleString('es-CO')}

${formData.nombre ? `*Nombre:* ${formData.nombre}` : ''}
${formData.telefono ? `*Teléfono:* ${formData.telefono}` : ''}
${formData.email ? `*Email:* ${formData.email}` : ''}
${formData.mensaje ? `*Mensaje:* ${formData.mensaje}` : ''}`;
  };

  const generarMensajeEmail = (): string => {
    return `Hola,

Quiero cotizar una cocina con las siguientes especificaciones:

Producto: ${mueble.nombre}
${opciones.material_puertas ? `Material de Puertas: ${opciones.material_puertas}` : ''}
${opciones.tipo_topes ? `Tipo de Topes: ${opciones.tipo_topes}` : ''}
${opciones.color ? `Color: ${opciones.color}` : ''}
Cantidad: ${cantidad}
Precio Unitario: $${precioFinal.toLocaleString('es-CO')}
Total: $${totalConIva.toLocaleString('es-CO')}

${formData.nombre ? `Nombre: ${formData.nombre}` : ''}
${formData.telefono ? `Teléfono: ${formData.telefono}` : ''}
${formData.email ? `Email: ${formData.email}` : ''}
${formData.mensaje ? `Mensaje: ${formData.mensaje}` : ''}

Gracias.`;
  };

  const handleEnviar = () => {
    if (!metodoSeleccionado) {
      alert('Por favor selecciona un método de contacto');
      return;
    }

    if (metodoSeleccionado === 'formulario' && !formData.nombre) {
      alert('Por favor ingresa tu nombre');
      return;
    }

    // Guardar cotización en BD
    guardarMutation.mutate({
      nombre_cliente: formData.nombre || 'Cliente',
      email_cliente: formData.email || undefined,
      telefono_cliente: formData.telefono || undefined,
      mensaje_cliente: formData.mensaje || undefined,
      items: [{
        id: `publico-${mueble.id}-${Date.now()}`,
        tipo: 'catalogo',
        mueble_id: mueble.id,
        mueble,
        opciones,
        cantidad,
        precio_unitario: precioFinal,
        precio_total: precioTotal
      }],
      subtotal: precioTotal,
      descuento: 0,
      iva: 19,
      total: totalConIva,
      metodo_contacto: metodoSeleccionado
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">¿Cómo te gustaría contactarnos?</h2>
      
      {/* Opciones de método */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setMetodoSeleccionado('whatsapp')}
          className={`p-4 rounded-lg border-2 transition-all ${
            metodoSeleccionado === 'whatsapp'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-green-300'
          }`}
        >
          <div className="text-3xl mb-2">💬</div>
          <div className="font-semibold text-gray-900">WhatsApp</div>
          <div className="text-xs text-gray-600 mt-1">Chat directo</div>
        </button>

        <button
          onClick={() => setMetodoSeleccionado('email')}
          className={`p-4 rounded-lg border-2 transition-all ${
            metodoSeleccionado === 'email'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300'
          }`}
        >
          <div className="text-3xl mb-2">📧</div>
          <div className="font-semibold text-gray-900">Email</div>
          <div className="text-xs text-gray-600 mt-1">Envío por correo</div>
        </button>

        <button
          onClick={() => setMetodoSeleccionado('formulario')}
          className={`p-4 rounded-lg border-2 transition-all ${
            metodoSeleccionado === 'formulario'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-300'
          }`}
        >
          <div className="text-3xl mb-2">📝</div>
          <div className="font-semibold text-gray-900">Formulario</div>
          <div className="text-xs text-gray-600 mt-1">Completa el formulario</div>
        </button>
      </div>

      {/* Formulario de contacto (si se selecciona formulario) */}
      {metodoSeleccionado === 'formulario' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Datos de Contacto</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje adicional (opcional)
              </label>
              <textarea
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                rows={3}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Cuéntanos más sobre tu proyecto..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulario mínimo para WhatsApp y Email */}
      {(metodoSeleccionado === 'whatsapp' || metodoSeleccionado === 'email') && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Datos de Contacto (Opcional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Tu teléfono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="tu@email.com"
              />
            </div>
          </div>
        </div>
      )}

      {/* Botón de envío */}
      <button
        onClick={handleEnviar}
        disabled={guardarMutation.isPending || !metodoSeleccionado}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {guardarMutation.isPending
          ? 'Enviando...'
          : metodoSeleccionado === 'whatsapp'
          ? '💬 Abrir WhatsApp'
          : metodoSeleccionado === 'email'
          ? '📧 Abrir Email'
          : '📝 Enviar Cotización'}
      </button>
    </div>
  );
}

