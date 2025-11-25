# Solución: Error de Ejecución de Scripts en PowerShell

## 🔴 Problema

PowerShell está bloqueando la ejecución de scripts npm con este error:
```
No se puede cargar el archivo ... porque la ejecución de scripts está deshabilitada
```

## ✅ Solución Rápida (3 Opciones)

### Opción 1: Usar CMD en lugar de PowerShell (Más Fácil)

1. **Cierra PowerShell**
2. **Abre CMD** (Símbolo del sistema):
   - Presiona `Win + R`
   - Escribe: `cmd`
   - Presiona Enter
3. **Navega al proyecto**:
   ```cmd
   cd C:\Users\Dell\Documents\cotizador-app
   ```
4. **Ejecuta el servidor**:
   ```cmd
   npm run dev
   ```

**O simplemente**: Doble clic en `ejecutar-cmd.bat` (acabo de crearlo)

### Opción 2: Cambiar Política de PowerShell (Recomendado)

Ejecuta este comando en PowerShell **como Administrador**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Luego confirma con `S` (Sí).

**Pasos detallados**:
1. Cierra PowerShell actual
2. Abre PowerShell **como Administrador**:
   - Click derecho en "Windows PowerShell"
   - Selecciona "Ejecutar como administrador"
3. Ejecuta el comando de arriba
4. Confirma con `S`
5. Cierra PowerShell de administrador
6. Abre PowerShell normal y prueba: `npm run dev`

### Opción 3: Ejecutar Comando Específico

En PowerShell, ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

## 🚀 Solución Permanente (Recomendada)

### Para Usuario Actual (Sin ser Administrador)

Abre PowerShell normal y ejecuta:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Confirma con `S`.

Esto permite ejecutar scripts locales sin necesidad de ser administrador.

### Verificar que Funcionó

```powershell
Get-ExecutionPolicy
```

Debería mostrar: `RemoteSigned`

## 📝 Scripts Creados para Ti

He creado `ejecutar-cmd.bat` que usa CMD en lugar de PowerShell, evitando este problema completamente.

**Para usar**:
- Doble clic en `ejecutar-cmd.bat`
- O ejecuta desde CMD: `ejecutar-cmd.bat`

## ⚡ Solución Inmediata

**AHORA MISMO**, haz esto:

1. **Cierra PowerShell**
2. **Abre CMD** (Símbolo del sistema)
3. **Ejecuta**:
   ```cmd
   cd C:\Users\Dell\Documents\cotizador-app
   npm run dev
   ```

O simplemente: **Doble clic en `ejecutar-cmd.bat`**

## 🔍 Explicación del Error

PowerShell tiene políticas de seguridad que bloquean la ejecución de scripts por defecto. Esto es una medida de seguridad de Windows, pero puede ser molesto para desarrollo.

Las opciones son:
- **RemoteSigned**: Permite scripts locales, bloquea scripts remotos no firmados (RECOMENDADO)
- **Bypass**: Permite todo (menos seguro)
- **Restricted**: Bloquea todo (por defecto)

## ✅ Verificación

Después de aplicar la solución, verifica:

```powershell
# En PowerShell
npm --version
npm run dev
```

O en CMD:
```cmd
npm --version
npm run dev
```

Ambos deberían funcionar sin errores.

---

**Recomendación**: Usa la Opción 1 (CMD) para empezar rápido, y luego aplica la Opción 2 para una solución permanente.


