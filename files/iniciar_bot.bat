@echo off
REM ============================================================
REM Inicia o bot Telegram Farm Home
REM Duplo clique neste arquivo (ou num atalho dele) pra ligar
REM ============================================================

title Bot Telegram - Farm Home

cd /d "%~dp0"

echo.
echo =============================================
echo    Iniciando Bot Telegram - Farm Home
echo =============================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo ERRO: venv nao encontrada em %~dp0venv
    echo Crie o ambiente virtual antes de rodar o bot.
    pause
    exit /b 1
)

if not exist ".env" (
    echo ERRO: arquivo .env nao encontrado em %~dp0
    echo Configure as variaveis de ambiente antes de rodar.
    pause
    exit /b 1
)

"venv\Scripts\python.exe" bot_telegram.py

echo.
echo =============================================
echo    Bot encerrado. Pressione uma tecla.
echo =============================================
pause >nul
