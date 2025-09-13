@echo off
title WhatsApp Web Service Restart

echo ================================================================
echo              🔄 Restarting WhatsApp Web Service
echo                     Fix Connection Issues
echo ================================================================
echo.

echo 🛑 Stopping existing WhatsApp Web processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq WhatsApp Web Service*" 2>nul

echo 🗑️ Clearing WhatsApp auth session...
if exist ".wwebjs_auth" (
    rmdir /s /q ".wwebjs_auth"
    echo ✅ Auth session cleared
) else (
    echo ℹ️ No auth session to clear
)

echo.
echo 🔄 Starting fresh WhatsApp Web Service...
echo.
echo ================================================================
echo                     📱 SCAN INSTRUCTIONS
echo ================================================================
echo.
echo 1. Wait for QR code to appear in the terminal
echo 2. Open WhatsApp on your phone
echo 3. Go to Settings → Linked Devices (NOT WhatsApp Web!)
echo 4. Tap "Link a Device"
echo 5. Scan the QR code from the terminal
echo.
echo ⚠️  IMPORTANT: Do NOT scan from WhatsApp Web browser!
echo    This causes "couldn't link device" error.
echo.
echo ================================================================

start "WhatsApp Web Service" cmd /k "node whatsapp-web-service.js"

echo.
echo ✅ WhatsApp Web Service restarted!
echo 📱 Check the new terminal window for QR code
echo.

timeout /t 5 /nobreak >nul

echo Opening status check...
start "" "http://localhost:3004/api/detailed-status"

pause
