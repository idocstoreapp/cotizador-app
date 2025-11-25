@echo off
REM Script para ejecutar npm usando CMD en lugar de PowerShell
echo ========================================
echo Iniciando Servidor de Desarrollo
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta disponible
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

echo Verificando dependencias...
if not exist "node_modules" (
    echo [ADVERTENCIA] Dependencias no instaladas
    echo Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Error al instalar dependencias
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Iniciando servidor...
echo El proyecto estara disponible en: http://localhost:4321
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

call npm run dev

pause


