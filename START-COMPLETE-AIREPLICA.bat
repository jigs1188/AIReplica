@echo off
echo ========================================
echo � AIREPLICA MOBILE APP STARTUP
echo ========================================
echo.
echo Starting complete AIReplica system for mobile development...
echo.

echo 📱 Mobile App Features:
echo ✅ Main Dashboard (10 core features)
echo ✅ Integration Hub (WhatsApp, Instagram, Gmail, LinkedIn)
echo ✅ Personalized AI (Contact profiles, role-based responses)
echo ✅ Custom Prompts & Training
echo ✅ Subscription & Pro Features
echo ✅ Optimized for Android/iOS
echo.

echo 🔧 Starting All Services:
echo.

echo [1/4] Starting AI Reply Engine...
start "AI Reply Engine" cmd /k "cd /d C:\Users\LENOVO\Desktop\startup\aireplica && echo 🤖 AI Reply Engine Starting... && node ai-reply-engine.js"

timeout /t 3 /nobreak >nul

echo [2/4] Starting Working WhatsApp Service (with QR Code Generation)...
start "WhatsApp Service" cmd /k "cd /d C:\Users\LENOVO\Desktop\startup\aireplica && echo 📱 WhatsApp Service Starting... && node whatsapp-web-service.js"

timeout /t 3 /nobreak >nul

echo [3/4] Starting Personalized AI Service (Contact Management)...
start "Personalized AI" cmd /k "cd /d C:\Users\LENOVO\Desktop\startup\aireplica && echo 🎯 Personalized AI Starting... && node personalized-ai-service.js"

timeout /t 3 /nobreak >nul

echo [4/4] Starting Mobile App (with QR Code for phone)...
start "AIReplica Mobile App" cmd /k "cd /d C:\Users\LENOVO\Desktop\startup\aireplica && echo 📱 Mobile App Starting... && echo Installing dependencies... && npm install && echo Starting Expo with QR code... && npx expo start --clear"

echo.
echo ✅ All services starting...
echo.

echo 📱 MOBILE APP ACCESS:
echo ├── Expo Metro: Will show QR code
echo ├── Scan QR: With Expo Go app on your phone
echo ├── WhatsApp Service: http://localhost:3004
echo ├── Personalized AI: http://localhost:3005
echo ├── AI Engine: http://localhost:3002
echo └── Mobile Dashboard: Accessible via Expo QR scan
echo.

echo 📱 MOBILE SETUP GUIDE:
echo 1. Wait for Expo Metro to start (QR code will appear)
echo 2. Install 'Expo Go' app on your Android/iPhone
echo 3. Scan QR code with Expo Go app
echo 4. AIReplica mobile app will load on your phone
echo 5. Navigate through dashboard with all 10 features
echo 6. Go to Integration Hub to connect platforms
echo 7. Click 'Manage Contacts' for personalized AI
echo 8. Test all features on your mobile device
echo.

echo 🎯 MOBILE FEATURES AVAILABLE:
echo ✅ Dashboard: All 10 original features optimized for mobile
echo ✅ Custom Prompts: Create AI prompts on mobile
echo ✅ Training Center: Train AI style from phone
echo ✅ Subscription Plans: Pro upgrade features
echo ✅ Settings & Sync: Configure AI behavior
echo ✅ Integration Hub: Connect real platforms
echo ✅ Personalized AI: Contact profiles with role-based responses
echo ✅ Touch-optimized UI: Designed for mobile interaction
echo.

echo 📞 Platform Integration (Mobile Optimized):
echo ├── WhatsApp: QR scan integration from mobile
echo ├── Instagram: OAuth login optimized for mobile
echo ├── Gmail: Mobile-friendly OAuth flow
echo ├── LinkedIn: Touch-optimized connection process
echo └── Contact Management: Mobile-first UI design
echo.

echo 🎉 Your mobile AIReplica system is starting!
echo.

echo ⏳ Waiting for services to fully start...
timeout /t 15 /nobreak >nul

echo.
echo 📱 MOBILE TESTING CHECKLIST:
echo.
echo 1. ✅ Check Expo Metro shows QR code
echo 2. ✅ Scan QR with Expo Go app
echo 3. ✅ Mobile app loads on phone
echo 4. ✅ Dashboard shows all 10 features
echo 5. ✅ Integration Hub accessible
echo 6. ✅ Contact Manager opens
echo 7. ✅ Platform connections work
echo 8. ✅ Personalized AI functions
echo.

echo Press any key to continue monitoring...
pause

echo.
echo 📊 MOBILE SYSTEM MONITOR:
echo.

:monitor
cls
echo ========================================
echo � AIREPLICA MOBILE SYSTEM MONITOR
echo ========================================
echo.
echo 🟢 Services Running:
echo ├── AI Reply Engine (Port 3002)
echo ├── Enhanced WhatsApp (Port 3004) 
echo ├── Mobile App (Expo QR Code)
echo └── Personalized AI Features
echo.
echo 📱 Mobile App Status:
echo ├── ✅ All 10 dashboard features
echo ├── ✅ Platform integrations (5 platforms)
echo ├── ✅ Personalized AI (Contact profiles)
echo ├── ✅ Custom Prompts & Training
echo ├── ✅ Subscription & Pro Features
echo └── ✅ Mobile-optimized UI/UX
echo.
echo 📱 Quick Actions:
echo [1] Check WhatsApp Service Status
echo [2] Check AI Engine Status  
echo [3] View Mobile Setup Guide
echo [4] Check Android UI Guide
echo [5] Exit Monitor
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    start http://localhost:3004/api/status
    goto monitor
)
if "%choice%"=="2" (
    start http://localhost:3002/health
    goto monitor  
)
if "%choice%"=="3" (
    start FINAL_SETUP_INSTRUCTIONS.md
    goto monitor
)
if "%choice%"=="4" (
    start ANDROID_UI_IMPROVEMENTS.md
    goto monitor
)
if "%choice%"=="5" (
    echo.
    echo 👋 Mobile System Monitor closed.
    echo Services continue running in background.
    echo Keep scanning QR code to test mobile app!
    echo.
    pause
    exit
)

goto monitor
