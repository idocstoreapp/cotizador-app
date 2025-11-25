/**
 * Endpoint API para generar PDF de cotizaciones
 * Genera un HTML que se puede imprimir como PDF desde el navegador
 * Nota: Para generación real de PDF, se recomienda usar un servicio externo
 * o implementar puppeteer/playwright en el servidor
 */
import type { APIRoute } from 'astro';
import { obtenerCotizacionPorId } from '../../services/cotizaciones.service';
import { obtenerUsuarioActual } from '../../services/auth.service';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación
    const usuario = await obtenerUsuarioActual();
    if (!usuario) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener ID de cotización de los query params
    const url = new URL(request.url);
    const cotizacionId = url.searchParams.get('id');

    if (!cotizacionId) {
      return new Response(JSON.stringify({ error: 'ID de cotización requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener cotización
    const cotizacion = await obtenerCotizacionPorId(cotizacionId);

    if (!cotizacion) {
      return new Response(JSON.stringify({ error: 'Cotización no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar permisos (solo admin o el creador puede ver)
    if (usuario.role !== 'admin' && cotizacion.usuario_id !== usuario.id) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generar HTML para impresión/PDF
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotización ${cotizacion.numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 24px; color: #4F46E5; margin-bottom: 10px; }
    .header h2 { font-size: 18px; color: #666; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #4F46E5; padding-bottom: 5px; }
    .info-row { margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .totals { margin-top: 20px; text-align: right; }
    .total-row { margin-bottom: 8px; }
    .total-final { font-size: 18px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
    .notes { margin-top: 30px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #4F46E5; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Mueblería Cotizador</h1>
    <h2>Cotización #${cotizacion.numero}</h2>
  </div>

  <div class="section">
    <div class="section-title">DATOS DEL CLIENTE</div>
    <div class="info-row"><strong>Nombre:</strong> ${cotizacion.cliente_nombre}</div>
    ${cotizacion.cliente_email ? `<div class="info-row"><strong>Email:</strong> ${cotizacion.cliente_email}</div>` : ''}
    ${cotizacion.cliente_telefono ? `<div class="info-row"><strong>Teléfono:</strong> ${cotizacion.cliente_telefono}</div>` : ''}
    ${cotizacion.cliente_direccion ? `<div class="info-row"><strong>Dirección:</strong> ${cotizacion.cliente_direccion}</div>` : ''}
  </div>

  ${cotizacion.materiales && cotizacion.materiales.length > 0 ? `
  <div class="section">
    <div class="section-title">MATERIALES</div>
    <table>
      <thead>
        <tr>
          <th>Material</th>
          <th>Cantidad</th>
          <th>Precio Unit.</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${cotizacion.materiales.map((item: any) => {
          const subtotal = item.cantidad * item.precio_unitario;
          return `
          <tr>
            <td>${item.material?.nombre || 'N/A'}</td>
            <td>${item.cantidad}</td>
            <td>$${item.precio_unitario.toLocaleString()}</td>
            <td>$${subtotal.toLocaleString()}</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${cotizacion.servicios && cotizacion.servicios.length > 0 ? `
  <div class="section">
    <div class="section-title">SERVICIOS / MANO DE OBRA</div>
    <table>
      <thead>
        <tr>
          <th>Servicio</th>
          <th>Horas</th>
          <th>Precio/Hora</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${cotizacion.servicios.map((item: any) => {
          const subtotal = item.horas * item.precio_por_hora;
          return `
          <tr>
            <td>${item.servicio?.nombre || 'N/A'}</td>
            <td>${item.horas}</td>
            <td>$${item.precio_por_hora.toLocaleString()}</td>
            <td>$${subtotal.toLocaleString()}</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">RESUMEN</div>
    <div class="totals">
      <div class="total-row">Subtotal Materiales: $${cotizacion.subtotal_materiales.toLocaleString()}</div>
      <div class="total-row">Subtotal Servicios: $${cotizacion.subtotal_servicios.toLocaleString()}</div>
      <div class="total-row">Subtotal: $${cotizacion.subtotal.toLocaleString()}</div>
      <div class="total-row">Margen de Ganancia (${cotizacion.margen_ganancia}%): $${((cotizacion.subtotal * cotizacion.margen_ganancia) / 100).toLocaleString()}</div>
      <div class="total-row">IVA (19%): $${cotizacion.iva.toLocaleString()}</div>
      <div class="total-final">TOTAL: $${cotizacion.total.toLocaleString()}</div>
    </div>
  </div>

  ${cotizacion.notas ? `
  <div class="notes">
    <strong>NOTAS:</strong><br>
    ${cotizacion.notas}
  </div>
  ` : ''}

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; background-color: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
      Imprimir / Guardar como PDF
    </button>
  </div>
</body>
</html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

