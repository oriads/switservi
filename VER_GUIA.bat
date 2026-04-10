@echo off
REM ============================================
REM HelpDesk IBM i - Abrir Guia de Inicio
REM ============================================

title Ayuda - HelpDesk IBM i
color 0A

echo.
echo ============================================================
echo          ABRIENDO GUIA DE INICIO
echo ============================================================
echo.

REM Abrir el archivo de instrucciones
start "" "%~dp0👉_LEEME_PRIMERO.txt"

echo.
echo  Se abrio la guia de inicio.
echo.
echo  Lee las instrucciones y sigue los pasos.
echo.
echo ============================================================
echo.
pause
