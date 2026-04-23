@echo off
REM ============================================================
REM Abre o web app BOTI (Vercel) em modo app no Chrome
REM ============================================================

set "URL=https://botpedro.vercel.app"
set "CHROME="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if "%CHROME%"=="" (
    echo Chrome nao encontrado. Abrindo no navegador padrao...
    start "" "%URL%"
    exit /b 0
)

start "" "%CHROME%" --app=%URL%
exit /b 0
