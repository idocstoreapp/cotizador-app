@echo off
echo ========================================
echo Iniciando Servidor de Desarrollo
echo Muebleria Cotizador
echo ========================================
echo.

echo Verificando instalacion...
if not exist "node_modules" (
    echo [ERROR] Las dependencias no estan instaladas
    echo.
    echo Ejecuta primero: instalar.bat
    echo.
    pause
    exit /b 1
)

echo [OK] Dependencias encontradas
echo.
echo Iniciando servidor...
echo El proyecto estara disponible en: http://localhost:4321
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

npm run dev

pause


