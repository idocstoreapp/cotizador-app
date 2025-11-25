@echo off
echo ========================================
echo Reiniciando Servidor de Desarrollo
echo ========================================
echo.

echo Deteniendo servidores anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo.
echo Verificando archivo .env...
if exist ".env" (
    echo [OK] Archivo .env encontrado
    echo.
    echo Contenido del .env:
    type .env
    echo.
) else (
    echo [ERROR] Archivo .env no encontrado
    echo Por favor crea el archivo .env con las variables de entorno
    pause
    exit /b 1
)

echo.
echo Iniciando servidor...
echo El proyecto estara disponible en: http://localhost:4321 (o 4323 si 4321 esta ocupado)
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

call npm run dev

pause


