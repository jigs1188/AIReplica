@echo off
echo ===============================================
echo     WHATSAPP CONNECTION SETUP (FIXED VERSION)
echo ===============================================
echo.
echo ISSUE FIXED: Updated whatsapp-web.js to stable version
echo.
echo Choose your WhatsApp setup method:
echo.
echo 1. WhatsApp Web (QR Code) - Personal Account
echo 2. WhatsApp Business API - Business Account  
echo 3. Demo Mode - Testing Only
echo.
set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" goto whatsapp_web
if "%choice%"=="2" goto business_api
if "%choice%"=="3" goto demo_mode

:whatsapp_web
echo.
echo Starting WhatsApp Web service...
echo.
echo 1. QR Code will appear in terminal
echo 2. Open WhatsApp on your phone
echo 3. Go to Settings > Linked Devices
echo 4. Tap "Link a Device"
echo 5. Scan the QR code shown below
echo.
echo Starting service now...
echo.
node whatsapp-enhanced-service.js
goto end

:business_api
echo.
echo WhatsApp Business API Setup:
echo.
echo Required Environment Variables:
echo - WHATSAPP_ACCESS_TOKEN=your_token
echo - WHATSAPP_PHONE_NUMBER_ID=your_phone_id
echo - WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
echo.
echo Get these from: business.whatsapp.com
echo.
echo Starting business service...
node whatsapp-business-service.js
goto end

:demo_mode
echo.
echo Demo Mode - No real WhatsApp connection
echo This will start a simulation for testing the interface
echo.
echo Starting demo service...
node whatsapp-demo-service.js
goto end

:end
pause
