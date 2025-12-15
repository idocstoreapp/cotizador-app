/**
 * Componente React para generar PDF de cotización profesional
 * Diseño personalizado por empresa (Kubica y Casablanca)
 */
import React from 'react';

interface QuoteItem {
  concepto: string;
  precio: number;
  cantidad?: number; // Cantidad de unidades
  precio_unitario?: number; // Precio por unidad
  // Detalles opcionales para mostrar desglose
  detalles?: {
    materiales?: Array<{
      nombre: string;
      cantidad: number;
      unidad: string;
      precio_unitario: number;
      subtotal: number;
    }>;
    servicios?: Array<{
      nombre: string;
      horas: number;
      precio_por_hora: number;
      subtotal: number;
    }>;
    gastos_extras?: Array<{
      concepto: string;
      monto: number;
    }>;
    margen_ganancia?: number;
    subtotal_antes_margen?: number;
  };
}

interface EmpresaInfo {
  nombre: string;
  nombreCompleto?: string;
  logo?: string;
  rut?: string;
  direccion?: string;
  emails?: string[];
  telefonos?: string[];
  sitioWeb?: string;
  descripcion?: string;
}

interface QuotePDFProps {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  vendedorName?: string; // Nombre del vendedor
  date: string;
  quoteNumber: string;
  model: string;
  dimensions: string;
  items: QuoteItem[];
  total: number;
  image?: string;
  companyName?: string;
  companyLogo?: string;
  empresaInfo?: EmpresaInfo; // Información completa de la empresa
}

