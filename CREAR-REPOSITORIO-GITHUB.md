# 🚀 Crear Repositorio en GitHub

## Pasos para crear y conectar el repositorio

### 1. Crear el repositorio en GitHub

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** en la esquina superior derecha
3. Selecciona **"New repository"**
4. Completa el formulario:
   - **Repository name**: `cotizador-app` (o el nombre que prefieras)
   - **Description**: `Sistema de cotizaciones para mueblería con catálogo de cocinas público`
   - **Visibility**: Elige **Public** o **Private**
   - ⚠️ **NO marques** "Initialize this repository with a README" (ya tenemos uno)
   - ⚠️ **NO agregues** .gitignore ni licencia (ya los tenemos)
5. Haz clic en **"Create repository"**

### 2. Conectar el repositorio local con GitHub

Después de crear el repositorio, GitHub te mostrará una página con instrucciones. Usa estos comandos:

**Si tu repositorio es HTTPS:**
```bash
git remote add origin https://github.com/TU-USUARIO/cotizador-app.git
git branch -M main
git push -u origin main
```

**Si prefieres usar SSH:**
```bash
git remote add origin git@github.com:TU-USUARIO/cotizador-app.git
git branch -M main
git push -u origin main
```

⚠️ **Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub**

### 3. Verificar la conexión

```bash
git remote -v
```

Deberías ver algo como:
```
origin  https://github.com/TU-USUARIO/cotizador-app.git (fetch)
origin  https://github.com/TU-USUARIO/cotizador-app.git (push)
```

### 4. Hacer push del código

Si ya conectaste el repositorio, ejecuta:

```bash
git push -u origin main
```

Si tu rama se llama `master` en lugar de `main`:

```bash
git branch -M main
git push -u origin main
```

## 📝 Comandos útiles para el futuro

### Subir cambios
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

### Ver el estado del repositorio
```bash
git status
```

### Ver el historial de commits
```bash
git log --oneline
```

## 🔐 Configurar Git (si aún no lo has hecho)

Si es la primera vez que usas Git en esta computadora:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

## ✅ Listo

Una vez completados estos pasos, tu código estará en GitHub y podrás:
- Compartir el repositorio con otros
- Hacer clonaciones en otras máquinas
- Usar GitHub Actions para CI/CD
- Colaborar con otros desarrolladores

