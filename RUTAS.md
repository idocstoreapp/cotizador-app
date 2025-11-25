# Documentación de Rutas

Este documento describe todas las rutas disponibles en la aplicación y sus funcionalidades.

## Rutas Públicas

### `/` (Página Principal)
- **Descripción**: Página de login y registro
- **Acceso**: Público (redirige a dashboard si ya estás autenticado)
- **Componente**: `AuthPage`
- **Funcionalidad**:
  - Permite iniciar sesión con email y contraseña
  - Permite registrarse como nuevo usuario
  - Toggle entre login y registro

## Rutas Protegidas (Requieren Autenticación)

### `/dashboard`
- **Descripción**: Dashboard principal de la aplicación
- **Acceso**: Usuarios autenticados
- **Componente**: `Dashboard`
- **Funcionalidad**:
  - **Admin**: Muestra estadísticas generales, todas las cotizaciones, materiales y servicios
  - **Técnico**: Muestra solo sus propias cotizaciones y estadísticas personales
  - Incluye gráficos de cotizaciones por estado
  - Tarjetas de resumen (total cotizaciones, aprobadas, ventas, promedio)

### `/cotizador`
- **Descripción**: Crear nueva cotización
- **Acceso**: Usuarios autenticados
- **Componente**: `Cotizador`
- **Funcionalidad**:
  - Formulario de datos del cliente
  - Selección y agregado de materiales con cantidades
  - Selección y agregado de servicios con horas
  - Cálculo automático de totales
  - Configuración de margen de ganancia
  - Guardado de cotización

### `/cotizaciones`
- **Descripción**: Listado de cotizaciones
- **Acceso**: Usuarios autenticados
- **Componente**: `CotizacionesPage`
- **Funcionalidad**:
  - **Admin**: Ve todas las cotizaciones del sistema
  - **Técnico**: Ve solo sus propias cotizaciones
  - Cambio de estado de cotizaciones
  - Generación de PDF
  - Filtrado por estado

## Rutas Solo para Administradores

### `/materiales`
- **Descripción**: Gestión completa de materiales
- **Acceso**: Solo administradores
- **Componente**: `MaterialesPage`
- **Funcionalidad**:
  - Listado de todos los materiales
  - Crear nuevo material
  - Editar material existente
  - Eliminar material
  - Campos: nombre, tipo, unidad, costo unitario, proveedor

### `/servicios`
- **Descripción**: Gestión completa de servicios/mano de obra
- **Acceso**: Solo administradores
- **Componente**: `ServiciosPage`
- **Funcionalidad**:
  - Listado de todos los servicios
  - Crear nuevo servicio
  - Editar servicio existente
  - Eliminar servicio
  - Campos: nombre, descripción, precio por hora, horas estimadas

## Endpoints API

### `/api/generar-pdf`
- **Método**: GET
- **Descripción**: Genera un PDF/HTML imprimible de una cotización
- **Acceso**: Usuarios autenticados (solo admin o creador de la cotización)
- **Parámetros**:
  - `id` (query param): ID de la cotización
- **Ejemplo**: `/api/generar-pdf?id=123e4567-e89b-12d3-a456-426614174000`
- **Respuesta**: HTML que se puede imprimir como PDF desde el navegador

## Flujo de Navegación

### Para Administradores:
```
/ → /dashboard → /materiales, /servicios, /cotizaciones, /cotizador
```

### Para Técnicos/Vendedores:
```
/ → /dashboard → /cotizaciones, /cotizador
```

## Protección de Rutas

Todas las rutas protegidas verifican:
1. **Autenticación**: El usuario debe estar autenticado
2. **Rol**: Algunas rutas verifican el rol del usuario (admin vs técnico)
3. **Permisos**: Los usuarios solo pueden ver/modificar sus propias cotizaciones (excepto admins)

## Redirecciones Automáticas

- Si un usuario no autenticado intenta acceder a una ruta protegida → `/`
- Si un usuario autenticado accede a `/` → `/dashboard`
- Si un técnico intenta acceder a `/materiales` o `/servicios` → `/dashboard`

## Middleware de Autenticación

El middleware de autenticación está implementado en cada página `.astro`:
- Verifica la sesión del usuario
- Redirige si no está autenticado
- Verifica roles para rutas administrativas

Ejemplo:
```typescript
const usuario = await obtenerUsuarioActual();
if (!usuario) {
  return Astro.redirect('/');
}
if (usuario.role !== 'admin') {
  return Astro.redirect('/dashboard');
}
```


