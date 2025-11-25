/**
 * Componente React para generar PDF de cotización profesional
 * Diseño basado en plantilla de Mueblería Casa Blanca
 */
import React from 'react';

interface QuoteItem {
  concepto: string;
  precio: number;
}

interface QuotePDFProps {
  clientName: string;
  date: string;
  quoteNumber: string;
  model: string;
  dimensions: string;
  items: QuoteItem[];
  total: number;
  image?: string;
  companyName?: string;
  companyLogo?: string;
}

export default function QuotePDF({
  clientName,
  date,
  quoteNumber,
  model,
  dimensions,
  items,
  total,
  image,
  companyName = 'Mueblería Casa Blanca',
  companyLogo
}: QuotePDFProps) {
  return (
    <div className="quote-pdf-container">
      <style>{`
        .quote-pdf-container {
          width: 210mm;
          min-height: 297mm;
          background: #f5f5f0;
          position: relative;
          font-family: 'Arial', 'Helvetica', sans-serif;
          overflow: hidden;
        }

        /* Curvas decorativas */
        .decorative-curve-1 {
          position: absolute;
          top: -50px;
          right: -100px;
          width: 400px;
          height: 300px;
          background: #d4a574;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          opacity: 0.3;
          transform: rotate(-15deg);
        }

        .decorative-curve-2 {
          position: absolute;
          top: 100px;
          right: -80px;
          width: 350px;
          height: 250px;
          background: #8b6f47;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          opacity: 0.25;
          transform: rotate(10deg);
        }

        .decorative-curve-3 {
          position: absolute;
          top: 200px;
          right: -60px;
          width: 300px;
          height: 200px;
          background: #6b2c3e;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          opacity: 0.2;
          transform: rotate(-5deg);
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

        .company-name {
          font-size: 18px;
          color: #333;
          font-weight: 500;
          padding-left: 20px;
          border-left: 2px solid #d4a574;
        }

        .quote-title {
          text-align: center;
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin: 20px 40px;
          letter-spacing: 1px;
        }

        /* Main content */
        .quote-content {
          position: relative;
          z-index: 10;
          padding: 0 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .left-section {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .info-section {
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .info-row {
          margin-bottom: 12px;
          font-size: 14px;
        }

        .info-label {
          font-weight: bold;
          color: #333;
          margin-right: 8px;
        }

        .info-value {
          color: #666;
        }

        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #d4a574;
        }

        .project-details {
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .detail-item {
          margin-bottom: 10px;
          font-size: 14px;
          color: #666;
        }

        .detail-item strong {
          color: #333;
        }

        /* Image section */
        .image-section {
          position: relative;
          z-index: 5;
        }

        .project-image {
          width: 100%;
          height: 400px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Economic summary */
        .economic-summary {
          position: relative;
          z-index: 10;
          background: rgba(255, 255, 255, 0.95);
          margin: 0 40px 30px;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .summary-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
          text-align: center;
        }

        .summary-table {
          width: 100%;
          border-collapse: collapse;
        }

        .summary-table td {
          padding: 12px;
          font-size: 14px;
          border-bottom: 1px solid #e0e0e0;
        }

        .summary-table td:first-child {
          color: #666;
          font-weight: 500;
        }

        .summary-table td:last-child {
          text-align: right;
          color: #333;
          font-weight: 600;
        }

        .summary-table tr:last-child td {
          border-bottom: none;
          padding-top: 15px;
          font-size: 20px;
          font-weight: bold;
          color: #6b2c3e;
        }

        .summary-table tr:last-child td:first-child {
          font-size: 20px;
          color: #6b2c3e;
        }

        /* Footer */
        .quote-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #2c2c2c;
          color: white;
          padding: 20px 40px;
          text-align: center;
          z-index: 10;
        }

        .footer-text {
          font-size: 14px;
          margin-bottom: 8px;
        }

        .footer-links {
          font-size: 12px;
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

      {/* Curvas decorativas */}
      <div className="decorative-curve-1"></div>
      <div className="decorative-curve-2"></div>
      <div className="decorative-curve-3"></div>

      {/* Header */}
      <div className="quote-header">
        <div className="logo-section">
          <div>
            <div className="logo-text">KÜ</div>
            <div className="logo-subtitle">MUEBLES SOBRE MEDIDA</div>
          </div>
        </div>
        <div className="company-name">{companyName}</div>
      </div>

      {/* Title */}
      <div className="quote-title">COTIZACIÓN DE COCINA INTEGRAL</div>

      {/* Main content */}
      <div className="quote-content">
        {/* Left section */}
        <div className="left-section">
          {/* Client info */}
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Cliente:</span>
              <span className="info-value">{clientName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Fecha:</span>
              <span className="info-value">{date}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Nº Cotización:</span>
              <span className="info-value">{quoteNumber}</span>
            </div>
          </div>

          {/* Project details */}
          <div className="project-details">
            <div className="section-title">Detalles del Proyecto</div>
            <div className="detail-item">
              <strong>• Modelo:</strong> {model}
            </div>
            <div className="detail-item">
              <strong>• Dimensiones:</strong> {dimensions}
            </div>
          </div>
        </div>

        {/* Image section */}
        <div className="image-section">
          {image ? (
            <img src={image} alt="Proyecto de cocina" className="project-image" />
          ) : (
            <div className="project-image" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px'
            }}>
              Imagen del Proyecto
            </div>
          )}
        </div>
      </div>

      {/* Economic summary */}
      <div className="economic-summary">
        <div className="summary-title">RESUMEN ECONÓMICO</div>
        <table className="summary-table">
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.concepto}</td>
                <td>${item.precio.toLocaleString('es-CO')}</td>
              </tr>
            ))}
            <tr>
              <td>TOTAL</td>
              <td>${total.toLocaleString('es-CO')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="quote-footer">
        <div className="footer-text">Gracias por confiar en nosotros.</div>
        <div className="footer-links">
          www.kay.com.mx | www.muebleriacasablanca.mx
        </div>
      </div>
    </div>
  );
}

