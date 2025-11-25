# 🔐 Variables de Entorno - Seguridad

## ✅ Tu archivo .env está protegido

Tu archivo `.env` **NO se subirá a GitHub** porque está en `.gitignore`. Esto es correcto y seguro.

## 📋 Variables de Entorno Necesarias

El proyecto requiere las siguientes variables de entorno:

### Variables Requeridas

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_public_aqui
```

### Cómo Obtenerlas

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Navega a **Settings** → **API**
3. Copia:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon public** key → `PUBLIC_SUPABASE_ANON_KEY`

## 📝 Archivo .env.example

He creado un archivo `.env.example` que:
- ✅ **SÍ se sube a GitHub** (es seguro, solo tiene valores de ejemplo)
- ✅ Sirve como plantilla para otros desarrolladores
- ✅ Documenta qué variables se necesitan

### Cómo usar .env.example

1. Copia el archivo:
   ```bash
   cp .env.example .env
   ```
   O en Windows PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Edita `.env` y reemplaza los valores de ejemplo con tus credenciales reales

3. **NUNCA** subas el archivo `.env` a GitHub (ya está protegido)

## 🔒 Seguridad

### ✅ Lo que está protegido (NO se sube a GitHub):
- `.env` - Tu archivo con credenciales reales
- `.env.production` - Variables de producción
- `node_modules/` - Dependencias
- `.astro/` - Archivos de compilación

### ✅ Lo que SÍ se sube a GitHub:
- `.env.example` - Plantilla con valores de ejemplo
- Todo el código fuente
- Archivos de configuración públicos

## ⚠️ Verificación

Para verificar que tu `.env` está protegido:

```bash
# Verificar que .env está siendo ignorado
git check-ignore .env

# Ver archivos ignorados
git status --ignored | grep .env
```

Si ves `.env` en la lista de ignorados, está correctamente protegido.

## 🚀 Para Nuevos Desarrolladores

Cuando alguien clone tu repositorio:

1. Clonará el repositorio
2. Verá el archivo `.env.example`
3. Creará su propio `.env` copiando `.env.example`
4. Agregará sus propias credenciales de Supabase
5. El proyecto funcionará con sus propias credenciales

## 📚 Referencias

- [Documentación de Supabase sobre variables de entorno](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Guía de seguridad de .env](https://www.freecodecamp.org/news/how-to-securely-store-api-keys-in-git/)

