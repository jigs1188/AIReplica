@echo off
title AIReplica - Production AI Auto-Reply System

echo ================================================================
echo                 🚀 AIReplica Production System
echo                Real AI Auto-Replies for Social Media
echo ================================================================
echo.

echo 📋 Starting production services...

REM Install dependencies if needed
echo 🔸 Installing dependencies...
call npm install >nul 2>&1

echo.
echo 🔸 Starting WhatsApp Web Service (Port 3004)...
start "WhatsApp Web Service" cmd /k "cd /d %~dp0 && node whatsapp-web-service.js"

timeout /t 3 /nobreak >nul

echo 🔸 Starting Production API Service (Port 3001)...
start "Production Service" cmd /k "cd /d %~dp0 && node production-service.js"

timeout /t 3 /nobreak >nul

echo 🔸 Starting Mobile App (Port 8082)...
start "Mobile App" cmd /k "cd /d %~dp0 && npx expo start"

echo.
echo ================================================================
echo                        ✅ SYSTEM READY!
echo ================================================================
echo.
echo 📱 WHATSAPP WEB SETUP:
echo    1. Check WhatsApp Web Service terminal for QR code
echo    2. Scan QR code with your WhatsApp app
echo    3. POST to http://localhost:3004/api/enable-auto-reply
echo.
echo 🌐 API SERVICES:
echo    • Production API: http://localhost:3001
echo    • WhatsApp Web:   http://localhost:3004  
echo    • Mobile App:     http://localhost:8082
echo.
echo 🤖 AI AUTO-REPLIES:
echo    • WhatsApp messages will get AI responses
echo    • Instagram DMs will get AI responses  
echo    • Gmail emails will get AI responses
echo    • All powered by OpenRouter/LLaMA models
echo.
echo � MONITORING:
echo    • WhatsApp Status: http://localhost:3004/api/status
echo    • API Health:      http://localhost:3001/health
echo    • Auto-Reply Users: http://localhost:3004/api/auto-reply-users
echo.
echo ================================================================
echo            🎉 Your AI Assistant is LIVE and Ready!
echo      Ask friends to message you and see AI auto-replies! 🚀
echo ================================================================
echo   1. Scan QR code with Expo Go app
echo   2. Go to Integration Hub to connect platforms
echo   3. Test AI replies with friends!
echo.
pause
