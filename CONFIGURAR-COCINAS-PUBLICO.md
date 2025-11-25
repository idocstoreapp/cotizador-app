# 🍳 Configuración del Catálogo Público de Cocinas

## 📋 Pasos para Configurar

### 1. Ejecutar Script SQL

Ejecuta el archivo `crear-cotizaciones-publicas.sql` en Supabase:

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `crear-cotizaciones-publicas.sql`
4. Ejecuta el script
5. Verifica que la tabla `cotizaciones_publicas` se haya creado correctamente

### 2. Configurar Variables de Contacto

Edita el archivo `src/config/public.ts` y actualiza los siguientes valores:

```typescript
export const CONFIG_PUBLICO = {
  // ⚠️ CAMBIAR ESTOS VALORES
  whatsapp: {
    numero: '573001234567', // Tu número de WhatsApp con código de país (sin + ni espacios)
    mensajeInicial: 'Hola, quiero cotizar una cocina'
  },
  
  email: {
    direccion: 'contacto@tudominio.com', // Tu email de contacto
    asunto: 'Cotización de Cocina desde Catálogo Público'
  },
  
  empresa: {
    nombre: 'Tu Empresa', // Nombre de tu empresa
    sitioWeb: 'https://tudominio.com' // URL de tu sitio web
  }
};
```

#### Ejemplo de Número de WhatsApp:
- **Colombia**: `573001234567` (57 = código país, 3001234567 = número)
- **México**: `5215512345678` (52 = código país, 15512345678 = número)
- **España**: `34612345678` (34 = código país, 612345678 = número)

**Importante**: El número debe incluir el código de país pero SIN el signo `+` y SIN espacios.

### 3. Verificar Permisos de Supabase

Asegúrate de que la tabla `cotizaciones_publicas` permita inserción pública:

1. Ve a **Authentication** > **Policies** en Supabase
2. Verifica que la política "Cualquiera puede crear cotizaciones públicas" esté activa
3. Si no existe, el script SQL ya la crea automáticamente

### 4. Probar la Página Pública

1. Inicia el servidor: `npm run dev`
2. Ve a: `http://localhost:4321/cocinas-publico`
3. Deberías ver el catálogo de cocinas sin necesidad de login
4. Selecciona una cocina, personaliza las opciones y prueba el envío

## 🔗 Rutas Disponibles

### Públicas (Sin Autenticación)
- `/cocinas-publico` - Catálogo público de cocinas

### Administración (Requiere Login Admin)
- `/admin/cotizaciones-publicas` - Historial de cotizaciones públicas

## 📱 Funcionalidades

### Para Usuarios Públicos:
1. Ver catálogo de cocinas
2. Personalizar cocinas (Material de Puertas, Tipo de Topes)
3. Ver precios en tiempo real
4. Enviar cotización por:
   - **WhatsApp**: Abre chat con mensaje pre-formateado
   - **Email**: Abre cliente de email con datos
   - **Formulario**: Guarda en BD y muestra confirmación

### Para Administradores:
1. Ver todas las cotizaciones públicas
2. Filtrar por estado (Pendiente, Contactado, Cerrado)
3. Ver detalles completos de cada cotización
4. Cambiar estado de las cotizaciones
5. Ver estadísticas (Total, Pendientes, Contactados, Cerrados)

## 🎨 Personalización

### Cambiar el Diseño
Los componentes están en:
- `src/components/public/CatalogoCocinasPublico.tsx` - Catálogo principal
- `src/components/public/ProductDetailPublico.tsx` - Detalle de producto
- `src/components/public/CotizadorPublico.tsx` - Resumen de cotización
- `src/components/public/EnviarCotizacion.tsx` - Opciones de envío

### Agregar Más Opciones de Contacto
Edita `src/components/public/EnviarCotizacion.tsx` para agregar más métodos (Telegram, SMS, etc.)

## 🔒 Seguridad

- Las cotizaciones públicas se guardan en una tabla separada
- Solo los administradores pueden ver el historial
- Los usuarios públicos NO pueden ver otras cotizaciones
- Se registra IP y User Agent para tracking (opcional)

## 📊 Estructura de Datos

Cada cotización pública guarda:
- Datos del cliente (nombre, email, teléfono, mensaje)
- Items cotizados (con todas las opciones personalizadas)
- Totales (subtotal, IVA, total)
- Método de contacto preferido
- Estado (pendiente, contactado, cerrado)
- Fecha y hora
- IP y User Agent (opcional)

## ⚠️ Notas Importantes

1. **Número de WhatsApp**: Debe incluir código de país sin `+` ni espacios
2. **Email**: Debe ser un email válido donde recibirás las cotizaciones
3. **Permisos**: Asegúrate de que la tabla permita inserción pública
4. **Testing**: Prueba todos los métodos de envío antes de publicar

## 🐛 Solución de Problemas

### Error: "bucket does not exist"
- Las imágenes de cocinas deben estar en Supabase Storage
- Verifica que el bucket `muebles-imagenes` exista

### Error: "permission denied" al guardar cotización
- Verifica las políticas RLS en la tabla `cotizaciones_publicas`
- Asegúrate de que la política de inserción pública esté activa

### WhatsApp no abre
- Verifica que el número tenga el formato correcto (código país + número)
- Prueba el número directamente: `https://wa.me/TUNUMERO`

### Email no abre
- Verifica que el email esté bien configurado
- Algunos navegadores pueden bloquear `mailto:` - prueba en diferentes navegadores

