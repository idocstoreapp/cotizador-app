/**
 * Utilidad para generar PDF de cotización directamente desde el carrito
 * Crea un HTML que se puede imprimir como PDF desde el navegador
 * Diseño basado en la imagen de muestra de "Mueblería Casa Blanca"
 */
import type { ItemCotizacion } from '../types/muebles';

interface DatosCliente {
  nombre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

interface DatosEmpresa {
  nombre?: string;
  rut?: string;
  banco?: string;
  tipoCuenta?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  sitioWeb?: string;
}

interface DatosCotizacion {
  numero?: string;
  fecha?: string;
  items: ItemCotizacion[];
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  cliente?: DatosCliente;
  empresa?: DatosEmpresa;
}

/**
 * Genera el HTML del PDF de cotización
 */
export function generarHTMLPDF(datos: DatosCotizacion): string {
  const fecha = datos.fecha || new Date().toLocaleDateString('es-ES');
  const numero = datos.numero || `COT-${Date.now()}`;
  
  // Datos de empresa por defecto (Mueblería Casa Blanca)
  const empresa = {
    nombre: datos.empresa?.nombre || 'Mueblería Casa Blanca',
    rut: datos.empresa?.rut || '77.064.513-1',
    banco: datos.empresa?.banco || 'Banco Estado',
    tipoCuenta: datos.empresa?.tipoCuenta || 'Chequera electrónica',
    direccion: datos.empresa?.direccion || 'Dirección de la empresa',
    telefono: datos.empresa?.telefono || 'Teléfono de contacto',
    email: datos.empresa?.email || 'email@empresa.com',
    sitioWeb: datos.empresa?.sitioWeb || 'www.empresa.com'
  };

  // Calcular subtotal neto (antes de IVA)
  const subtotalNeto = datos.subtotal - (datos.subtotal * (datos.descuento / 100));
  const ivaCalculado = subtotalNeto * 0.19; // IVA 19%
  const totalFinal = subtotalNeto + ivaCalculado;

  // Generar tabla de items
  const filasItems = datos.items.map((item, index) => {
    let descripcion = '';
    let codigo = '';
    
    if (item.tipo === 'catalogo') {
      descripcion = item.mueble?.nombre || 'Mueble del catálogo';
      if (item.medidas) {
        descripcion += `, ${item.medidas.ancho || ''}×${item.medidas.alto || ''}×${item.medidas.profundidad || ''} cm`;
      }
      if (item.opciones.color) {
        descripcion += `. Color: ${item.opciones.color}`;
      }
      if (item.opciones.material) {
        descripcion += `. Material: ${item.opciones.material}`;
      }
      codigo = `R${index + 1}`;
    } else {
      descripcion = item.nombre || 'Item manual';
      if (item.descripcion) {
        descripcion += `. ${item.descripcion}`;
      }
      if (item.medidas) {
        descripcion += `. Medidas: ${item.medidas.ancho || ''}×${item.medidas.alto || ''}×${item.medidas.profundidad || ''} cm`;
      }
      codigo = `M${index + 1}`;
    }

    return `
      <tr>
        <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${codigo}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${descripcion}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.cantidad}</td>
        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">$${item.precio_unitario.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">$${item.precio_total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>COTIZACIÓN N° ${numero}</title>
  <style>
    @page {
      size: A4;
      margin: 1cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 11px;
      color: #000;
      padding: 15px;
      background: #fff;
      line-height: 1.3;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
    }
    
    .logo-section {
      flex: 1;
    }
    
    .logo-section h1 {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 3px;
      color: #000;
      letter-spacing: 0.5px;
    }
    
    .logo-section .tagline {
      font-size: 10px;
      color: #333;
      margin-bottom: 5px;
      font-weight: normal;
    }
    
    .logo-section p {
      font-size: 9px;
      color: #000;
      margin-bottom: 2px;
    }
    
    .cotizacion-info {
      text-align: right;
      flex: 0 0 auto;
    }
    
    .cotizacion-info h2 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 3px;
      color: #000;
    }
    
    .cotizacion-info p {
      font-size: 10px;
      margin-bottom: 2px;
      color: #000;
    }
    
    .client-section {
      margin-bottom: 12px;
      padding: 8px;
      background: #f5f5f5;
      border: 1px solid #000;
    }
    
    .client-section h3 {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: uppercase;
      color: #000;
    }
    
    .client-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px;
      font-size: 10px;
    }
    
    .client-info div {
      padding: 2px 0;
    }
    
    .bank-section {
      margin-bottom: 12px;
      padding: 8px;
      background: #e8e8e8;
      border: 1px solid #000;
    }
    
    .bank-section h3 {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: uppercase;
      color: #000;
    }
    
    .bank-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px;
      font-size: 10px;
    }
    
    .bank-info div {
      padding: 2px 0;
    }
    
    .items-section {
      margin-bottom: 15px;
    }
    
    .items-section h3 {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 8px;
      text-transform: uppercase;
      color: #000;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 10px;
    }
    
    table th {
      background-color: #000;
      color: #fff;
      padding: 6px 4px;
      text-align: center;
      font-size: 9px;
      font-weight: bold;
      border: 1px solid #000;
    }
    
    table td {
      padding: 5px 4px;
      border: 1px solid #000;
      font-size: 9px;
      vertical-align: top;
    }
    
    table td:first-child {
      text-align: center;
      font-weight: bold;
    }
    
    table td:nth-child(3),
    table td:nth-child(4),
    table td:nth-child(5) {
      text-align: right;
    }
    
    .summary {
      margin-top: 15px;
      padding: 10px;
      background: #f5f5f5;
      border: 1px solid #000;
      width: 100%;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 11px;
      padding: 2px 0;
    }
    
    .summary-row.total {
      font-size: 14px;
      font-weight: bold;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 2px solid #000;
    }
    
    .conditions {
      margin-top: 15px;
      padding: 10px;
      background: #f5f5f5;
      border: 1px solid #000;
      font-size: 9px;
    }
    
    .conditions h3 {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 6px;
      text-transform: uppercase;
      color: #000;
    }
    
    .conditions ul {
      margin-left: 15px;
      list-style-type: disc;
    }
    
    .conditions li {
      margin-bottom: 3px;
      line-height: 1.4;
    }
    
    .payment-section {
      margin-top: 15px;
      padding: 10px;
      background: #e8e8e8;
      border: 1px solid #000;
    }
    
    .payment-section h3 {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 8px;
      text-transform: uppercase;
      color: #000;
    }
    
    .payment-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 10px;
      padding: 2px 0;
    }
    
    @media print {
      body {
        padding: 10px;
      }
      .no-print {
        display: none !important;
      }
      @page {
        margin: 0.8cm;
      }
    }
    
    .print-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background-color: #4F46E5;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    
    .print-button:hover {
      background-color: #4338CA;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="logo-section">
      <h1>${empresa.nombre}</h1>
      <p class="tagline">Cocina - Closet - Mueble</p>
      <p>${empresa.direccion || 'Dirección de la empresa'}</p>
      <p>Email: ${empresa.email} | Tel: ${empresa.telefono}</p>
      <p>${empresa.sitioWeb}</p>
    </div>
    <div class="cotizacion-info">
      <h2>COTIZACIÓN N° ${numero}</h2>
      <p>Fecha: ${fecha}</p>
    </div>
  </div>

  <!-- Datos del Cliente -->
  ${datos.cliente ? `
  <div class="client-section">
    <h3>DIRIGIDO A:</h3>
    <div class="client-info">
      ${datos.cliente.nombre ? `<div><strong>Nombre:</strong> ${datos.cliente.nombre}</div>` : '<div></div>'}
      ${datos.cliente.telefono ? `<div><strong>Teléfono:</strong> ${datos.cliente.telefono}</div>` : '<div></div>'}
      ${datos.cliente.email ? `<div><strong>Email:</strong> ${datos.cliente.email}</div>` : '<div></div>'}
      ${datos.cliente.direccion ? `<div><strong>Dirección:</strong> ${datos.cliente.direccion}</div>` : '<div></div>'}
    </div>
  </div>
  ` : ''}

  <!-- Datos de Transferencia -->
  <div class="bank-section">
    <h3>DATOS DE TRANSFERENCIA</h3>
    <div class="bank-info">
      <div><strong>Razón Social:</strong> ${empresa.nombre}</div>
      <div><strong>RUT:</strong> ${empresa.rut}</div>
      <div><strong>Banco:</strong> ${empresa.banco}</div>
      <div><strong>Tipo de Cuenta:</strong> ${empresa.tipoCuenta}</div>
    </div>
  </div>

  <!-- Items -->
  <div class="items-section">
    <h3>Hogar - Cocinas</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 10%;">N° MUEBLE</th>
          <th style="width: 50%;">DESCRIPCIÓN</th>
          <th style="width: 8%;">Uni</th>
          <th style="width: 16%;">Precio U.</th>
          <th style="width: 16%;">Precio total</th>
        </tr>
      </thead>
      <tbody>
        ${filasItems}
      </tbody>
    </table>
  </div>

  <!-- Resumen -->
  <div class="summary">
    <div class="summary-row">
      <span>Sub Total Neto:</span>
      <span>$${subtotalNeto.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
    </div>
    <div class="summary-row">
      <span>IVA:</span>
      <span>$${ivaCalculado.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
    </div>
    <div class="summary-row total">
      <span>TOTAL:</span>
      <span>$${totalFinal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
    </div>
  </div>

  <!-- Condiciones -->
  <div class="conditions">
    <h3>CONDICIONES:</h3>
    <ul>
      <li>Incluye transporte dentro de la Región Metropolitana.</li>
      <li>Validez de la cotización: 7 días, considerando la fecha de inicio cuando el cliente paga el 50%.</li>
      <li>No incluye Obra Gris (demolición de muros, retiro de escombros).</li>
      <li>Los accesorios adicionales fuera de la cotización corren por cuenta del cliente. Retirar muebles puede variar la cotización.</li>
    </ul>
  </div>

  <!-- Condiciones de Pago -->
  <div class="payment-section">
    <h3>CONDICIONES DE PAGO</h3>
    <div class="payment-row">
      <span><strong>Anticipo:</strong></span>
      <span>$${(totalFinal * 0.5).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
    </div>
    <div class="payment-row">
      <span><strong>Saldo:</strong></span>
      <span>$${(totalFinal * 0.5).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
    </div>
  </div>

  <!-- Botón de impresión -->
  <button class="print-button no-print" onclick="window.print()">
    🖨️ Imprimir / Guardar como PDF
  </button>
</body>
</html>
  `;

  return html;
}

/**
 * Abre el PDF en una nueva ventana
 */
export function abrirPDF(datos: DatosCotizacion): void {
  const html = generarHTMLPDF(datos);
  const ventana = window.open('', '_blank');
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  }
}

