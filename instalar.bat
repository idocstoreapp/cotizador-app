@echo off
echo ========================================
echo Instalacion de Dependencias
echo Muebleria Cotizador
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js no esta instalado
    echo.
    echo Por favor instala Node.js desde:
    echo https://nodejs.org/
    echo.
    echo Despues de instalar Node.js, cierra y vuelve a abrir esta ventana
    echo y ejecuta este script nuevamente.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
node --version
echo.

echo Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm no esta disponible
    pause
    exit /b 1
)

echo [OK] npm encontrado
npm --version
echo.

echo ========================================
echo Instalando dependencias...
echo Esto puede tardar varios minutos
echo ========================================
echo.

npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] La instalacion fallo
    echo.
    echo Intenta:
    echo   1. npm cache clean --force
    echo   2. Ejecutar este script nuevamente
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo [OK] Instalacion completada exitosamente
echo ========================================
echo.
echo Para ejecutar el proyecto, usa:
echo   npm run dev
echo.
echo El proyecto estara disponible en:
echo   http://localhost:4321
echo.
pause


