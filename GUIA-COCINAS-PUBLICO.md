# 🍳 Guía: Sistema de Catálogo Público de Cocinas

## 📋 Resumen del Sistema

Este sistema permite crear una página pública donde usuarios pueden:
- Ver el catálogo de cocinas sin necesidad de autenticación
- Cotizar cocinas con todas las opciones personalizadas
- Enviar la cotización por WhatsApp, Email o Formulario de contacto
- El admin puede ver un historial de todas las cotizaciones públicas

## 🗄️ Estructura de Base de Datos Necesaria

### Tabla: `cotizaciones_publicas`

```sql
CREATE TABLE IF NOT EXISTS cotizaciones_publicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Datos de contacto del cliente
  nombre_cliente TEXT NOT NULL,
  email_cliente TEXT,
  telefono_cliente TEXT,
  mensaje_cliente TEXT,
  
  -- Datos de la cotización
  items JSONB NOT NULL, -- Array de items cotizados
  subtotal DECIMAL(10, 2) NOT NULL,
  descuento DECIMAL(5, 2) DEFAULT 0,
  iva DECIMAL(5, 2) DEFAULT 19,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Método de contacto preferido
  metodo_contacto TEXT CHECK (metodo_contacto IN ('whatsapp', 'email', 'formulario')),
  
  -- Estado
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'cerrado')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- IP y User Agent para tracking
  ip_address TEXT,
  user_agent TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cotizaciones_publicas_estado ON cotizaciones_publicas(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_publicas_created_at ON cotizaciones_publicas(created_at DESC);
```

## 📁 Archivos a Crear

### 1. Componente Público de Catálogo
- ✅ `src/components/public/CatalogoCocinasPublico.tsx` - Creado
- ⏳ `src/components/public/ProductDetailPublico.tsx` - Pendiente
- ⏳ `src/components/public/CotizadorPublico.tsx` - Pendiente
- ⏳ `src/components/public/EnviarCotizacion.tsx` - Pendiente

### 2. Servicios
- ⏳ `src/services/cotizaciones-publicas.service.ts` - Pendiente

### 3. Páginas
- ✅ `src/pages/cocinas-publico.astro` - Creado
- ⏳ `src/pages/admin/cotizaciones-publicas.astro` - Pendiente

### 4. Componentes Admin
- ⏳ `src/components/admin/CotizacionesPublicasPage.tsx` - Pendiente

## 🔧 Funcionalidades a Implementar

### 1. Catálogo Público
- [x] Mostrar solo cocinas
- [x] Sin autenticación requerida
- [ ] Filtros y búsqueda
- [ ] Diseño responsive

### 2. Cotizador Público
- [ ] Usar el mismo sistema de opciones personalizadas
- [ ] Guardar en tabla `cotizaciones_publicas`
- [ ] No generar PDF, solo mostrar resumen

### 3. Envío de Cotizaciones
- [ ] WhatsApp: Generar link con mensaje pre-formateado
- [ ] Email: Abrir cliente de email con datos
- [ ] Formulario: Mostrar formulario de contacto

### 4. Historial Admin
- [ ] Listar todas las cotizaciones públicas
- [ ] Filtrar por estado
- [ ] Ver detalles completos
- [ ] Marcar como contactado/cerrado

## 📝 Próximos Pasos

1. Crear script SQL para la tabla `cotizaciones_publicas`
2. Crear componente `ProductDetailPublico` (similar a ProductDetail pero sin login)
3. Crear componente `CotizadorPublico` (similar al cotizador pero guarda en tabla pública)
4. Crear componente `EnviarCotizacion` con opciones de WhatsApp/Email/Formulario
5. Crear servicio para guardar cotizaciones públicas
6. Crear página admin para ver historial

## 🔗 Integración con WhatsApp

Para WhatsApp, usar formato:
```
https://wa.me/[NUMERO]?text=[MENSAJE_ENCODED]
```

Ejemplo:
```
https://wa.me/573001234567?text=Hola,%20quiero%20cotizar%20una%20cocina
```

## 📧 Integración con Email

Para Email, usar `mailto:`:
```
mailto:contacto@empresa.com?subject=Cotización%20de%20Cocina&body=[MENSAJE]
```

