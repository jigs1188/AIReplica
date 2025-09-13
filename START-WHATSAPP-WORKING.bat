@echo off
echo ========================================
echo 📱 WHATSAPP QR CODE SERVICE - WORKING VERSION
echo ========================================
echo.
echo Starting WhatsApp service with QR code generation...
echo This version is CONFIRMED to generate QR codes properly!
echo.

cd /d C:\Users\LENOVO\Desktop\startup\aireplica

echo 🚀 Starting Working WhatsApp Service...
echo 📱 Watch for QR code to appear in the terminal window
echo ⏰ QR codes expire and renew automatically every minute
echo.

node whatsapp-web-service.js

pause
