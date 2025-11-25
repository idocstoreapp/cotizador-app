# Guía de Instalación - Mueblería Cotizador

## 📋 Requisitos Previos

Para ejecutar este proyecto necesitas tener instalado:

1. **Node.js** (versión 18 o superior)
2. **npm** (viene incluido con Node.js)

## 🚀 Instalación Paso a Paso

### Paso 1: Instalar Node.js

#### Opción A: Descarga Directa (Recomendado)

1. Ve a [https://nodejs.org/](https://nodejs.org/)
2. Descarga la versión **LTS** (Long Term Support) - actualmente v20.x o superior
3. Ejecuta el instalador y sigue las instrucciones
4. **IMPORTANTE**: Asegúrate de marcar la opción "Add to PATH" durante la instalación

#### Opción B: Usando Chocolatey (Windows)

Si tienes Chocolatey instalado:

```powershell
choco install nodejs
```

#### Opción C: Usando winget (Windows 10/11)

```powershell
winget install OpenJS.NodeJS.LTS
```

### Paso 2: Verificar la Instalación

Abre una **nueva** terminal (PowerShell o CMD) y ejecuta:

```bash
node --version
npm --version
```

Deberías ver algo como:
```
v20.10.0
10.2.3
```

**⚠️ IMPORTANTE**: Si los comandos no funcionan, cierra y vuelve a abrir la terminal para que se actualice el PATH.

### Paso 3: Instalar Dependencias del Proyecto

Una vez que Node.js esté instalado, navega a la carpeta del proyecto y ejecuta:

```bash
cd C:\Users\Dell\Documents\cotizador-app
npm install
```

Este comando instalará todas las dependencias necesarias:
- Astro
- React
- TypeScript
- TailwindCSS
- Supabase
- React Query
- Zustand
- Recharts
- Y todas las demás dependencias

### Paso 4: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=tu_url_de_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

> **Nota**: Si aún no tienes Supabase configurado, puedes dejar estos valores vacíos temporalmente. El proyecto funcionará pero algunas funcionalidades requerirán Supabase.

### Paso 5: Ejecutar el Proyecto

```bash
npm run dev
```

El proyecto estará disponible en: **http://localhost:4321**

## 🛠️ Comandos Disponibles

```bash
# Desarrollo (modo watch)
npm run dev

# Construir para producción
npm run build

# Preview de la build
npm run preview
```

## ❌ Solución de Problemas

### Error: "npm no se reconoce"

**Solución**:
1. Verifica que Node.js esté instalado: `node --version`
2. Si Node.js está instalado pero npm no funciona:
   - Cierra y vuelve a abrir la terminal
   - Reinicia tu computadora
   - Verifica que Node.js esté en el PATH del sistema

### Error: "Cannot find module"

**Solución**:
```bash
# Elimina node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstala todo
npm install
```

### Error: "Port 4321 already in use"

**Solución**:
1. Cierra otras aplicaciones que usen el puerto 4321
2. O cambia el puerto en `astro.config.mjs`:
   ```js
   server: {
     port: 3000  // Cambia a otro puerto
   }
   ```

### Error al instalar dependencias

**Solución**:
```bash
# Limpia la caché de npm
npm cache clean --force

# Intenta de nuevo
npm install
```

## 📦 Dependencias Principales

- **Astro 4.0.7** - Framework principal
- **React 18.2.0** - Biblioteca UI
- **TypeScript 5.3.3** - Tipado estático
- **TailwindCSS 3.4.0** - Estilos
- **Supabase** - Backend (auth + database)
- **React Query** - Gestión de datos
- **Zustand** - Estado global
- **Recharts** - Gráficos

## ✅ Verificación Final

Después de la instalación, verifica que todo esté correcto:

1. ✅ Node.js instalado: `node --version`
2. ✅ npm instalado: `npm --version`
3. ✅ Dependencias instaladas: `ls node_modules` (debe mostrar muchas carpetas)
4. ✅ Proyecto ejecutándose: `npm run dev` (debe abrir en http://localhost:4321)

## 🎯 Próximos Pasos

Una vez que el proyecto esté corriendo:

1. Configura Supabase siguiendo el `SETUP.md`
2. Crea tu primer usuario administrador
3. Explora el catálogo de muebles
4. Crea tu primera cotización

---

**¿Necesitas ayuda?** Revisa el `README.md` para más información sobre el proyecto.


