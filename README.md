# Mueblería Cotizador

Sistema completo de cotizaciones para mueblería desarrollado con Astro, React, TypeScript y Supabase.

## 🚀 Características

- ✅ Autenticación con roles (admin y técnico/vendedor)
- ✅ Gestión completa de materiales (CRUD)
- ✅ Gestión completa de servicios/mano de obra (CRUD)
- ✅ Cotizador interactivo con cálculos automáticos
- ✅ Generación de PDF de cotizaciones
- ✅ Dashboard diferenciado por rol
- ✅ Validaciones con Zod
- ✅ React Query para gestión de datos
- ✅ TailwindCSS para estilos

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase (gratuita)
- npm o yarn

## 🛠️ Instalación

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API y copia:
   - Project URL
   - anon/public key

3. Crea un archivo `.env` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=tu_url_de_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Configurar Base de Datos

Ejecuta los siguientes SQL en el SQL Editor de Supabase:

```sql
-- Tabla de perfiles de usuario
CREATE TABLE perfiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  nombre TEXT,
  role TEXT NOT NULL DEFAULT 'tecnico' CHECK (role IN ('admin', 'tecnico')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON perfiles
  FOR SELECT USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

-- Tabla de materiales
CREATE TABLE materiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  unidad TEXT NOT NULL,
  costo_unitario DECIMAL(10, 2) NOT NULL,
  proveedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE materiales ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver materiales
CREATE POLICY "Authenticated users can view materials" ON materiales
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden modificar materiales
CREATE POLICY "Admins can modify materials" ON materiales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Tabla de servicios
CREATE TABLE servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_por_hora DECIMAL(10, 2) NOT NULL,
  horas_estimadas DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver servicios
CREATE POLICY "Authenticated users can view services" ON servicios
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden modificar servicios
CREATE POLICY "Admins can modify services" ON servicios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Tabla de cotizaciones
CREATE TABLE cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefono TEXT,
  cliente_direccion TEXT,
  materiales JSONB NOT NULL DEFAULT '[]'::jsonb,
  servicios JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_materiales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal_servicios DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  iva DECIMAL(10, 2) NOT NULL DEFAULT 0,
  margen_ganancia DECIMAL(5, 2) NOT NULL DEFAULT 30,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada')),
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias cotizaciones
CREATE POLICY "Users can view own cotizaciones" ON cotizaciones
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política: Los admins pueden ver todas las cotizaciones
CREATE POLICY "Admins can view all cotizaciones" ON cotizaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Política: Los usuarios pueden crear cotizaciones
CREATE POLICY "Users can create cotizaciones" ON cotizaciones
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios pueden actualizar sus propias cotizaciones
CREATE POLICY "Users can update own cotizaciones" ON cotizaciones
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política: Los admins pueden actualizar todas las cotizaciones
CREATE POLICY "Admins can update all cotizaciones" ON cotizaciones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.role = 'admin'
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_materiales_updated_at BEFORE UPDATE ON materiales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at BEFORE UPDATE ON servicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cotizaciones_updated_at BEFORE UPDATE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Ejecutar el proyecto

```bash
# Modo desarrollo
npm run dev

