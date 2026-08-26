@echo off
setlocal
title KAI STUDIO - Production Local

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js/npm was not found. Install Node.js and try again.
  pause
  exit /b 1
)

if not exist "node_modules\vite\package.json" goto install_dependencies
if not exist "node_modules\concurrently\package.json" goto install_dependencies
goto start_app

:install_dependencies
echo [SETUP] Installing dependencies...
call npm ci
if errorlevel 1 goto failed

:start_app
echo [START] Building and running KAI STUDIO in production mode...
echo [INFO] Press Ctrl+C to stop the API and web servers.
call npm run prod:local
if errorlevel 1 goto failed
exit /b 0

:failed
set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo [ERROR] Production startup failed with exit code %EXIT_CODE%.
pause
exit /b %EXIT_CODE%
