@echo off
echo.
echo ========================================
echo   AIReplica WhatsApp Webhook Server
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Display Node.js version
echo Node.js version:
node --version
echo.

:: Check if dependencies are installed
if not exist node_modules (
    echo Installing dependencies...
    echo.
    npm install express cors axios
    echo.
)

:: Check if working webhook server exists
if not exist working-webhook-server.js (
    echo ERROR: working-webhook-server.js not found
    echo Please ensure you're in the correct directory
    pause
    exit /b 1
)

echo Starting AIReplica WhatsApp Webhook Server...
echo.
echo Server will be available at:
echo - Webhook: http://localhost:3000/webhook
echo - API: http://localhost:3000/api/config
echo - Health: http://localhost:3000/health
echo.
echo Press Ctrl+C to stop the server
echo.

:: Start the server
node working-webhook-server.js

pause
