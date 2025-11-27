@echo off
REM ========================================
REM  GSB Infrastructure Manager - Installateur
REM  Installation automatique des dépendances
REM ========================================

echo ========================================
echo   GSB Infrastructure Manager v2.3
echo   Installation des dependances
echo ========================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installe sur cette machine!
    echo.
    echo Telechargez et installez Node.js depuis:
    echo https://nodejs.org/
    echo.
    echo Choisissez la version LTS (recommandee)
    echo.
    pause
    exit /b 1
)

REM Afficher la version de Node.js
echo [INFO] Node.js detecte:
node --version
echo.

REM Vérifier si les dépendances sont déjà installées
if exist "node_modules\" (
    echo [INFO] Les dependances sont deja installees.
    echo.
    choice /C ON /M "Voulez-vous reinstaller les dependances"
    if errorlevel 2 goto :skip_install
    if errorlevel 1 goto :do_install
) else (
    goto :do_install
)

:do_install
echo [INFO] Installation des dependances npm...
echo.
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERREUR: L'installation a echoue!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation terminee avec succes!
echo ========================================
echo.
goto :end

:skip_install
echo [INFO] Installation ignoree.
echo.

:end
echo Vous pouvez maintenant lancer l'application avec: start.bat
echo.
pause
