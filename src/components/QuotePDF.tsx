/**
 * Componente React para generar PDF de cotización profesional
 * Diseño basado en plantilla de Mueblería Casa Blanca
 */
import React from 'react';

interface QuoteItem {
  concepto: string;
  precio: number;
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
          background: rgba(255, 255, 255, 0.9);
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 15px;
        }

        .info-row {
          margin-bottom: 8px;
          font-size: 13px;
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


        /* Economic summary */
        .economic-summary {
          position: relative;
          z-index: 10;
          background: rgba(255, 255, 255, 0.95);
          margin: 0 40px 20px;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .summary-title {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          text-align: center;
        }

        .summary-table {
          width: 100%;
          border-collapse: collapse;
        }

        .summary-table td {
          padding: 8px;
          font-size: 12px;
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
          padding-top: 10px;
          font-size: 18px;
          font-weight: bold;
          color: #6b2c3e;
        }

        .summary-table tr:last-child td:first-child {
          font-size: 18px;
          color: #6b2c3e;
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
          background: #f5f5f0;
          padding: 6px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 1px solid #d4a574;
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

        /* Footer */
        .quote-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #2c2c2c;
          color: white;
          padding: 15px 40px;
          text-align: center;
          z-index: 10;
        }

        .footer-text {
          font-size: 12px;
          margin-bottom: 6px;
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
      </div>

      {/* Item details */}
      {items.some(item => item.detalles) && (
        <div className="item-details">
          {items.map((item, index) => {
            if (!item.detalles) return null;
            
            const { materiales, servicios, gastos_extras, margen_ganancia, subtotal_antes_margen } = item.detalles;
            
            return (
              <div key={index} className="item-detail-section">
                <div className="item-detail-title">{item.concepto}</div>
                
                {/* Materiales */}
                {materiales && materiales.length > 0 && (
                  <>
                    <div className="detail-section-title">Materiales</div>
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Cantidad</th>
                          <th>Unidad</th>
                          <th>Precio Unit.</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materiales.map((mat, idx) => (
                          <tr key={idx}>
                            <td>{mat.nombre}</td>
                            <td>{mat.cantidad}</td>
                            <td>{mat.unidad}</td>
                            <td>${mat.precio_unitario.toLocaleString('es-CO')}</td>
                            <td>${mat.subtotal.toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                        <tr className="detail-subtotal">
                          <td colSpan={4}>Subtotal Materiales</td>
                          <td>${materiales.reduce((sum, m) => sum + m.subtotal, 0).toLocaleString('es-CO')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
                
                {/* Servicios */}
                {servicios && servicios.length > 0 && (
                  <>
                    <div className="detail-section-title">Servicios / Mano de Obra</div>
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Servicio</th>
                          <th>Horas</th>
                          <th>Precio/Hora</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicios.map((serv, idx) => (
                          <tr key={idx}>
                            <td>{serv.nombre}</td>
                            <td>{serv.horas}</td>
                            <td>${serv.precio_por_hora.toLocaleString('es-CO')}</td>
                            <td>${serv.subtotal.toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                        <tr className="detail-subtotal">
                          <td colSpan={3}>Subtotal Servicios</td>
                          <td>${servicios.reduce((sum, s) => sum + s.subtotal, 0).toLocaleString('es-CO')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
                
                {/* Gastos Extras */}
                {gastos_extras && gastos_extras.length > 0 && (
                  <>
                    <div className="detail-section-title">Gastos Extras</div>
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Concepto</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gastos_extras.map((gasto, idx) => (
                          <tr key={idx}>
                            <td>{gasto.concepto}</td>
                            <td>${gasto.monto.toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                        <tr className="detail-subtotal">
                          <td>Subtotal Gastos Extras</td>
                          <td>${gastos_extras.reduce((sum, g) => sum + g.monto, 0).toLocaleString('es-CO')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
                
                {/* Subtotal antes de margen */}
                {subtotal_antes_margen !== undefined && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#333' }}>
                      <span>Subtotal (antes de margen)</span>
                      <span>${subtotal_antes_margen.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                )}
                
                {/* Margen de ganancia */}
                {margen_ganancia !== undefined && subtotal_antes_margen !== undefined && (
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#666' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Margen de Ganancia ({margen_ganancia.toFixed(1)}%)</span>
                      <span>${((subtotal_antes_margen * margen_ganancia) / 100).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                )}
                
                {/* Total del item */}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '2px solid #d4a574' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: '#6b2c3e' }}>
                    <span>Total {item.concepto}</span>
                    <span>${item.precio.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

