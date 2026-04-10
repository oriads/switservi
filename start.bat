@echo off
REM ============================================
REM Script de Inicio Rápido - HelpDesk IBM i
REM Windows Batch File
REM ============================================

echo.
echo ╔════════════════════════════════════════════════╗
echo ║     HelpDesk IBM i - Script de Inicio         ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Verificar Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker no esta instalado.
    echo Instala Docker Desktop para Windows.
    pause
    exit /b 1
)

REM Verificar docker-compose
where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] docker-compose no esta instalado.
    pause
    exit /b 1
)

REM Verificar archivo .env
if not exist ".env" (
    echo [INFO] Creando archivo .env desde .env.example...
    copy .env.example .env
    echo [INFO] IMPORTANTE: Editar .env con tus configuraciones.
    echo.
)

REM Iniciar servicios
echo [INFO] Iniciando servicios con Docker Compose...
echo.
docker-compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔════════════════════════════════════════════════╗
    echo ║         Servicios Iniciados Correctamente     ║
    echo ╠════════════════════════════════════════════════╣
    echo ║  PostgreSQL:   localhost:5432                  ║
    echo ║  API Node.js:  http://localhost:3000           ║
    echo ║  Backend Go:   http://localhost:8080           ║
    echo ║  pgAdmin:      http://localhost:5050           ║
    echo ╚════════════════════════════════════════════════╝
    echo.
    echo [INFO] Verificando servicios...
    echo.
    
    timeout /t 5 /nobreak >nul
    
    echo [INFO] Verificando API Node.js...
    curl -s http://localhost:3000/health >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] API Node.js responde correctamente
    ) else (
        echo [ESPERA] API Node.js aun iniciando, espera unos segundos...
    )
    
    echo.
    echo [INFO] Verificando Backend Go...
    curl -s http://localhost:8080/api/health >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Backend Go responde correctamente
    ) else (
        echo [ESPERA] Backend Go aun iniciando, espera unos segundos...
    )
    
    echo.
    echo [INFO] Para ver logs: docker-compose logs -f
    echo [INFO] Para detener: docker-compose down
    echo.
) else (
    echo.
    echo [ERROR] Error iniciando servicios.
    echo Revisa la configuracion en .env
    echo.
)

pause