# El proyecto estará disponible en http://localhost:4321
```

## 📁 Estructura del Proyecto

```
muebleria-cotizador/
├── src/
│   ├── components/          # Componentes React
│   │   ├── Login.tsx
│   │   ├── Registro.tsx
│   │   ├── Layout.tsx
│   │   ├── Cotizador.tsx
│   │   ├── Dashboard.tsx
│   │   ├── MaterialesPage.tsx
│   │   ├── ServiciosPage.tsx
│   │   └── ...
│   ├── pages/               # Páginas Astro
│   │   ├── index.astro
│   │   ├── dashboard.astro
│   │   ├── cotizador.astro
│   │   └── api/
│   │       └── generar-pdf.ts
│   ├── services/             # Servicios de Supabase
│   │   ├── auth.service.ts
│   │   ├── materiales.service.ts
│   │   ├── servicios.service.ts
│   │   └── cotizaciones.service.ts
│   ├── utils/               # Utilidades
│   │   ├── supabase.ts
│   │   └── calcularCotizacion.ts
│   ├── schemas/             # Validaciones Zod
│   │   └── validations.ts
│   └── types/               # Tipos TypeScript
│       └── database.ts
├── package.json
├── tsconfig.json
├── astro.config.mjs
└── README.md
```

## 🛣️ Rutas de la Aplicación

### Públicas
- `/` - Página de login/registro

### Protegidas (requieren autenticación)
- `/dashboard` - Dashboard principal (diferente según rol)
- `/cotizador` - Crear nueva cotización
- `/cotizaciones` - Listado de cotizaciones

### Solo Administradores
- `/materiales` - Gestión de materiales
- `/servicios` - Gestión de servicios

### API
- `/api/generar-pdf?id={cotizacion_id}` - Genera PDF de cotización

## 🧮 Lógica de Cálculo

La lógica de cálculo está centralizada en `src/utils/calcularCotizacion.ts`.

### Fórmulas:

1. **Subtotal Materiales** = Σ(cantidad × precio_unitario) de cada material
2. **Subtotal Servicios** = Σ(horas × precio_por_hora) de cada servicio
3. **Subtotal General** = Subtotal Materiales + Subtotal Servicios
4. **IVA** = Subtotal General × 19%
5. **Margen de Ganancia** = Subtotal General × (margen_ganancia% / 100)
6. **Total** = (Subtotal General + Margen de Ganancia) + IVA

### Modificar Fórmulas

Para modificar las fórmulas, edita `src/utils/calcularCotizacion.ts`:

```typescript
// Cambiar porcentaje de IVA
export const IVA_PORCENTAJE = 19; // Modifica este valor

// Cambiar margen por defecto
export const MARGEN_GANANCIA_DEFAULT = 30; // Modifica este valor

// Modificar función de cálculo
export function calcularTotal(...) {
  // Tu lógica personalizada aquí
}
```

## 👥 Roles y Permisos

### Administrador
- Acceso completo a todas las funcionalidades
- Puede gestionar materiales y servicios
- Ve todas las cotizaciones
- Puede cambiar estados de cualquier cotización

### Técnico/Vendedor
- Puede crear cotizaciones
- Ve solo sus propias cotizaciones
- Puede cambiar estado de sus cotizaciones
- No puede gestionar materiales ni servicios

## 📝 Agregar Nuevos Materiales o Servicios

### Desde la Interfaz (Admin)
1. Inicia sesión como administrador
2. Ve a "Materiales" o "Servicios" en el menú
3. Haz clic en "Nuevo Material" o "Nuevo Servicio"
4. Completa el formulario y guarda

### Desde Supabase (Directo)
Puedes insertar directamente en las tablas `materiales` o `servicios` desde el SQL Editor de Supabase.

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Validación de datos con Zod en el frontend
- Verificación de autenticación en todas las rutas protegidas
- Verificación de roles para acciones administrativas

## 🐛 Solución de Problemas

### Error: "Faltan las variables de entorno de Supabase"
- Verifica que el archivo `.env` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo después de crear/modificar `.env`

### Error: "No se puede crear el usuario"
- Verifica que la tabla `perfiles` existe en Supabase
- Verifica que las políticas RLS están configuradas correctamente

### Error: "No autorizado" al acceder a rutas
- Verifica que estás autenticado
- Verifica que tu rol en la tabla `perfiles` es correcto

## 📦 Build para Producción

```bash
# Construir el proyecto
npm run build

# Preview de la build
npm run preview
```

## 🚀 Despliegue

El proyecto está configurado para desplegarse en Node.js. Puedes usar:

- **Vercel**: Conecta tu repositorio y Vercel detectará Astro automáticamente
- **Netlify**: Similar a Vercel
- **Railway/Render**: Configura el comando de inicio como `npm run start`

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Soporte

Para soporte, abre un issue en el repositorio del proyecto.

---

Desarrollado con ❤️ usando Astro, React, TypeScript y Supabase


