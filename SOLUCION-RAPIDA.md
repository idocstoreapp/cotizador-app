# Solución Rápida - Node.js no se reconoce

## 🔧 Problema

Aunque instalaste Node.js, la terminal no lo reconoce. Esto es común y tiene solución fácil.

## ✅ Solución Inmediata

### Opción 1: Usar el Script de Diagnóstico (Recomendado)

1. **Doble clic en `diagnostico.bat`**
   - Este script buscará Node.js automáticamente
   - Instalará las dependencias
   - Iniciará el servidor

### Opción 2: Reiniciar Terminal

1. **Cierra completamente** la terminal actual (PowerShell, CMD, etc.)
2. **Abre una NUEVA terminal** (importante: debe ser nueva)
3. Navega al proyecto:
   ```bash
   cd C:\Users\Dell\Documents\cotizador-app
   ```
4. Verifica Node.js:
   ```bash
   node --version
   ```
5. Si funciona, instala dependencias:
   ```bash
   npm install
   ```
6. Ejecuta el proyecto:
   ```bash
   npm run dev
   ```

### Opción 3: Reiniciar Computadora

Si la Opción 2 no funciona:

1. **Reinicia tu computadora** (esto actualiza el PATH del sistema)
2. Después de reiniciar, abre una nueva terminal
3. Ejecuta los comandos de la Opción 2

## 🔍 Verificar Instalación de Node.js

### Verificar si Node.js está instalado:

1. Abre el **Explorador de Archivos**
2. Navega a: `C:\Program Files\nodejs\`
3. Si ves archivos como `node.exe` y `npm.cmd`, Node.js está instalado

### Si Node.js NO está instalado:

1. Ve a: https://nodejs.org/
2. Descarga la versión **LTS** (recomendada)
3. Ejecuta el instalador
4. **IMPORTANTE**: Marca la opción "Add to PATH"
5. Reinicia tu computadora

## 🚀 Pasos Completos (desde cero)

```bash
# 1. Verificar Node.js (debe mostrar una versión)
node --version

# 2. Verificar npm (debe mostrar una versión)
npm --version

# 3. Navegar al proyecto
cd C:\Users\Dell\Documents\cotizador-app

# 4. Instalar dependencias (esto puede tardar 2-5 minutos)
npm install

# 5. Ejecutar el proyecto
npm run dev
```

Después del paso 5, deberías ver algo como:
```
  ➜  Local:   http://localhost:4321/
  ➜  Network: use --host to expose
```

## ❌ Si sigue sin funcionar

### Verificar PATH manualmente:

1. Presiona `Win + R`
2. Escribe: `sysdm.cpl` y presiona Enter
3. Ve a la pestaña "Opciones avanzadas"
4. Click en "Variables de entorno"
5. En "Variables del sistema", busca "Path"
6. Verifica que contenga: `C:\Program Files\nodejs\`
7. Si no está, agrégalo manualmente

### Reinstalar Node.js:

1. Desinstala Node.js desde "Agregar o quitar programas"
2. Descarga e instala nuevamente desde nodejs.org
3. **Asegúrate de marcar "Add to PATH"**
4. Reinicia tu computadora

## 📞 Comandos de Emergencia

Si nada funciona, usa estos comandos con la ruta completa:

```bash
# Si Node.js está en Program Files
"C:\Program Files\nodejs\node.exe" --version
"C:\Program Files\nodejs\npm.cmd" install

# Si Node.js está en AppData
"%LOCALAPPDATA%\Programs\nodejs\node.exe" --version
"%LOCALAPPDATA%\Programs\nodejs\npm.cmd" install
```

## ✅ Verificación Final

Cuando todo funcione correctamente, deberías poder:

1. ✅ Ejecutar `node --version` y ver un número
2. ✅ Ejecutar `npm --version` y ver un número
3. ✅ Ejecutar `npm install` sin errores
4. ✅ Ejecutar `npm run dev` y ver el servidor iniciando
5. ✅ Abrir http://localhost:4321 en el navegador

---

**¿Qué hacer ahora?**

1. **Primero**: Ejecuta `diagnostico.bat` (doble clic)
2. **Si no funciona**: Reinicia tu computadora y vuelve a intentar
3. **Si aún no funciona**: Sigue los pasos de "Verificar PATH manualmente"


