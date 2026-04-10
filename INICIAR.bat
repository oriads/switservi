@echo off
REM ============================================
REM HelpDesk IBM i - Inicio Simple para Usuarios
REM ============================================

title Abriendo HelpDesk IBM i...
color 0A

echo.
echo ============================================================
echo.
echo              Abriendo HelpDesk IBM i
echo.
echo ============================================================
echo.
echo  Por favor espera un momento...
echo.
echo  Si es la primera vez, esto puede tardar unos minutos.
echo  Las siguientes veces sera mas rapido.
echo.
echo ============================================================
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

REM Verificar Docker rapidamente
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ============================================================
    echo.
    echo  ATENCION
    echo.
    echo  Falta instalar Docker en esta computadora.
    echo.
    echo  Por favor contacta al departamento de sistemas para 
    echo  que instalen Docker Desktop.
    echo.
    echo ============================================================
    echo.
    pause
    exit /b 1
)

REM Verificar si ya esta corriendo
docker ps --format "{{.Names}}" 2>nul | findstr "helpdesk-frontend" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  [OK] El sistema ya esta corriendo.
    echo.
    goto :abrir
)

REM Iniciar si no esta corriendo
echo  Iniciando sistema...
echo.
docker-compose up -d --quiet-pull 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================================
    echo.
    echo  Hubo un problema al iniciar.
    echo.
    echo  Intenta esto:
    echo  1. Abre Docker Desktop desde el menu inicio
    echo  2. Espera a que Docker este listo (icono verde abajo)
    echo  3. Vuelve a ejecutar este archivo
    echo.
    echo ============================================================
    echo.
    pause
    exit /b 1
)

echo.
echo  [OK] Sistema iniciado correctamente
echo.

:abrir
echo ============================================================
echo.
echo  ¡LISTO! Abriendo el sistema en tu navegador...
echo.
echo  Si no abre automaticamente, puedes escribir esta 
echo  direccion en tu navegador:
echo.
echo         http://localhost:5173
echo.
echo ============================================================
echo.

REM Esperar un poco para que los servicios esten listos
timeout /t 5 /nobreak >nul

REM Abrir navegador
start http://localhost:5173

echo  El sistema se abrio en tu navegador.
echo.
echo  Puedes minimizar esta ventana, pero NO LA CIERRES.
echo  Si la cierras, el sistema se detendra.
echo.
echo  Para cerrar correctamente:
echo  1. Cierra tu navegador
echo  2. Ejecuta "DETENER_SISTEMA.bat"
echo.
echo ============================================================
echo.
echo  Disfruta usando el HelpDesk IBM i! 😊
echo.
echo ============================================================
echo.
pause
