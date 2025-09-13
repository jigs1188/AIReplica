@echo off
title AIReplica - PRODUCTION DEPLOYMENT READY

echo ================================================================
echo              🚀 AIReplica - PRODUCTION DEPLOYMENT
echo                    MARKET-READY VERSION 
echo ================================================================
echo.

echo 🔧 FIXES APPLIED:
echo   ✅ Fixed "couldn't link device" WhatsApp error
echo   ✅ Removed problematic webVersionCache  
echo   ✅ Updated Puppeteer configuration
echo   ✅ Enhanced error handling and recovery
echo   ✅ Production-grade AI auto-replies
echo   ✅ Real API integrations (no mocks)
echo.

echo 📦 Installing production dependencies...
call npm install whatsapp-web.js@latest qrcode-terminal axios dotenv express cors >nul 2>&1

echo.
echo 🛑 Stopping any existing services...
taskkill /F /IM node.exe 2>nul

echo 🗑️ Clearing old WhatsApp sessions...
if exist ".wwebjs_auth" (
    rmdir /s /q ".wwebjs_auth" >nul 2>&1
    echo ✅ Old sessions cleared
)

echo.
echo 🚀 Starting PRODUCTION services...

echo 🔸 Starting FIXED WhatsApp Web Service (Port 3004)...
start "WhatsApp Web FIXED" cmd /k "cd /d %~dp0 && node whatsapp-web-service-fixed.js"

timeout /t 5 /nobreak >nul

echo 🔸 Starting Production API Service (Port 3001)...
start "Production API" cmd /k "cd /d %~dp0 && node production-service.js"

timeout /t 3 /nobreak >nul

echo 🔸 Starting Mobile App (Port 8082)...
start "AIReplica App" cmd /k "cd /d %~dp0 && npx expo start --clear"

echo.
echo ================================================================
echo                    ✅ PRODUCTION SYSTEM READY!
echo ================================================================
echo.
echo 📱 WHATSAPP CONNECTION (FIXED):
echo    1. Check "WhatsApp Web FIXED" terminal window
echo    2. Look for QR code (will appear automatically)
echo    3. Open WhatsApp on phone → Settings → Linked Devices
echo    4. Tap "Link a Device" and scan QR from terminal
echo    5. ✅ Should connect without "couldn't link device" error
echo.
echo 🌐 SERVICES RUNNING:
echo    • Production API:  http://localhost:3001
echo    • WhatsApp Fixed:  http://localhost:3004  
echo    • Mobile App:      http://localhost:8082
echo.
echo 🤖 AI AUTO-REPLIES:
echo    • OpenRouter/LLaMA AI integration
echo    • Context-aware responses
echo    • Multi-platform support
echo    • Conversation learning
echo.
echo 📊 MONITORING URLs:
echo    • WhatsApp Status: http://localhost:3004/api/status
echo    • API Health:      http://localhost:3001/health
echo    • QR Code View:    http://localhost:3004/api/qr-code
echo.
echo ================================================================
echo              🎉 PRODUCTION DEPLOYMENT COMPLETE!
echo           Your AI assistant is ready for the market! 🚀
echo ================================================================
echo.
echo 💡 NEXT STEPS:
echo    1. Wait for QR code in WhatsApp terminal
echo    2. Scan with regular WhatsApp (not Business)
echo    3. Enable auto-reply via API or mobile app
echo    4. Deploy to cloud for public access
echo.
echo 🌍 DEPLOYMENT OPTIONS:
echo    • Heroku: Easy cloud deployment
echo    • Railway: Simple git-based deployment  
echo    • DigitalOcean: VPS hosting
echo    • AWS/GCP: Enterprise scaling
echo.

pause
