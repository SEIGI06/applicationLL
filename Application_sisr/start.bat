@echo off
REM Debug: Pause at start to verify script runs
echo [DEBUG] Script demarre...
pause

setlocal EnableDelayedExpansion

REM ========================================
REM  GSB Infrastructure Manager - Smart Launcher
REM  Auto-setup: Node.js + Dependencies
REM ========================================

title GSB Infrastructure Manager Launcher

echo ========================================
echo   GSB Infrastructure Manager v2.3
echo   Initialisation du systeme...
echo ========================================
echo.

REM --- Configuration ---
set "NODE_VERSION=v20.11.0"
set "NODE_DIST=node-%NODE_VERSION%-win-x64"
set "NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/%NODE_DIST%.zip"
set "LOCAL_BIN=bin"
set "LOCAL_NODE=%~dp0%LOCAL_BIN%\%NODE_DIST%"

REM 1. Check for System Node.js
echo [1/4] Verification de Node.js...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo     [INFO] Node.js systeme detecte.
    goto :check_deps
)

REM 2. Check for Local Portable Node.js
if exist "%LOCAL_NODE%\node.exe" (
    echo     [INFO] Node.js portable detecte.
    set "PATH=%LOCAL_NODE%;%PATH%"
    goto :check_deps
)

REM 3. Download Portable Node.js if missing
echo     [WARN] Node.js non trouve.
echo     [INFO] Telechargement de la version portable (%NODE_VERSION%)...
echo     (Cela peut prendre quelques minutes selon votre connexion)

if not exist "%LOCAL_BIN%" mkdir "%LOCAL_BIN%"

powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%LOCAL_BIN%\node.zip'"
if %errorlevel% neq 0 (
    echo     [ERREUR] Echec du telechargement.
    goto :error
)

echo     [INFO] Extraction des fichiers...
powershell -Command "Expand-Archive -Path '%LOCAL_BIN%\node.zip' -DestinationPath '%LOCAL_BIN%' -Force"
del "%LOCAL_BIN%\node.zip"

set "PATH=%LOCAL_NODE%;%PATH%"
echo     [OK] Node.js portable installe et configure.
pause

:check_deps
REM 4. Check and Install Dependencies
echo.
echo [2/4] Verification des dependances...
echo [DEBUG] Verification des versions...
echo   - Node:
node --version
if %errorlevel% neq 0 echo [ERREUR] Node non detecte!

echo   - NPM:
call npm --version
if %errorlevel% neq 0 echo [ERREUR] NPM non detecte!
pause

if exist "node_modules\" (
    echo     [INFO] Dossier node_modules present.
) else (
    echo     [WARN] Dependances manquantes.
    echo     [INFO] Installation automatique - npm install...
    echo [DEBUG] Lancement de npm install...
    call npm install
    if !errorlevel! neq 0 (
        echo     [ERREUR] L'installation des dependances a echoue.
        goto :error
    )
    echo     [OK] Dependances installees.
)
echo [DEBUG] Fin du bloc dependances.
pause

REM 5. Start Application
echo.
echo [DEBUG] Debut Etape 3...
echo [3/4] Preparation du lancement...
echo [DEBUG] Etape 3 passee.
echo.
echo [4/4] Lancement de l'application...
echo [DEBUG] Avant npm start...

REM Use npm start to launch
echo [DEBUG] Execution de: call npm start
call npm start
echo [DEBUG] Retour de npm start. Code: %errorlevel%

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] L'application s'est arretee avec une erreur (Code: %errorlevel%).
    goto :error
)

echo [DEBUG] Fin normale.
goto :end

:error
echo.
echo ========================================
echo   UNE ERREUR EST SURVENUE
echo ========================================
echo.
pause
exit /b 1

:end
echo.
echo ========================================
echo   Fin de l'execution.
echo ========================================
pause

