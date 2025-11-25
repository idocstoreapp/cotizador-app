@echo off
echo ========================================
echo Verificacion de Instalacion
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js esta instalado
    node --version
)

echo.
echo Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm no esta disponible
    pause
    exit /b 1
) else (
    echo [OK] npm esta disponible
    npm --version
)

echo.
echo Verificando node_modules...
if exist "node_modules" (
    echo [OK] Dependencias instaladas
) else (
    echo [ADVERTENCIA] node_modules no existe
    echo Ejecutando npm install...
    npm install
)

echo.
echo ========================================
echo Verificacion completada
echo ========================================
echo.
echo Para ejecutar el proyecto, usa:
echo   npm run dev
echo.
pause


