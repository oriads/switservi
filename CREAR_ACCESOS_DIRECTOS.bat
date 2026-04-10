@echo off
REM ============================================
REM Crear Accesos Directos en el Escritorio
REM ============================================

echo.
echo ============================================================
echo     CREANDO ACCESOS DIRECTOS EN EL ESCRITORIO
echo ============================================================
echo.
echo  Esto creara iconos en tu escritorio para:
echo  - Iniciar el sistema facilmente
echo  - Detener el sistema correctamente
echo.
echo ============================================================
echo.

REM Obtener ruta del escritorio
for /f "tokens=2,*" %%A in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v Desktop') do set DESKTOP=%%B

if "%DESKTOP%"=="" (
    echo [ERROR] No se pudo encontrar la ruta del escritorio
    echo.
    pause
    exit /b 1
)

echo [OK] Escritorio encontrado: %DESKTOP%
echo.

REM Directorio del proyecto
set PROJECT_DIR=C:\Users\mpas1\VISUAL CODE\switservi\helpdesk-ibmi

echo [1/3] Creando acceso directo para INICIAR...

REM Crear acceso directo para iniciar
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\INICIAR HelpDesk.lnk'); $Shortcut.TargetPath = '%PROJECT_DIR%\INICIAR_HELPDESK.bat'; $Shortcut.WorkingDirectory = '%PROJECT_DIR%'; $Shortcut.Description = 'Iniciar sistema HelpDesk IBM i'; $Shortcut.Save(); Write-Host '      [OK] Acceso directo creado'"

echo.
echo [2/3] Creando acceso directo para DETENER...

REM Crear acceso directo para detener
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\DETENER HelpDesk.lnk'); $Shortcut.TargetPath = '%PROJECT_DIR%\DETENER_SISTEMA.bat'; $Shortcut.WorkingDirectory = '%PROJECT_DIR%'; $Shortcut.Description = 'Detener sistema HelpDesk IBM i'; $Shortcut.Save(); Write-Host '      [OK] Acceso directo creado'"

echo.
echo [3/3] Creando acceso directo para instrucciones...

REM Crear acceso directo para instrucciones
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\INSTRUCCIONES HelpDesk.lnk'); $Shortcut.TargetPath = 'notepad.exe'; $Shortcut.Arguments = '%PROJECT_DIR%\INSTRUCCIONES_PARA_EL_USUARIO.txt'; $Shortcut.WorkingDirectory = '%PROJECT_DIR%'; $Shortcut.Description = 'Ver instrucciones de uso'; $Shortcut.Save(); Write-Host '      [OK] Acceso directo creado'"

echo.
echo ============================================================
echo.
echo  ACCESOS DIRECTOS CREADOS EN TU ESCRITORIO
echo.
echo  Ahora veras 3 nuevos iconos en tu escritorio:
echo.
echo  1. INICIAR HelpDesk     - Para abrir el sistema
echo  2. DETENER HelpDesk     - Para cerrar el sistema
echo  3. INSTRUCCIONES        - Para leer el manual
echo.
echo ============================================================
echo.
echo  INSTRUCCIONES RAPIDAS:
echo.
echo  PARA USAR:
echo  1. Haz doble clic en "INICIAR HelpDesk"
echo  2. Espera a que se abra el navegador
echo  3. Usa el sistema normalmente
echo  4. Al terminar, cierra el navegador
echo  5. Haz doble clic en "DETENER HelpDesk"
echo.
echo ============================================================
echo.
pause
