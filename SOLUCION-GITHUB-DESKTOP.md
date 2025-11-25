# 🔧 Solución: GitHub Desktop solo muestra 2 archivos

## Problema
GitHub Desktop publicó el repositorio pero solo subió 2 archivos en lugar de los 149 archivos que deberían estar.

## Solución

### Opción 1: Desde GitHub Desktop (Recomendado)

1. **Abre GitHub Desktop**

2. **Verifica que estés en la rama `master`** (debería aparecer arriba a la izquierda)

3. **Ve a la pestaña "History"** y verifica que veas al menos 2 commits:
   - "Initial commit: Sistema de cotizaciones..."
   - "Agregar guías para crear repositorio..."

4. **Haz clic en "Push origin"** o **"Publish branch"** (arriba a la derecha)
   - Esto debería subir TODOS los commits y archivos

5. Si no funciona, ve a **Repository** → **Push** o presiona `Ctrl+Shift+P`

### Opción 2: Verificar y conectar manualmente

Si GitHub Desktop no tiene el remoto configurado:

1. **Obtén la URL de tu repositorio en GitHub:**
   - Ve a tu repositorio en GitHub (ej: `https://github.com/TU-USUARIO/cotizador-app`)
   - Haz clic en el botón verde **"Code"**
   - Copia la URL HTTPS (ej: `https://github.com/TU-USUARIO/cotizador-app.git`)

2. **En GitHub Desktop:**
   - Ve a **Repository** → **Repository Settings** → **Remote**
   - Si no hay un remoto, agrega:
     - **Remote name**: `origin`
     - **Primary remote**: Marca esta opción
     - **Remote URL**: Pega la URL que copiaste

3. **Haz push:**
   - Haz clic en **"Push origin"** o **Repository** → **Push**

### Opción 3: Desde la terminal (Si las anteriores no funcionan)

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
# Verificar si hay remoto
git remote -v

# Si no hay remoto, agrégalo (reemplaza TU-USUARIO y REPO)
git remote add origin https://github.com/TU-USUARIO/cotizador-app.git

# Verificar que se agregó
git remote -v

# Cambiar a main si es necesario (GitHub usa main por defecto)
git branch -M main

# Hacer push de todos los commits
git push -u origin main
```

Si tu rama se llama `master`:
```powershell
git push -u origin master
```

## Verificar que funcionó

1. Ve a tu repositorio en GitHub en el navegador
2. Deberías ver TODOS los archivos:
   - Carpeta `src/` con todos los componentes
   - Archivos `.md` de documentación
   - `package.json`, `astro.config.mjs`, etc.
   - Total: ~149 archivos

## Si aún solo ves 2 archivos

Puede ser que GitHub Desktop haya creado un repositorio nuevo vacío. En ese caso:

1. **Elimina el repositorio en GitHub** (Settings → Danger Zone → Delete this repository)

2. **Vuelve a publicar desde GitHub Desktop:**
   - Repository → Publish Repository
   - Esta vez debería subir todos los archivos del commit inicial

## Comandos útiles para verificar

```powershell
# Ver todos los archivos en el commit
git ls-tree -r --name-only HEAD

# Contar archivos
git ls-tree -r --name-only HEAD | Measure-Object -Line

# Ver el historial de commits
git log --oneline

# Ver el estado actual
git status
```