export default function QuotePDF({
  clientName,
  clientEmail,
  clientPhone,
  clientAddress,
  vendedorName,
  date,
  quoteNumber,
  model,
  dimensions,
  items,
  total,
  image,
  companyName = 'Mueblería Casa Blanca',
  companyLogo,
  empresaInfo
}: QuotePDFProps) {
  // Detectar si es Kubica o Casablanca
  const isKubica = companyName?.toUpperCase().includes('KUBICA') || 
                   empresaInfo?.nombre?.toUpperCase().includes('KUBICA');
  
  const isCasablanca = companyName?.toUpperCase().includes('CASABLANCA') || 
                       empresaInfo?.nombre?.toUpperCase().includes('CASABLANCA') ||
                       companyName?.toUpperCase().includes('CASA BLANCA') ||
                       empresaInfo?.nombre?.toUpperCase().includes('CASA BLANCA');

  // Colores de Kubica (basados en su diseño web)
  const kubicaColors = {
    primary: '#b4965a',      // Línea de Acento/Ocre RGB(180, 150, 90)
    secondary: '#8b6f47',    // Color secundario (marrón medio para contrastes)
    dark: '#333333',         // Texto Principal/Títulos RGB(51, 51, 51)
    light: '#f5f5f5',        // Fondo Principal RGB(245, 245, 245)
    darkLight: '#d2d2d2',    // Borde de Tarjeta RGB(210, 210, 210)
    rowLight: '#e8e8e8',     // Gris claro para filas alternadas
    rowDark: '#d0d0d0'       // Gris un poco más oscuro para filas alternadas
  };

  // Colores de Mueblería Casa Blanca (negro, blanco y amarillo para detalles)
  const casablancaColors = {
    primary: '#000000',       // Negro (principal)
    secondary: '#ffffff',     // Blanco (principal)
    dark: '#000000',          // Negro (textos)
    light: '#ffffff',         // Blanco (fondos)
    darkLight: '#f5f5f5',     // Gris muy claro para filas alternadas
    accent: '#dfa135'         // Amarillo para detalles/acentos (#ffd700 = gold)
  };

  // Filtrar items que son totales, subtotales, IVA, etc. para no mostrarlos en la tabla principal
  // Solo mostrar items reales de la cotización (no cálculos)
  const regularItems = items.filter(item => {
    const conceptoUpper = item.concepto.toUpperCase();
    // Excluir solo items que son claramente cálculos o totales
    // Ser más específico para no eliminar items válidos
    const esCalculo = conceptoUpper === 'TOTAL' ||
                      conceptoUpper === 'SUBTOTAL MATERIALES' ||
                      conceptoUpper === 'SUBTOTAL SERVICIOS' ||
                      conceptoUpper === 'SUBTOTAL' ||
                      conceptoUpper.startsWith('IVA') ||
                      conceptoUpper.startsWith('MARGEN DE GANANCIA') ||
                      conceptoUpper.startsWith('DESCUENTO') ||
                      conceptoUpper === 'COTIZACIÓN COMPLETA';
    
    return !esCalculo;
  });
  
  // Si no hay items después del filtro, mostrar todos excepto TOTAL final
  // Esto puede pasar cuando se genera desde historial con "Cotización Completa"
  const itemsAMostrar = regularItems.length > 0 
    ? regularItems 
    : items.filter(item => item.concepto.toUpperCase() !== 'TOTAL');

  // Calcular subtotal (suma de todos los items regulares)
  const subtotal = itemsAMostrar.reduce((sum, item) => sum + item.precio, 0);

  // Buscar IVA en los items filtrados
  const ivaItem = items.find(item => {
    const conceptoUpper = item.concepto.toUpperCase();
    return conceptoUpper.startsWith('IVA') || conceptoUpper.includes('IVA');
  });
  const iva = ivaItem ? ivaItem.precio : 0;

  // Determinar qué empresa es para aplicar estilos
  const empresaStyle = isKubica ? 'kubica' : (isCasablanca ? 'casablanca' : 'default');
  const empresaColors = isKubica ? kubicaColors : (isCasablanca ? casablancaColors : kubicaColors);

  return (
    <div className={`quote-pdf-container ${empresaStyle}-style`}>
      <style>{`
        .quote-pdf-container {
          width: 210mm;
          min-height: 297mm;
          background: ${isKubica ? '#f5f5f5' : (isCasablanca ? '#f5f5f5' : '#f5f5f0')};
          position: relative;
          font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'Arial', 'Helvetica', sans-serif;
          overflow: hidden;
          padding-bottom: ${(isKubica || isCasablanca) ? '120px' : '80px'};
        }
        
        /* Asegurar que los emojis se rendericen correctamente */
        * {
          -webkit-font-feature-settings: "liga" on, "calt" on;
          font-feature-settings: "liga" on, "calt" on;
        }

        /* Líneas curvas decorativas horizontales */
        .decorative-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          z-index: 1;
          opacity: 0.15;
        }

        .decorative-line-1 {
          top: 80px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            ${empresaColors.primary} 10%, 
            ${empresaColors.primary} 90%, 
            transparent 100%);
          border-radius: 0 0 50% 50%;
          transform: scaleY(1.5);
        }

        .decorative-line-2 {
          top: 180px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            ${empresaColors.secondary} 15%, 
            ${empresaColors.secondary} 85%, 
            transparent 100%);
          border-radius: 0 0 50% 50%;
          transform: scaleY(1.3);
        }

        .decorative-line-3 {
          top: 280px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            ${empresaColors.dark} 20%, 
            ${empresaColors.dark} 80%, 
            transparent 100%);
          border-radius: 0 0 50% 50%;
          transform: scaleY(1.2);
        }

        .decorative-line-4 {
          top: 380px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            ${empresaColors.primary} 12%, 
            ${empresaColors.primary} 88%, 
            transparent 100%);
          border-radius: 0 0 50% 50%;
          transform: scaleY(1.4);
        }

        .decorative-line-5 {
          top: 480px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            ${empresaColors.secondary} 18%, 
            ${empresaColors.secondary} 82%, 
            transparent 100%);
          border-radius: 0 0 50% 50%;
          transform: scaleY(1.3);
        }

        .decorative-line-6 {
          top: 580px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            ${empresaColors.dark} 15%, 
            ${empresaColors.dark} 85%, 
            transparent 100%);
          border-radius: 0 0 50% 50%;
          transform: scaleY(1.25);
        }

        /* Header */
        .quote-header {
          position: relative;
          z-index: 10;
          padding: 30px 40px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .logo-text {
          font-size: 32px;
          font-weight: bold;
          color: #333;
          letter-spacing: 2px;
        }

        .logo-subtitle {
          font-size: 12px;
          color: #666;
          margin-top: -5px;
          letter-spacing: 1px;
        }

        .company-info-section {
          flex: 1;
          padding-left: 20px;
          padding-right: 10px;
          border-left: 2px solid #d4a574;
        }

        .company-name {
          font-size: 18px;
          color: #333;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .company-details {
          font-size: 10px;
          color: #666;
          line-height: 1.6;
          padding: 5px 0;
        }

        .company-detail-line {
          margin-bottom: 4px;
          padding: 2px 0;
        }

        /* Número de orden y fecha en esquina superior derecha (solo Kubica) */
        .quote-number-date {
          position: absolute;
          top: 30px;
          right: 40px;
          z-index: 20;
          text-align: right;
        }

        .quote-number-large {
          font-size: 36px;
          font-weight: bold;
          color: ${empresaColors.dark};
          margin-bottom: 5px;
          letter-spacing: 1px;
        }

        .quote-date {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        /* Ocultar nombre de empresa en grande para Kubica y Casablanca */
        .kubica-style .company-name,
        .casablanca-style .company-name {
          display: none;
        }

        .quote-title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin: 15px 40px;
          letter-spacing: 1px;
        }

        /* Main content */
        .quote-content {
          position: relative;
          z-index: 10;
          padding: 0 40px;
          margin-bottom: 20px;
        }

        .info-section {
          background: ${(isKubica || isCasablanca) ? empresaColors.light : 'rgba(255, 255, 255, 0.9)'};
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 15px;
          border: ${(isKubica || isCasablanca) ? `2px solid ${empresaColors.primary}` : 'none'};
          position: relative;
        }

        .vendedor-section {
          position: absolute;
          right: 40px;
          top: 15px;
          background: ${(isKubica || isCasablanca) ? empresaColors.light : 'rgba(255, 255, 255, 0.9)'};
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: ${(isKubica || isCasablanca) ? `2px solid ${empresaColors.primary}` : 'none'};
          min-width: 200px;
          text-align: right;
        }

        .vendedor-label {
          font-weight: bold;
          color: ${(isKubica || isCasablanca) ? empresaColors.dark : '#333'};
          margin-bottom: 4px;
          font-size: 13px;
        }

        .vendedor-value {
          color: ${(isKubica || isCasablanca) ? empresaColors.dark : '#666'};
          font-weight: 600;
          font-size: 13px;
        }

        .info-row {
          margin-bottom: 8px;
          font-size: 13px;
        }

        .info-label {
          font-weight: bold;
          color: ${(isKubica || isCasablanca) ? empresaColors.dark : '#333'};
          margin-right: 8px;
        }

        .info-value {
          color: ${(isKubica || isCasablanca) ? empresaColors.dark : '#666'};
          font-weight: ${(isKubica || isCasablanca) ? '600' : 'normal'};
        }

        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #d4a574;
        }

        /* Economic summary - Estilos mejorados para Kubica y Casablanca */
        .economic-summary {
          position: relative;
          z-index: 10;
          background: ${isKubica ? empresaColors.primary : (isCasablanca ? casablancaColors.secondary : 'rgba(255, 255, 255, 0.95)')};
          margin: 0 40px 20px;
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: ${isCasablanca ? `3px solid ${casablancaColors.accent}` : 'none'};
        }

        /* Esquinas estilizadas con triángulos y detalles pixelados */
        .corner-decoration {
          position: absolute;
          width: 0;
          height: 0;
          z-index: 1;
        }

        .corner-top-left {
          top: 0;
          left: 0;
          border-top: 30px solid ${isKubica ? empresaColors.secondary : (isCasablanca ? casablancaColors.accent : empresaColors.secondary)};
          border-right: 30px solid transparent;
        }

        .corner-top-left::before {
          content: '';
          position: absolute;
          top: -30px;
          left: 0;
          width: 20px;
          height: 20px;
          background: ${isKubica ? empresaColors.dark : (isCasablanca ? casablancaColors.dark : empresaColors.dark)};
          clip-path: polygon(0 0, 100% 0, 0 100%, 20% 80%, 0 60%);
        }

        .corner-top-left::after {
          content: '';
          position: absolute;
          top: -25px;
          left: 5px;
          width: 8px;
          height: 8px;
          background: ${isKubica ? empresaColors.primary : (isCasablanca ? casablancaColors.accent : empresaColors.primary)};
          clip-path: polygon(0 0, 100% 0, 50% 100%);
        }

        .corner-top-right {
          top: 0;
          right: 0;
          border-top: 30px solid ${isKubica ? empresaColors.secondary : (isCasablanca ? casablancaColors.accent : empresaColors.secondary)};
          border-left: 30px solid transparent;
        }

        .corner-top-right::before {
          content: '';
          position: absolute;
          top: -30px;
          right: 0;
          width: 20px;
          height: 20px;
          background: ${isKubica ? empresaColors.dark : (isCasablanca ? casablancaColors.dark : empresaColors.dark)};
          clip-path: polygon(100% 0, 100% 100%, 0 0, 80% 20%, 100% 40%);
        }

        .corner-top-right::after {
          content: '';
          position: absolute;
          top: -25px;
          right: 5px;
          width: 8px;
          height: 8px;
          background: ${isKubica ? empresaColors.primary : (isCasablanca ? casablancaColors.accent : empresaColors.primary)};
          clip-path: polygon(0 0, 100% 0, 50% 100%);
        }

        .corner-bottom-left {
          bottom: 0;
          left: 0;
          border-bottom: 30px solid ${isKubica ? empresaColors.secondary : (isCasablanca ? casablancaColors.accent : empresaColors.secondary)};
          border-right: 30px solid transparent;
        }

        .corner-bottom-left::before {
          content: '';
          position: absolute;
          bottom: -30px;
          left: 0;
          width: 20px;
          height: 20px;
          background: ${isKubica ? empresaColors.dark : (isCasablanca ? casablancaColors.dark : empresaColors.dark)};
          clip-path: polygon(0 100%, 100% 100%, 0 0, 20% 80%, 0 60%);
        }

        .corner-bottom-left::after {
          content: '';
          position: absolute;
          bottom: -25px;
          left: 5px;
          width: 8px;
          height: 8px;
          background: ${isKubica ? empresaColors.primary : (isCasablanca ? casablancaColors.accent : empresaColors.primary)};
          clip-path: polygon(0 100%, 100% 100%, 50% 0);
        }

        .corner-bottom-right {
          bottom: 0;
          right: 0;
          border-bottom: 30px solid ${isKubica ? empresaColors.secondary : (isCasablanca ? casablancaColors.accent : empresaColors.secondary)};
          border-left: 30px solid transparent;
        }

        .corner-bottom-right::before {
          content: '';
          position: absolute;
          bottom: -30px;
          right: 0;
          width: 20px;
          height: 20px;
          background: ${isKubica ? empresaColors.dark : (isCasablanca ? casablancaColors.dark : empresaColors.dark)};
          clip-path: polygon(100% 100%, 100% 0, 0 100%, 80% 80%, 100% 60%);
        }

        .corner-bottom-right::after {
          content: '';
          position: absolute;
          bottom: -25px;
          right: 5px;
          width: 8px;
          height: 8px;
          background: ${isKubica ? empresaColors.primary : (isCasablanca ? casablancaColors.accent : empresaColors.primary)};
          clip-path: polygon(0 100%, 100% 100%, 50% 0);
        }

        .summary-title {
          font-size: 16px;
          font-weight: bold;
          color: ${isKubica ? '#fff' : (isCasablanca ? '#000000' : '#333')};
          margin: 20px 20px 0 20px;
          padding-bottom: 15px;
          text-align: center;
          position: relative;
          z-index: 2;
          border-bottom: ${isKubica ? `3px solid ${empresaColors.dark}` : (isCasablanca ? `3px solid ${casablancaColors.accent}` : '2px solid #e5e7eb')};
          box-shadow: ${(isKubica || isCasablanca) ? `0 2px 4px rgba(0, 0, 0, 0.2)` : '0 1px 2px rgba(0, 0, 0, 0.1)'};
        }

        .summary-table {
          width: 100%;
          border-collapse: collapse;
          position: relative;
          z-index: 2;
          margin-top: 5px;
        }

        .summary-table th {
          padding: 12px 15px;
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 12px;
          font-weight: bold;
          text-align: left;
          color: ${isKubica ? '#fff' : (isCasablanca ? '#000000' : '#333')};
          background-color: ${isKubica ? empresaColors.dark : (isCasablanca ? casablancaColors.accent : '#f3f4f6')};
          border-bottom: 2px solid ${isKubica ? empresaColors.secondary : (isCasablanca ? casablancaColors.dark : '#e5e7eb')};
        }

        .summary-table th:last-child {
          text-align: right;
        }

        .summary-table td {
          padding: 14px 15px;
          font-family: 'Arial', 'Helvetica', sans-serif;
          vertical-align: top;
          font-size: 14px !important; /* Tamaño base consistente */
        }

        .summary-table td:last-child {
          text-align: right;
        }

        /* Filas intercaladas con colores claro/oscuro alternados */
        .kubica-style .summary-table tbody tr:nth-child(odd) {
          background-color: ${kubicaColors.rowLight};
        }

        .kubica-style .summary-table tbody tr:nth-child(even) {
          background-color: ${kubicaColors.rowDark};
        }

        .casablanca-style .summary-table tbody tr:nth-child(odd) {
          background-color: ${casablancaColors.light};
        }

        .casablanca-style .summary-table tbody tr:nth-child(even) {
          background-color: ${casablancaColors.darkLight};
        }

        .summary-table td:first-child {
          color: ${isKubica ? '#000000' : (isCasablanca ? '#000000' : '#333')};
          font-weight: normal;
          font-size: 14px !important; /* Tamaño consistente */
        }

        /* Estilos para el contenido del item - TAMAÑOS FIJOS */
        .item-title {
          font-size: 14px !important;
          font-weight: bold !important;
          color: ${isKubica ? '#000000' : (isCasablanca ? '#000000' : '#333')} !important;
          margin-bottom: 4px;
          line-height: 1.3;
          font-family: 'Arial', 'Helvetica', sans-serif !important;
          display: block;
        }

        .item-description {
          font-size: 11px !important;
          color: ${isKubica ? '#000000' : (isCasablanca ? '#000000' : '#666')} !important;
          line-height: 1.4;
          font-family: 'Arial', 'Helvetica', sans-serif !important;
          margin-top: 2px;
          display: block;
        }

        .summary-table td:last-child {
          text-align: right;
          color: ${isKubica ? '#000000' : (isCasablanca ? '#000000' : '#333')} !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          font-family: 'Arial', 'Helvetica', sans-serif !important;
          vertical-align: middle;
          white-space: nowrap; /* Evitar que el precio se divida en líneas */
        }

        /* Detalles de items */
        .item-details {
          margin-top: 20px;
          margin-bottom: 30px;
        }

        .item-detail-section {
          background: rgba(255, 255, 255, 0.95);
          margin: 0 40px 15px;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .item-detail-title {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid #d4a574;
        }

        .detail-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }

        .detail-table th {
          background: ${isKubica ? '#f5f5f5' : (isCasablanca ? '#f5f5f5' : '#f5f5f0')};
          padding: 6px;
          text-align: left;
          font-weight: 600;
          color: ${isKubica ? '#333333' : '#333'};
          border-bottom: 1px solid ${isKubica ? '#b4965a' : '#d4a574'};
          font-size: 10px;
        }

        .detail-table td {
          padding: 5px;
          border-bottom: 1px solid #e0e0e0;
          color: #666;
          font-size: 10px;
        }

        .detail-table td:last-child {
          text-align: right;
          font-weight: 500;
        }

        .detail-subtotal {
          font-weight: 600;
          color: #333;
          background: #f9f9f9;
        }

        .detail-section-title {
          font-size: 11px;
          font-weight: 600;
          color: #8b6f47;
          margin-top: 10px;
          margin-bottom: 6px;
          padding-left: 5px;
          border-left: 3px solid #d4a574;
        }

        /* Footer - Total en cuadro para Kubica y Casablanca */
        .quote-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: ${isKubica ? '#fafafa' : (isCasablanca ? empresaColors.light : '#f5f5f5')};
          color: ${(isKubica || isCasablanca) ? empresaColors.dark : '#333'};
          padding: ${(isKubica || isCasablanca) ? '25px 40px 280px 40px' : '15px 40px'};
          text-align: center;
          z-index: 10;
          min-height: ${(isKubica || isCasablanca) ? '300px' : 'auto'};
        }

        .footer-text {
          font-size: 12px;
          margin-bottom: 6px;
        }

        /* Cuadro de subtotal e IVA para Kubica y Casablanca */
        .subtotal-iva-box {
          background: ${isKubica ? empresaColors.light : (isCasablanca ? casablancaColors.secondary : '#fff')};
          padding: 12px 20px;
          border-radius: 4px;
          position: absolute;
          right: 40px;
          bottom: 120px;
          min-width: 250px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: ${isKubica ? `2px solid ${empresaColors.primary}` : (isCasablanca ? `2px solid ${casablancaColors.accent}` : '1px solid #ddd')};
          z-index: 11;
        }

        .subtotal-iva-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 13px;
        }

        .subtotal-iva-row:last-child {
          margin-bottom: 0;
          padding-top: 6px;
          border-top: 1px solid ${isKubica ? empresaColors.darkLight : (isCasablanca ? casablancaColors.darkLight : '#ddd')};
        }

        .subtotal-iva-label {
          color: ${isKubica ? empresaColors.dark : (isCasablanca ? casablancaColors.dark : '#333')};
          font-weight: 600;
        }

        .subtotal-iva-value {
          color: ${isKubica ? empresaColors.dark : (isCasablanca ? casablancaColors.dark : '#333')};
          font-weight: bold;
        }

        /* Cuadro de total para Kubica y Casablanca - esquina derecha */
        .total-box {
          background: ${isCasablanca ? casablancaColors.accent : empresaColors.secondary};
          padding: 20px 30px;
          border-radius: 4px;
          position: absolute;
          right: 40px;
          bottom: 25px;
          min-width: 250px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 12;
        }

        .total-label {
          font-size: 16px;
          font-weight: bold;
          color: ${isCasablanca ? empresaColors.dark : '#fff'};
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .total-amount {
          font-size: 28px;
          font-weight: bold;
          color: ${isCasablanca ? empresaColors.dark : '#fff'};
          text-align: right;
        }

        .footer-links {
          font-size: 11px;
          color: #d4a574;
        }

        .footer-links a {
          color: #d4a574;
          text-decoration: none;
        }

        /* Print styles */
        @media print {
          .quote-pdf-container {
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
        }
      `}</style>

      {/* Líneas curvas decorativas horizontales */}
      <div className="decorative-line decorative-line-1"></div>
      <div className="decorative-line decorative-line-2"></div>
      <div className="decorative-line decorative-line-3"></div>
      <div className="decorative-line decorative-line-4"></div>
      <div className="decorative-line decorative-line-5"></div>
      <div className="decorative-line decorative-line-6"></div>

      {/* Número de orden y fecha en esquina superior derecha (Kubica y Casablanca) */}
      {(isKubica || isCasablanca) && (
        <div className="quote-number-date">
          <div className="quote-number-large">{quoteNumber}</div>
          <div className="quote-date">{date}</div>
        </div>
      )}

      {/* Header */}
      <div className="quote-header">
        <div className="logo-section">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt={companyName || 'Logo'} 
              style={{ 
                maxHeight: '80px', 
                maxWidth: '200px', 
                objectFit: 'contain',
                display: 'block',
                height: 'auto',
                width: 'auto'
              }}
              onError={(e) => {
                console.error('Error al cargar logo:', companyLogo);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div>
              <div className="logo-text">KÜ</div>
              <div className="logo-subtitle">MUEBLES SOBRE MEDIDA</div>
            </div>
          )}
        </div>
        <div className="company-info-section">
          {!(isKubica || isCasablanca) && <div className="company-name">{companyName}</div>}
          {empresaInfo && (
            <div className="company-details">
              {empresaInfo.nombreCompleto && empresaInfo.rut && (
                <div className="company-detail-line">
                  {empresaInfo.nombreCompleto} / {empresaInfo.rut}
                </div>
              )}
              {empresaInfo.direccion && (
                <div className="company-detail-line">{empresaInfo.direccion}</div>
              )}
              {empresaInfo.descripcion && (
                <div className="company-detail-line">{empresaInfo.descripcion}</div>
              )}
              {empresaInfo.telefonos && empresaInfo.telefonos.length > 0 && (
                <div className="company-detail-line">
                  <span style={{ 
                    display: 'inline-block', 
                    width: '16px', 
                    height: '16px',
                    marginRight: '6px', 
                    verticalAlign: 'middle',
                    lineHeight: '1'
                  }} dangerouslySetInnerHTML={{ __html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="${empresaColors.primary}" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>` }}></span> {empresaInfo.telefonos[0]}
                </div>
              )}
              {empresaInfo.emails && empresaInfo.emails.length > 0 && (
                <div className="company-detail-line">
                  <span style={{ 
                    display: 'inline-block', 
                    width: '16px', 
                    height: '16px',
                    marginRight: '6px', 
                    verticalAlign: 'middle',
                    lineHeight: '1'
                  }} dangerouslySetInnerHTML={{ __html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="${empresaColors.primary}" xmlns="http://www.w3.org/2000/svg"><path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM4 5.86852V19H20V5.86852L12 12.3685L4 5.86852ZM4.74107 5L12 11.6315L19.2589 5H4.74107Z"/></svg>` }}></span> {empresaInfo.emails[0]}
                </div>
              )}
              {empresaInfo.sitioWeb && (
                <div className="company-detail-line">
                  <span style={{ 
                    display: 'inline-block', 
                    width: '16px', 
                    height: '16px',
                    marginRight: '6px', 
                    verticalAlign: 'middle',
                    lineHeight: '1'
                  }} dangerouslySetInnerHTML={{ __html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="${empresaColors.primary}" stroke-width="2" fill="none"/><path d="M12 8V16M8 12H16" stroke="${empresaColors.primary}" stroke-width="2" stroke-linecap="round"/></svg>` }}></span> {empresaInfo.sitioWeb.startsWith('http') ? empresaInfo.sitioWeb : `https://${empresaInfo.sitioWeb}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title - Solo mostrar si hay un modelo específico y no es el genérico */}
      {model && model !== 'Cocina Integral' && model !== 'Dimensiones del proyecto' && (
        <div className="quote-title">COTIZACIÓN - {model.toUpperCase()}</div>
      )}

      {/* Main content */}
      <div className="quote-content">
        {/* Client info */}
        <div className="info-section">
          {!(isKubica || isCasablanca) && (
            <>
              <div className="info-row">
                <span className="info-label">Cliente:</span>
                <span className="info-value">{clientName}</span>
              </div>
              {clientEmail && (
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{clientEmail}</span>
                </div>
              )}
              {clientPhone && (
                <div className="info-row">
                  <span className="info-label">Teléfono:</span>
                  <span className="info-value">{clientPhone}</span>
                </div>
              )}
              {clientAddress && (
                <div className="info-row">
                  <span className="info-label">Dirección:</span>
                  <span className="info-value">{clientAddress}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Fecha:</span>
                <span className="info-value">{date}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Nº Cotización:</span>
                <span className="info-value">{quoteNumber}</span>
              </div>
            </>
          )}
          {(isKubica || isCasablanca) && (
            <>
              <div className="info-row">
                <span className="info-label">Cliente:</span>
                <span className="info-value">{clientName}</span>
              </div>
              {clientEmail && (
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{clientEmail}</span>
                </div>
              )}
              {clientPhone && (
                <div className="info-row">
                  <span className="info-label">Teléfono:</span>
                  <span className="info-value">{clientPhone}</span>
                </div>
              )}
              {clientAddress && (
                <div className="info-row">
                  <span className="info-label">Dirección:</span>
                  <span className="info-value">{clientAddress}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Vendedor - Fuera del cuadro, a la derecha */}
        {vendedorName && (
          <div className="vendedor-section">
            <div className="vendedor-label">Vendedor:</div>
            <div className="vendedor-value">{vendedorName}</div>
          </div>
        )}
      </div>

      {/* Economic summary */}
      <div className="economic-summary">
        {/* Esquinas estilizadas con triángulos */}
        <div className="corner-decoration corner-bottom-left"></div>
        <div className="corner-decoration corner-bottom-right"></div>
        
        <div className="summary-title">
          {isKubica ? 'MOBILIARIOS - RETAIL - PROTOTIPOS' : (isCasablanca ? 'COCINAS - MUEBLES - CLOSETS' : 'RESUMEN ECONÓMICO')}
        </div>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: 'center', width: '80px' }}>Cantidad</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Precio Unit.</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {itemsAMostrar.map((item, index) => {
              // Separar nombre y descripción del concepto
              let titulo = item.concepto;
              let descripcion = '';
              
              // Si el concepto tiene descripción separada (formato "Nombre - Descripción")
              const partes = titulo.split(' - ');
              if (partes.length > 1) {
                titulo = partes[0].trim();
                descripcion = partes.slice(1).join(' - ').trim();
              }
              
              // Si hay paréntesis, extraer la descripción
              const matchParentesis = titulo.match(/^(.+?)\s*\((.+?)\)\s*$/);
              if (matchParentesis && !descripcion) {
                titulo = matchParentesis[1].trim();
                descripcion = matchParentesis[2].trim();
              }
              
              // Calcular cantidad y precio unitario
              const cantidad = item.cantidad || 1;
              const precioUnitario = item.precio_unitario || (item.precio / cantidad);
              const totalItem = item.precio;
              
              return (
                <tr key={index}>
                  <td style={{ maxWidth: '300px' }}>
                    <div className="item-title">{titulo}</div>
                    {descripcion && <div className="item-description">{descripcion}</div>}
                  </td>
                  <td style={{ textAlign: 'center', color: (isKubica || isCasablanca) ? '#000000' : 'inherit' }}>{cantidad}</td>
                  <td style={{ textAlign: 'right', color: (isKubica || isCasablanca) ? '#000000' : 'inherit' }}>${precioUnitario.toLocaleString('es-CO')}</td>
                  <td style={{ textAlign: 'right', color: (isKubica || isCasablanca) ? '#000000' : 'inherit' }}>${totalItem.toLocaleString('es-CO')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="quote-footer">
        {(isKubica || isCasablanca) ? (
          <>
            {/* Cuadro de Subtotal e IVA */}
            <div className="subtotal-iva-box">
              <div className="subtotal-iva-row">
                <span className="subtotal-iva-label">Subtotal:</span>
                <span className="subtotal-iva-value">${subtotal.toLocaleString('es-CO')}</span>
              </div>
              {iva > 0 && (
                <div className="subtotal-iva-row">
                  <span className="subtotal-iva-label">IVA:</span>
                  <span className="subtotal-iva-value">${iva.toLocaleString('es-CO')}</span>
                </div>
              )}
            </div>

            <div className="total-box">
              <div className="total-label">Total</div>
              <div className="total-amount">${total.toLocaleString('es-CO')}</div>
            </div>
            
            {/* Tabla de Condiciones de Pago */}
            <div style={{ 
              position: 'absolute', 
              left: '40px', 
              bottom: '25px', 
              width: '550px',
              background: 'white',
              borderRadius: '4px',
              padding: '10px 15px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                padding: '8px',
                marginBottom: '8px',
                textAlign: 'center',
                border: 'none'
              }}>
                <div style={{ 
                  padding: '4px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: empresaColors.dark,
                  border: 'none'
                }}>
                  CONDICIONES DE PAGO
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '6px 8px', 
                      textAlign: 'left', 
                      borderBottom: `2px dotted ${empresaColors.primary}`,
                      fontWeight: 'bold',
                      color: empresaColors.dark,
                      fontSize: '11px'
                    }}>
                      Anticipo
                    </th>
                    <th style={{ 
                      padding: '6px 8px', 
                      textAlign: 'left', 
                      borderBottom: `2px dotted ${empresaColors.primary}`,
                      fontWeight: 'bold',
                      color: empresaColors.dark,
                      fontSize: '11px'
                    }}>
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 8px', borderBottom: `1px dotted ${empresaColors.primary}` }}>50%</td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px dotted ${empresaColors.primary}` }}>50%</td>
                  </tr>
                  <tr style={{ background: empresaColors.primary, color: 'white' }}>
                    <td style={{ padding: '6px 8px', borderBottom: `1px dotted ${empresaColors.secondary}` }}>
                      ${Math.round(total * 0.5).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px dotted ${empresaColors.secondary}` }}>
                      ${Math.round(total * 0.5).toLocaleString('es-CO')}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', fontSize: '10px', color: '#666' }}>días hábiles</td>
                    <td style={{ padding: '4px 8px', fontSize: '10px', color: empresaColors.dark, fontWeight: 'bold' }}>
                      {vendedorName ? `Cod_Vendedor: ${vendedorName}` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Políticas/Condiciones */}
            <div style={{
              position: 'absolute',
              left: '40px',
              bottom: '200px',
              width: 'calc(100% - 500px)',
              background: 'white',
              borderRadius: '4px',
              padding: '10px 15px',
              fontSize: '10px',
              lineHeight: '1.3',
              color: '#333'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: empresaColors.dark, fontSize: '11px' }}>
                CONDICIONES Y POLÍTICAS:
              </div>
              <div style={{ marginBottom: '2px' }}>
                • No incluye Obra Gris (Demoler paredes, remover escombros) • Accesorios adicionales fuera de la cotización van por cuenta del cliente • SACAR MUEBLES PUEDE VARIAR LA COTIZACIÓN
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="footer-text">Gracias por confiar en nosotros.</div>
            <div className="footer-text" style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>
              TOTAL: ${total.toLocaleString('es-CO')}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
