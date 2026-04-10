@echo off
REM ============================================
REM HelpDesk IBM i - Detener Sistema
REM ============================================

color 0C
title HelpDesk IBM i - Deteniendo Sistema

echo.
echo ============================================================
echo          DETENIENDO EL SISTEMA
echo ============================================================
echo.
echo  Esto cerrara todos los servicios del HelpDesk IBM i.
echo.
echo  Antes de continuar, asegurate de:
echo  - Haber guardado cualquier trabajo pendiente
echo  - Haber cerrado el navegador
echo.
echo ============================================================
echo.

set /p CONFIRM="Estas seguro que deseas detener el sistema? (S/N): "

if /i not "%CONFIRM%"=="S" (
    echo.
    echo  Operacion cancelada. El sistema seguira funcionando.
    echo.
    pause
    exit /b 0
)

echo.
echo [1/3] Deteniendo servicios...
echo.

REM Cambiar al directorio del proyecto
cd /d "C:\Users\mpas1\VISUAL CODE\switservi\helpdesk-ibmi"

REM Detener contenedores
docker-compose down

if %ERRORLEVEL% EQU 0 (
    echo      [OK] Servicios detenidos correctamente
) else (
    echo      [!] Hubo un problema al detener los servicios
    echo      Intentando forzar la detencion...
    docker stop helpdesk-frontend helpdesk-api-node helpdesk-backend-go helpdesk-postgres helpdesk-pgadmin 2>nul
)

echo.

REM Eliminar indicador
if exist "%TEMP%\helpdesk-running" (
    del "%TEMP%\helpdesk-running"
)

echo [2/3] Limpiando...
echo      [OK] Sistema limpiado
echo.

echo [3/3] Finalizado
echo.

color 0A
echo ============================================================
echo.
echo          SISTEMA DETENIDO CORRECTAMENTE
echo.
echo  Todos los servicios han sido cerrados.
echo  Para volver a iniciar, ejecuta:
echo.
echo         INICIAR_HELPDESK.bat
echo.
echo ============================================================
echo.
pause
