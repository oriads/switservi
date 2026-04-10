@echo off
REM ============================================
REM HelpDesk IBM i - Menú Principal
REM ============================================

title HelpDesk IBM i - Menu Principal
color 0B

echo.
echo ============================================================
echo.
echo              HELPDESK IBM i
echo              Menu Principal
echo.
echo ============================================================
echo.
echo  ¿Que deseas hacer?
echo.
echo  1. INICIAR el sistema (con Docker - COMPLETO)
echo  2. INICIAR el sistema (sin Docker - SOLO VISUAL)
echo  3. VER solucion de problemas
echo  4. ABRIR guia de usuario
echo  5. DETENER el sistema
echo  6. SALIR
echo.
echo ============================================================
echo.

set /p OPTION="Elige una opcion (1-6): "

if "%OPTION%"=="1" (
    start INICIAR_HELPDESK.bat
    echo.
    echo  Abriendo inicio con Docker...
) else if "%OPTION%"=="2" (
    start INICIAR_SIN_DOCKER.bat
    echo.
    echo  Abriendo inicio sin Docker...
) else if "%OPTION%"=="3" (
    start SOLUCION_ERROR.html
    echo.
    echo  Abriendo solucion de problemas...
) else if "%OPTION%"=="4" (
    start "" "👉_LEEME_PRIMERO.txt"
    echo.
    echo  Abriendo guia de usuario...
) else if "%OPTION%"=="5" (
    start DETENER_SISTEMA.bat
    echo.
    echo  Abriendo detener sistema...
) else if "%OPTION%"=="6" (
    echo.
    echo  ¡Hasta luego!
) else (
    echo.
    echo  Opcion no valida.
)

echo.
pause
