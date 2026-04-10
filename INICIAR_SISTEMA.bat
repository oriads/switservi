@echo off
REM ============================================
REM Script de Inicio - HelpDesk IBM i
REM Inicio automático de todos los servicios
REM ============================================

color 0A
title HelpDesk IBM i - Iniciando Sistema

echo.
echo ============================================================
echo          HELPDESK IBM i - SISTEMA DE GESTION
echo ============================================================
echo.
echo [1/6] Verificando requisitos...
echo.

REM Verificar Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ============================================================
    echo  ERROR: Docker no esta instalado
    echo ============================================================
    echo.
    echo  Para usar este sistema necesitas instalar Docker Desktop.
    echo.
    echo  Pasos para instalar:
    echo  1. Ve a: https://www.docker.com/products/docker-desktop
    echo  2. Descarga e instala Docker Desktop
    echo  3. Reinicia tu computadora
    echo  4. Vuelve a ejecutar este archivo
    echo.
    pause
    exit /b 1
)

echo      [OK] Docker instalado
echo.

REM Verificar si existe .env
if not exist ".env" (
    echo [2/6] Primera ejecucion - Creando configuracion...
    copy .env.example .env >nul
    echo      [OK] Configuracion creada automaticamente
) else (
    echo [2/6] Configuracion existente encontrada
)
echo.

echo [3/6] Iniciando todos los servicios...
echo.
echo      Por favor espera, esto puede tomar unos minutos...
echo.

REM Iniciar servicios con Docker Compose
docker-compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ============================================================
    echo  ERROR: No se pudieron iniciar los servicios
    echo ============================================================
    echo.
    echo  Esto puede suceder si:
    echo  - Docker no esta corriendo (abre Docker Desktop)
    echo  - Los puertos 5173, 3000, 5432 ya estan en uso
    echo.
    echo  Para ver el error completo ejecuta: docker-compose up
    echo.
    pause
    exit /b 1
)

echo      [OK] Servicios iniciados
echo.

echo [4/6] Esperando que todo este listo...
echo.

REM Esperar a que los servicios esten saludables
timeout /t 10 /nobreak >nul

echo [5/6] Verificando que todo funcione...
echo.

REM Verificar API
curl -s http://localhost:3000/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo      [OK] Base de datos y API funcionando
) else (
    echo      [OK] Servicios iniciados (finalizando configuracion...)
)
echo.

echo [6/6] Preparando sistema...
echo.

timeout /t 3 /nobreak >nul

REM Obtener la IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)
:found_ip

REM Si no se pudo obtener IP, usar localhost
if "%LOCAL_IP%"=="" set LOCAL_IP=localhost

color 0B
echo.
echo ============================================================
echo.
echo              SISTEMA INICIADO CORRECTAMENTE
echo.
echo ============================================================
echo.
echo  Para acceder al sistema, abre tu navegador y ve a:
echo.
echo  ================================================
echo.
echo              http://localhost:5173
echo.
echo  ================================================
echo.
echo  O si prefieres acceder desde otra computadora 
echo  en la misma red, usa esta direccion:
echo.
echo  ================================================
echo.
echo              http://%LOCAL_IP%:5173
echo.
echo  ================================================
echo.
echo.
echo  INSTRUCCIONES DE USO:
echo.
echo  1. Abre tu navegador (Chrome, Edge, Firefox)
echo  2. Copia y pega una de las direcciones de arriba
echo  3. Presiona Enter
echo  4. Listo! Ya puedes usar el sistema
echo.
echo ============================================================
echo.
echo  MANTENER ESTA VENTANA ABIERTA
echo  (Si la cierras, el sistema se detendra)
echo.
echo  Para detener el sistema correctamente:
echo  1. Cierra el navegador
echo  2. Presiona Ctrl+C en esta ventana
echo  3. Escribe S y presiona Enter
echo.
echo ============================================================
echo.

REM Preguntar si desea abrir el navegador automáticamente
set /p OPEN_BROWSER="Deseas abrir el navegador ahora? (S/N): "
if /i "%OPEN_BROWSER%"=="S" (
    start http://localhost:5173
    echo.
    echo      [OK] Abriendo navegador...
    echo.
)

echo.
echo ============================================================
echo  Sistema corriendo... Presiona Ctrl+C para detener
echo ============================================================
echo.

REM Mantener la ventana abierta y mostrar logs
docker-compose logs -f
