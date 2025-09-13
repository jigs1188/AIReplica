@echo off
title WHATSAPP INTEGRATION - PRODUCTION FIX
color 0A

echo.
echo ========================================
echo    🚀 WHATSAPP INTEGRATION FIX
echo ========================================
echo.

REM Clear Metro Cache
echo 🧹 Clearing Metro cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist ".expo" rmdir /s /q ".expo"

REM Start services
echo 📡 Starting Production Service...
start "Production Service" cmd /k "node production-service.js"
timeout /t 2 /nobreak >nul

echo 📱 Starting WhatsApp Service...
start "WhatsApp Service" cmd /k "node whatsapp-production-service.js"
timeout /t 2 /nobreak >nul

echo 🌐 Starting Expo (Web Mode)...
start "Expo Web" cmd /k "npx expo start --web --clear"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ✅ ALL SERVICES STARTED!
echo.
echo 🌐 Web App: http://localhost:8081
echo 📡 Production API: http://localhost:3001
echo 📱 WhatsApp API: http://localhost:3003
echo.
echo 📱 WhatsApp OTP Test:
echo Phone: +919106764653
echo Endpoint: http://localhost:3001/api/whatsapp/send-otp
echo.
echo ========================================
echo.
pause
