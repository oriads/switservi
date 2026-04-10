@echo off
REM ============================================
REM HelpDesk IBM i - Configuración Principal
REM Este archivo configura todo el sistema
REM ============================================

color 0A
title HelpDesk IBM i - Configuracion del Sistema

echo.
echo ============================================================
echo          CONFIGURACION INICIAL DEL SISTEMA
echo ============================================================
echo.
echo  Este archivo preparara todo para que puedas usar el sistema
echo  de manera sencilla.
echo.
echo ============================================================
echo.

REM ============================================
REM 1. VERIFICAR REQUISITOS
REM ============================================
echo [1/5] Verificando requisitos...
echo.

REM Verificar Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ============================================================
    echo  ATENCION: Docker no esta instalado
    echo ============================================================
    echo.
    echo  Este sistema necesita Docker para funcionar.
    echo.
    echo  PASOS PARA SOLUCIONAR:
    echo.
    echo  1. Ve a esta pagina en tu navegador:
    echo     https://www.docker.com/products/docker-desktop
    echo.
    echo  2. Descarga Docker Desktop (version para Windows)
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

echo      [OK] Docker instalado y listo
echo.

REM ============================================
REM 2. CREAR ACCESOS DIRECTOS
REM ============================================
echo [2/5] Preparando accesos directos...
echo.

REM Obtener ruta del escritorio
for /f "tokens=2,*" %%A in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v Desktop') do set DESKTOP=%%B

if "%DESKTOP%"=="" (
    echo      [!] No se pudo encontrar el escritorio
    echo      Puedes crear los accesos directos manualmente despues
) else (
    set PROJECT_DIR=%~dp0
    set PROJECT_DIR=%PROJECT_DIR:~0,-1%
    
    REM Crear acceso directo para iniciar
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\INICIAR HelpDesk.lnk'); $Shortcut.TargetPath = '%PROJECT_DIR%\INICIAR_HELPDESK.bat'; $Shortcut.WorkingDirectory = '%PROJECT_DIR%'; $Shortcut.Description = 'Iniciar sistema HelpDesk IBM i'; $Shortcut.Icon = '%SystemRoot%\System32\imageres.dll,-100'; $Shortcut.Save()"
    
    REM Crear acceso directo para detener
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\DETENER HelpDesk.lnk'); $Shortcut.TargetPath = '%PROJECT_DIR%\DETENER_SISTEMA.bat'; $Shortcut.WorkingDirectory = '%PROJECT_DIR%'; $Shortcut.Description = 'Detener sistema HelpDesk IBM i'; $Shortcut.Icon = '%SystemRoot%\System32\imageres.dll,-102'; $Shortcut.Save()"
    
    REM Crear acceso directo para instrucciones
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\INSTRUCCIONES HelpDesk.lnk'); $Shortcut.TargetPath = 'notepad.exe'; $Shortcut.Arguments = '%PROJECT_DIR%\INSTRUCCIONES_PARA_EL_USUARIO.txt'; $Shortcut.WorkingDirectory = '%PROJECT_DIR%'; $Shortcut.Description = 'Ver instrucciones de uso'; $Shortcut.Icon = '%SystemRoot%\System32\imageres.dll,-105'; $Shortcut.Save()"
    
    echo      [OK] Accesos directos creados en tu escritorio
)
echo.

REM ============================================
REM 3. CONFIGURAR VARIABLES DE ENTORNO
REM ============================================
echo [3/5] Configurando variables...
echo.

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo      [OK] Configuracion creada automaticamente
    )
) else (
    echo      [OK] Configuracion ya existe
)
echo.

REM ============================================
REM 4. MOSTRAR INSTRUCCIONES
REM ============================================
echo [4/5] Instrucciones de uso
echo.
echo ============================================================
echo.
echo  ¡TODO LISTO! Ahora puedes usar el sistema facilmente.
echo.
echo  EN TU ESCRITORIO VERAS 3 NUEVOS ICONOS:
echo.
echo  1. INICIAR HelpDesk     (Icono verde)
echo     - Haz doble clic para abrir el sistema
echo.
echo  2. DETENER HelpDesk     (Icono rojo)
echo     - Haz doble clic para cerrar el sistema
echo.
echo  3. INSTRUCCIONES        (Icono amarillo)
echo     - Abre el manual de usuario
echo.
echo ============================================================
echo.
echo  COMO USAR EL SISTEMA:
echo.
echo  PASO 1: Haz doble clic en "INICIAR HelpDesk"
echo.
echo  PASO 2: Espera a que se abra tu navegador automaticamente
echo.
echo  PASO 3: En la pantalla de bienvenida, haz clic en el 
echo          boton verde grande para entrar al sistema
echo.
echo  PASO 4: Usa el sistema normalmente
echo.
echo  PASO 5: Al terminar, cierra el navegador y luego haz 
echo          doble clic en "DETENER HelpDesk"
echo.
echo ============================================================
echo.

REM ============================================
REM 5. PREGUNTAR SI DESEA INICIAR AHORA
REM ============================================
echo [5/5] ¿Deseas iniciar el sistema ahora?
echo.

set /p INICIAR="¿Deseas iniciar el sistema ahora? (S/N): "

if /i "%INICIAR%"=="S" (
    echo.
    echo  Abriendo sistema...
    echo.
    start INICIAR_HELPDESK.bat
    echo.
    echo ============================================================
    echo  El sistema se esta iniciando en otra ventana.
    echo.
    echo  Puedes cerrar esta ventana si lo deseas.
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo  Configuracion completada.
    echo.
    echo  Para iniciar el sistema cuando lo necesites:
    echo  - Ve a tu escritorio
    echo  - Haz doble clic en "INICIAR HelpDesk"
    echo ============================================================
)

echo.
pause
