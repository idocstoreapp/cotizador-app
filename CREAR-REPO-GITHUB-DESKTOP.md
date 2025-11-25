# 🚀 Crear Repositorio con GitHub Desktop

## Pasos para publicar tu repositorio usando GitHub Desktop

### 1. Abrir GitHub Desktop

1. Abre **GitHub Desktop** en tu computadora
2. Si no lo tienes instalado, descárgalo desde: https://desktop.github.com/

### 2. Agregar el repositorio local

1. En GitHub Desktop, ve a **File** → **Add Local Repository**
2. O haz clic en el botón **"+"** y selecciona **"Add Existing Repository"**
3. Navega hasta la carpeta: `C:\Users\Dell\Documents\cotizador-app`
4. Haz clic en **"Add Repository"**

### 3. Verificar que todo está listo

- Deberías ver todos tus archivos en la pestaña **"Changes"**
- El commit inicial que creamos debería aparecer en el historial

### 4. Publicar el repositorio en GitHub

1. En la barra superior, haz clic en el botón **"Publish repository"**
   - Si no ves este botón, ve a **Repository** → **Publish Repository**
   
2. Se abrirá una ventana con opciones:
   - **Name**: `cotizador-app` (o el nombre que prefieras)
   - **Description**: `Sistema de cotizaciones para mueblería con catálogo de cocinas público`
   - **Keep this code private**: Marca esta opción si quieres un repositorio privado
   - **Organization**: Déjalo vacío (a menos que tengas una organización)

3. Haz clic en **"Publish Repository"**

### 5. ¡Listo! 🎉

GitHub Desktop subirá automáticamente todos tus archivos y commits a GitHub.

## 📝 Comandos útiles en GitHub Desktop

### Hacer cambios y subirlos

1. **Hacer cambios** en tus archivos
2. Abre **GitHub Desktop**
3. Verás tus cambios en la pestaña **"Changes"**
4. Escribe un **mensaje de commit** (ej: "Agregar nueva funcionalidad")
5. Haz clic en **"Commit to main"** (o la rama que estés usando)
6. Haz clic en **"Push origin"** para subir los cambios a GitHub

### Ver el historial

- Haz clic en la pestaña **"History"** para ver todos tus commits
- Puedes hacer clic en cualquier commit para ver los cambios

### Crear una nueva rama

1. Haz clic en **"Current branch"** (arriba a la izquierda)
2. Haz clic en **"New branch"**
3. Escribe el nombre de la rama (ej: `feature/nueva-funcionalidad`)
4. Haz clic en **"Create branch"**

### Cambiar entre ramas

1. Haz clic en **"Current branch"**
2. Selecciona la rama a la que quieres cambiar

## 🔄 Sincronizar cambios

Si trabajas desde otra computadora o alguien más hace cambios:

1. Abre **GitHub Desktop**
2. Haz clic en **"Fetch origin"** para ver si hay cambios nuevos
3. Si hay cambios, aparecerá **"Pull origin"** - haz clic para descargarlos

## 📍 Ver tu repositorio en GitHub

Después de publicar, puedes:
- Hacer clic en **"View on GitHub"** en GitHub Desktop
- O ir directamente a: `https://github.com/TU-USUARIO/cotizador-app`

## ⚠️ Notas importantes

- **No subas archivos sensibles**: Asegúrate de que tu `.env` esté en `.gitignore` (ya lo está)
- **Commits descriptivos**: Escribe mensajes claros sobre qué cambiaste
- **Haz push regularmente**: No dejes pasar mucho tiempo sin subir tus cambios

## 🆘 Solución de problemas

### "Repository already exists"
- El repositorio ya existe en GitHub con ese nombre
- Cambia el nombre o elimina el repositorio existente en GitHub

### "Authentication failed"
- Ve a **File** → **Options** → **Accounts**
- Asegúrate de estar autenticado con tu cuenta de GitHub

### No veo el botón "Publish"
- Verifica que estás en la rama `main` o `master`
- Asegúrate de que el repositorio local esté correctamente inicializado

