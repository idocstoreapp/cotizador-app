@echo off
echo ========================================
echo Diagnostico del Sistema
echo ========================================
echo.

echo Buscando Node.js en ubicaciones comunes...
echo.

REM Buscar en Program Files
if exist "C:\Program Files\nodejs\node.exe" (
    echo [ENCONTRADO] Node.js en: C:\Program Files\nodejs\
    set "NODE_PATH=C:\Program Files\nodejs"
    goto :found
)

REM Buscar en Program Files (x86)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo [ENCONTRADO] Node.js en: C:\Program Files (x86)\nodejs\
    set "NODE_PATH=C:\Program Files (x86)\nodejs"
    goto :found
)

REM Buscar en AppData Local
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    echo [ENCONTRADO] Node.js en: %LOCALAPPDATA%\Programs\nodejs\
    set "NODE_PATH=%LOCALAPPDATA%\Programs\nodejs"
    goto :found
)

echo [NO ENCONTRADO] Node.js no esta en las ubicaciones comunes
echo.
echo Por favor:
echo 1. Verifica que Node.js este instalado
echo 2. Reinicia tu computadora
echo 3. Abre una NUEVA terminal y ejecuta: node --version
echo.
pause
exit /b 1

:found
echo.
echo Agregando Node.js al PATH de esta sesion...
set "PATH=%NODE_PATH%;%PATH%"
echo.

echo Verificando Node.js...
"%NODE_PATH%\node.exe" --version
if %errorlevel% neq 0 (
    echo [ERROR] Node.js encontrado pero no funciona
    pause
    exit /b 1
)

echo.
echo Verificando npm...
"%NODE_PATH%\npm.cmd" --version
if %errorlevel% neq 0 (
    echo [ERROR] npm no funciona
    pause
    exit /b 1
)

echo.
echo ========================================
echo [OK] Node.js y npm funcionan correctamente
echo ========================================
echo.
echo Instalando dependencias del proyecto...
echo.

"%NODE_PATH%\npm.cmd" install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] La instalacion fallo
    pause
    exit /b 1
)

echo.
echo ========================================
echo [OK] Instalacion completada
echo ========================================
echo.
echo Iniciando servidor de desarrollo...
echo El proyecto estara disponible en: http://localhost:4321
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

"%NODE_PATH%\npm.cmd" run dev

pause


