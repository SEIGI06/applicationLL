@echo off
REM ========================================
REM  GSB Infrastructure Manager - Lanceur
REM  Installation automatique + Lancement
REM ========================================

echo ========================================
echo   GSB Infrastructure Manager v2.3
echo ========================================
echo.

REM Vérifier si les dépendances sont installées
if not exist "node_modules\" (
    echo [INFO] Premiere installation detectee...
    echo [INFO] Installation automatique des dependances...
    echo.
    
    REM Vérifier si Node.js est installé
    where node >nul 2>&1
    if errorlevel 1 (
        echo ERREUR: Node.js n'est pas installe!
        echo.
        echo Telechargez Node.js depuis: https://nodejs.org/
        echo Puis relancez cette application.
        echo.
        pause
        exit /b 1
    )
    
    echo Installation en cours, veuillez patienter...
    call npm install
    
    if errorlevel 1 (
        echo.
        echo ERREUR: L'installation a echoue!
        echo Executez manuellement: npm install
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo [OK] Dependances installees avec succes!
    echo.
)

REM Vérifier si Electron est installé
if not exist "node_modules\\electron\\dist\\electron.exe" (
    echo ERREUR: Electron n'est pas correctement installe!
    echo.
    echo Executez: npm install
    echo.
    pause
    exit /b 1
)

echo Lancement de l'application...
echo.

start "" "node_modules\\electron\\dist\\electron.exe" "%~dp0main.js"

echo Application lancee!
echo Vous pouvez fermer cette fenetre.
timeout /t 2
