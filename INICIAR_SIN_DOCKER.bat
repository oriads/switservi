@echo off
REM ============================================
REM HelpDesk IBM i - Inicio SIN Docker
REM Modo de Desarrollo Local (Solo Frontend)
REM ============================================

title HelpDesk IBM i - Iniciando...
color 0A

echo.
echo ============================================================
echo.
echo          INICIANDO HELPDESK IBM i
echo          (Modo Desarrollo - Sin Docker)
echo.
echo ============================================================
echo.
echo  Este modo solo inicia la interfaz visual.
echo  Para funciones completas, necesitas Docker.
echo.
echo ============================================================
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ============================================================
    echo  ERROR: Node.js no esta instalado
    echo ============================================================
    echo.
    echo  Necesitas instalar Node.js para usar este sistema.
    echo.
    echo  PASOS:
    echo.
    echo  1. Ve a: https://nodejs.org
    echo.
    echo  2. Descarga la version LTS (recomendada)
    echo.
    echo  3. Instalo siguiendo las instrucciones
    echo.
    echo  4. Reinicia tu computadora
    echo.
    echo  5. Vuelve a ejecutar este archivo
    echo.
    echo ============================================================
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

cd frontend

echo [1/3] Verificando dependencias...
echo.

if not exist "node_modules" (
    echo      Instalando dependencias...
    echo      Esto puede tardar 2-3 minutos...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo ============================================================
        echo  ERROR al instalar dependencias
        echo ============================================================
        echo.
        pause
        exit /b 1
    )
    echo.
    echo      [OK] Dependencias instaladas
) else (
    echo      [OK] Dependencias encontradas
)
echo.

echo [2/3] Iniciando servidor...
echo.
echo      El servidor iniciara en: http://localhost:5173
echo.
echo      Por favor espera...
echo.

timeout /t 2 /nobreak >nul

echo [3/3] Abriendo navegador...
echo.
echo ============================================================
echo.
echo  ¡LISTO! Abriendo sistema en tu navegador...
echo.
echo  Si no abre automaticamente, escribe esta direccion:
echo.
echo         http://localhost:5173
echo.
echo ============================================================
echo.
echo  ⚠️  IMPORTANTE:
echo.
echo  Este modo es SOLO para ver la interfaz visual.
echo  Las funciones como guardar cambios, subir archivos,
echo  etc. NO funcionaran sin el backend (Docker).
echo.
echo  Para funciones completas:
echo  1. Instala Docker Desktop
echo  2. Usa el archivo: INICIAR_HELPDESK.bat
echo.
echo ============================================================
echo.
echo  Manten esta ventana ABIERTA mientras usas el sistema.
echo  Para cerrar: presiona Ctrl+C y escribe S
echo.
echo ============================================================
echo.

timeout /t 3 /nobreak >nul

REM Abrir navegador
start http://localhost:5173

REM Iniciar servidor de desarrollo
call npm run dev
