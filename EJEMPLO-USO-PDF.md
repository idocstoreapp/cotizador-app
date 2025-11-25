# 📄 Ejemplo de Uso - Generación de PDF Profesional

## 🎯 Uso Básico

### Desde un Componente React:

```tsx
import { downloadQuotePDF } from '../utils/pdf';

function MiComponente() {
  const handleGenerarPDF = async () => {
    try {
      await downloadQuotePDF({
        clientName: 'Juan Pérez',
        date: '25/11/2024',
        quoteNumber: 'COT-2024-001',
        model: 'Cocina Integral Moderna',
        dimensions: '3.5m x 2.5m',
        items: [
          { concepto: 'Muebles', precio: 25000 },
          { concepto: 'Encimera', precio: 63000 },
          { concepto: 'Electrodomésticos', precio: 28000 },
          { concepto: 'Instalación', precio: 25000 }
        ],
        total: 141000,
        image: 'https://ejemplo.com/imagen-cocina.jpg', // Opcional
        companyName: 'Mueblería Casa Blanca', // Opcional
        companyLogo: 'https://ejemplo.com/logo.png' // Opcional
      });
      
      alert('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar PDF: ' + error.message);
    }
  };

  return (
    <button onClick={handleGenerarPDF}>
      Generar PDF
    </button>
  );
}
```

### Abrir PDF en Nueva Ventana:

```tsx
import { openQuotePDF } from '../utils/pdf';

const handleAbrirPDF = async () => {
  await openQuotePDF({
    clientName: 'Juan Pérez',
    date: '25/11/2024',
    quoteNumber: 'COT-2024-001',
    model: 'Cocina Integral Moderna',
    dimensions: '3.5m x 2.5m',
    items: [
      { concepto: 'Muebles', precio: 25000 },
      { concepto: 'Encimera', precio: 63000 },
      { concepto: 'Electrodomésticos', precio: 28000 },
      { concepto: 'Instalación', precio: 25000 }
    ],
    total: 141000
  });
};
```

## 🔗 Integración con Cotizaciones Existentes

### Ejemplo: Generar PDF desde una Cotización Guardada

```tsx
import { downloadQuotePDF } from '../utils/pdf';
import { obtenerCotizacionPorId } from '../services/cotizaciones.service';

async function generarPDFDesdeCotizacion(cotizacionId: string) {
  // Obtener cotización de la base de datos
  const cotizacion = await obtenerCotizacionPorId(cotizacionId);
  
  // Convertir items a formato del PDF
  const items = [
    ...cotizacion.materiales.map(m => ({
      concepto: `Material: ${m.material?.nombre || 'N/A'}`,
      precio: m.cantidad * m.precio_unitario
    })),
    ...cotizacion.servicios.map(s => ({
      concepto: `Servicio: ${s.servicio?.nombre || 'N/A'}`,
      precio: s.horas * s.precio_por_hora
    }))
  ];

  // Agregar totales
  items.push({
    concepto: 'Subtotal',
    precio: cotizacion.subtotal
  });

  if (cotizacion.margen_ganancia > 0) {
    items.push({
      concepto: `Margen de Ganancia (${cotizacion.margen_ganancia}%)`,
      precio: (cotizacion.subtotal * cotizacion.margen_ganancia) / 100
    });
  }

  items.push({
    concepto: 'IVA (19%)',
    precio: cotizacion.iva
  });

  // Generar PDF
  await downloadQuotePDF({
    clientName: cotizacion.cliente_nombre,
    date: new Date(cotizacion.created_at).toLocaleDateString('es-ES'),
    quoteNumber: cotizacion.numero,
    model: 'Cocina Integral', // Puedes obtener esto de los items
    dimensions: 'Dimensiones del proyecto', // Puedes calcular esto
    items,
    total: cotizacion.total,
    image: cotizacion.imagen_proyecto // Si tienes este campo
  });
}
```

## 📋 Estructura de Datos

### QuotePDFData Interface:

```typescript
interface QuotePDFData {
  clientName: string;        // Nombre del cliente
  date: string;              // Fecha (formato: DD/MM/YYYY)
  quoteNumber: string;       // Número de cotización
  model: string;             // Modelo de cocina
  dimensions: string;        // Dimensiones del proyecto
  items: QuoteItem[];        // Array de items con concepto y precio
  total: number;             // Total de la cotización
  image?: string;            // URL de imagen (opcional)
  companyName?: string;      // Nombre de la empresa (opcional)
  companyLogo?: string;      // URL del logo (opcional)
}

interface QuoteItem {
  concepto: string;          // Nombre del concepto
  precio: number;            // Precio del concepto
}
```

## 🎨 Personalización

### Cambiar Colores de las Curvas:

Edita `src/components/QuotePDF.tsx`:

```tsx
// Café claro
.decorative-curve-1 {
  background: #d4a574; // Cambia este color
}

// Café medio
.decorative-curve-2 {
  background: #8b6f47; // Cambia este color
}

// Vino
.decorative-curve-3 {
  background: #6b2c3e; // Cambia este color
}
```

### Cambiar Nombre de la Empresa:

```tsx
await downloadQuotePDF({
  // ... otros datos
  companyName: 'Tu Empresa',
  companyLogo: 'https://tu-empresa.com/logo.png'
});
```

## ⚠️ Notas Importantes

1. **Puppeteer en Producción**: 
   - En Vercel, Puppeteer puede requerir configuración especial
   - Considera usar `puppeteer-core` con Chrome Headless en producción
   - O usa un servicio externo como PDFKit o PDFMake

2. **Imágenes**:
   - Las imágenes deben ser accesibles públicamente o estar en base64
   - Para imágenes locales, conviértelas a base64 antes de pasarlas

3. **Autenticación**:
   - El endpoint requiere autenticación
   - Asegúrate de que el usuario esté autenticado antes de llamar a la función

4. **Tamaño del PDF**:
   - El PDF está configurado para A4
   - Los márgenes están en 0mm para aprovechar todo el espacio
   - Ajusta según tus necesidades

## 🐛 Solución de Problemas

### Error: "Puppeteer no se puede ejecutar"
- En desarrollo local, asegúrate de tener Chrome/Chromium instalado
- En producción (Vercel), considera usar un servicio alternativo o configurar Puppeteer correctamente

### Error: "No autenticado"
- Verifica que el usuario esté autenticado
- Revisa las cookies de sesión

### Error: "Faltan datos requeridos"
- Verifica que todos los campos requeridos estén presentes
- Revisa que `items` sea un array con al menos un elemento

