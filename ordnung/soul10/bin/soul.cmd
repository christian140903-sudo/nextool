@echo off
rem soul -- Zeiger auf die Maschine; die Logik lebt in core\cli.py (ARCHITEKTUR 5.11).
setlocal
set "SOUL_CLI=%~dp0..\core\cli.py"
where python3 >nul 2>nul
if %ERRORLEVEL%==0 (
  python3 "%SOUL_CLI%" %*
) else (
  python "%SOUL_CLI%" %*
)
exit /b %ERRORLEVEL%
