# Guía de Configuración Paso a Paso

## 1. Configuración Inicial del Proyecto

### Instalar dependencias
```bash
npm install
```

## 2. Configuración de Supabase

### Paso 1: Crear proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración (2-3 minutos)

### Paso 2: Obtener credenciales
1. En tu proyecto de Supabase, ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (una clave larga)

### Paso 3: Configurar variables de entorno
1. Crea un archivo `.env` en la raíz del proyecto
2. Agrega las siguientes líneas:

```env
PUBLIC_SUPABASE_URL=tu_project_url_aqui
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**⚠️ IMPORTANTE**: Reemplaza `tu_project_url_aqui` y `tu_anon_key_aqui` con los valores reales de tu proyecto.

## 3. Configuración de la Base de Datos

### Paso 1: Abrir SQL Editor
1. En tu proyecto de Supabase, ve a **SQL Editor** en el menú lateral
2. Haz clic en **New Query**

### Paso 2: Ejecutar el script SQL
Copia y pega TODO el siguiente script SQL y ejecútalo:

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

### Paso 3: Verificar que las tablas se crearon
1. Ve a **Table Editor** en Supabase
2. Deberías ver 4 tablas: `perfiles`, `materiales`, `servicios`, `cotizaciones`

## 4. Crear el Primer Usuario Administrador

### Opción A: Desde la aplicación (recomendado)
1. Ejecuta el proyecto: `npm run dev`
2. Ve a `http://localhost:4321`
3. Haz clic en "¿No tienes cuenta? Regístrate"
4. Completa el formulario y selecciona rol "Administrador"
5. Confirma tu email desde el correo que recibirás de Supabase

### Opción B: Desde Supabase Dashboard
1. Ve a **Authentication** > **Users** en Supabase
2. Haz clic en **Add User** > **Create new user**
3. Completa el formulario y crea el usuario
4. Luego ejecuta este SQL para crear el perfil:

```sql
INSERT INTO perfiles (id, email, role, nombre)
VALUES ('ID_DEL_USUARIO_CREADO', 'email@ejemplo.com', 'admin', 'Nombre Admin');
```

## 5. Ejecutar el Proyecto

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:4321`

## 6. Verificación

1. ✅ Deberías poder iniciar sesión con el usuario creado
2. ✅ Si eres admin, deberías ver el menú completo
3. ✅ Deberías poder crear materiales y servicios (solo admin)
4. ✅ Deberías poder crear cotizaciones
5. ✅ Deberías poder generar PDFs de cotizaciones

## Solución de Problemas Comunes

### Error: "Faltan las variables de entorno"
- Verifica que el archivo `.env` existe en la raíz
- Verifica que las variables empiezan con `PUBLIC_`
- Reinicia el servidor después de crear/modificar `.env`

### Error: "No se puede crear el usuario"
- Verifica que la tabla `perfiles` existe
- Verifica que las políticas RLS están creadas
- Revisa la consola del navegador para más detalles

### Error: "No autorizado" en rutas
- Verifica que estás autenticado
- Verifica que tu rol en `perfiles` es correcto ('admin' o 'tecnico')
- Verifica que las políticas RLS están configuradas

### No puedo ver materiales/servicios
- Si eres técnico, esto es normal (solo admins pueden gestionarlos)
- Si eres admin, verifica las políticas RLS de las tablas

## Próximos Pasos

1. Agrega materiales desde la interfaz (admin)
2. Agrega servicios desde la interfaz (admin)
3. Crea tu primera cotización
4. Genera un PDF de prueba

¡Listo! Tu sistema de cotizaciones está funcionando.


