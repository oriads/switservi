@echo off
REM ============================================
REM HelpDesk IBM i - Acceso Directo para Usuarios
REM Este archivo puede estar en el escritorio
REM ============================================

color 0A
title HelpDesk IBM i - Sistema de Gestion

echo.
echo ============================================================
echo.
echo          Ayudando a iniciar el sistema...
echo          Por favor espera un momento...
echo.
echo ============================================================
echo.

REM Verificar si ya existe un archivo que indique que Docker está corriendo
if exist "%TEMP%\helpdesk-running" (
    echo [INFO] El sistema ya esta en ejecucion.
    echo.
    goto :open_browser
)

REM Verificar Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ============================================================
    echo  ATENCION: Se requiere Docker
    echo ============================================================
    echo.
    echo  Este sistema necesita Docker instalado.
    echo  Contacta al departamento de sistemas para instalarlo.
    echo.
    pause
    exit /b 1
)

echo [1/4] Verificando sistema...
echo.

REM Cambiar al directorio del proyecto
cd /d "C:\Users\mpas1\VISUAL CODE\switservi\helpdesk-ibmi"

REM Verificar si existe .env
if not exist ".env" (
    echo [2/4] Primera vez - Configurando...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo      [OK] Configuracion creada
    )
) else (
    echo [2/4] Configuracion lista
)
echo.

REM Verificar si los contenedores ya están corriendo
docker ps --format "{{.Names}}" | findstr "helpdesk-frontend" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [3/4] Sistema ya esta corriendo
) else (
    echo [3/4] Iniciando sistema...
    echo      Esto puede tomar unos minutos la primera vez...
    echo.
    docker-compose up -d --build
    echo      [OK] Sistema iniciado
)
echo.

REM Guardar indicador de que está corriendo
echo %DATE% %TIME% > "%TEMP%\helpdesk-running"

:open_browser
echo [4/4] Abriendo sistema en tu navegador...
echo.

timeout /t 3 /nobreak >nul

REM Abrir página de bienvenida
start http://localhost:5173

color 0B
echo.
echo ============================================================
echo.
echo  EL SISTEMA SE ABRIO EN TU NAVEGADOR
echo.
echo  Si no lo ves, abre tu navegador y ve a:
echo.
echo         http://localhost:5173
echo.
echo  ============================================================
echo.
echo  Para cerrar el sistema correctamente:
echo  1. Cierra el navegador
echo  2. Ejecuta el archivo "DETENER_SISTEMA.bat"
echo.
echo ============================================================
echo.
echo  Esta ventana puede permanecer abierta o puedes cerrarla.
echo  El sistema seguira funcionando hasta que lo detengas.
echo.
pause
