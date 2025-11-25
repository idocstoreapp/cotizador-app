# 📄 Sistema de Generación de PDF Profesional

## ✅ Archivos Creados

### 1. Componente React - `src/components/QuotePDF.tsx`
- Componente React que renderiza la plantilla del PDF
- Diseño profesional basado en la imagen de referencia
- Incluye:
  - Fondo beige/claro
  - Encabezado con logo y nombre de empresa
  - Curvas decorativas en tres tonos (café claro, café medio, vino)
  - Sección de información del cliente
  - Detalles del proyecto
  - Imagen del proyecto
  - Resumen económico en tabla
  - Pie de página oscuro

### 2. Función SSR - `src/utils/renderQuoteToHTML.tsx`
- Convierte el componente React a HTML string
- Usa `react-dom/server` para renderizado del servidor
- Genera HTML completo listo para Puppeteer

### 3. Endpoint API - `src/pages/api/generate-quote-pdf.ts`
- Endpoint POST que genera el PDF usando Puppeteer
- Requiere autenticación
- Valida datos de entrada
- Retorna PDF como `application/pdf`
- Configurado para A4 con márgenes reducidos

### 4. Utilidad del Cliente - `src/utils/pdf.ts`
- `downloadQuotePDF()`: Descarga el PDF
- `openQuotePDF()`: Abre el PDF en nueva ventana
- Manejo de errores incluido

## 🚀 Uso Rápido

```tsx
import { downloadQuotePDF } from '../utils/pdf';

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
  image: 'https://ejemplo.com/imagen.jpg' // Opcional
});
```

## 📋 Dependencias Instaladas

- `puppeteer` - Para generar PDFs desde HTML
- `react-dom` - Para renderizado SSR (ya estaba instalado)

## 🎨 Características del Diseño

- ✅ Fondo beige/claro (#f5f5f0)
- ✅ Curvas decorativas con border-radius
- ✅ Encabezado con logo y nombre de empresa
- ✅ Título centrado "COTIZACIÓN DE COCINA INTEGRAL"
- ✅ Sección de información del cliente
- ✅ Detalles del proyecto (modelo y dimensiones)
- ✅ Imagen del proyecto
- ✅ Tabla de resumen económico
- ✅ Pie de página oscuro con texto centrado
- ✅ Diseño responsive y profesional

## ⚙️ Configuración del PDF

- **Formato**: A4
- **Márgenes**: 0mm (sin márgenes)
- **Background**: Habilitado (printBackground: true)
- **Orientación**: Vertical (portrait)

## 🔒 Seguridad

- Requiere autenticación para generar PDFs
- Validación de datos de entrada
- Manejo de errores robusto

## 📚 Documentación Adicional

Ver `EJEMPLO-USO-PDF.md` para:
- Ejemplos de uso completos
- Integración con cotizaciones existentes
- Personalización de colores
- Solución de problemas

## ⚠️ Notas para Producción

1. **Puppeteer en Vercel**: 
   - Puede requerir configuración especial
   - Considera usar `puppeteer-core` con Chrome Headless
   - O un servicio alternativo como PDFKit

2. **Rendimiento**:
   - La generación de PDF puede tardar 2-5 segundos
   - Considera implementar caché si es necesario

3. **Imágenes**:
   - Deben ser accesibles públicamente
   - O usar base64 para imágenes locales

