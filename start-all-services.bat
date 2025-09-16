@echo off
cls
echo ===================================================
echo 🚀 AIREPLICA - COMPLETE AUTO-REPLY PLATFORM
echo ===================================================
echo.
echo 🤖 Production-Ready AI Auto-Reply System
echo.
echo This will start ALL services for complete platform coverage:
echo ├── 🤖 Personalized AI Service (Port 3005) - Core AI Brain
echo ├── 📱 WhatsApp Web Service (Port 3004) - QR + Auto-Replies
echo ├── 📧 Gmail Service (Port 3003) - Email Auto-Responses
echo ├── 📸 Instagram Service (Port 3006) - DM + Story Auto-Replies  
echo └── 💼 LinkedIn Service (Port 3007) - Professional Auto-Networking
echo.
echo 🎯 After startup: Use mobile app for easy platform connection!
echo.

:: Check if running from correct directory
if not exist "package.json" (
    echo ❌ ERROR: Please run this from the aireplica project directory
    echo    Current directory: %CD%
    echo    Expected files: package.json, *-service.js files
    pause
    exit /b 1
)

echo 🔍 Checking system requirements...

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo    Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

:: Check if npm dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies for the first time...
    call npm install
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo ✅ Dependencies ready

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

echo.
echo 🚀 Starting Complete Auto-Reply Platform...
echo.
echo ⚠️  IMPORTANT: Each service opens in separate window
echo    Keep ALL windows open for auto-replies to work!
echo.

:: Start Personalized AI Service (Core AI Brain)
echo 🤖 Starting AI Brain (Personalized AI Service)...
start "🤖 AI Brain - Personalized AI" cmd /k "echo 🤖 PERSONALIZED AI SERVICE - CORE AI BRAIN & echo Port: 3005 & echo Status: Learning your communication style... & echo. & node personalized-ai-service.js"
timeout /t 3 /nobreak >nul

:: Start WhatsApp Web Service (Enhanced with persistence fixes)
echo 📱 Starting WhatsApp Auto-Reply Service...
start "📱 WhatsApp Auto-Replies" cmd /k "echo 📱 WHATSAPP AUTO-REPLY SERVICE & echo Port: 3004 & echo ⚠️  QR CODE will appear - scan with WhatsApp mobile app! & echo 🚀 Enhanced with persistence fixes for continuous auto-replies & echo. & node whatsapp-web-service.js"
timeout /t 3 /nobreak >nul

:: Start Gmail Service (Smart Email Auto-Responses)
echo 📧 Starting Gmail Auto-Response Service...
start "📧 Gmail Auto-Responses" cmd /k "echo 📧 GMAIL AUTO-RESPONSE SERVICE & echo Port: 3003 & echo 🧠 Smart email classification and auto-replies & echo. & node gmail-personalized-service.js"
timeout /t 2 /nobreak >nul

:: Start Instagram Service (DM + Engagement Auto-Replies)
echo 📸 Starting Instagram Auto-Engagement Service...
start "📸 Instagram Auto-Engagement" cmd /k "echo 📸 INSTAGRAM AUTO-ENGAGEMENT SERVICE & echo Port: 3006 & echo 🚀 DM auto-replies + Story mentions + Comment responses & echo. & node instagram-personalized-service.js"
timeout /t 2 /nobreak >nul

:: Start LinkedIn Service (Professional Networking Automation)
echo 💼 Starting LinkedIn Professional Auto-Networking...
start "💼 LinkedIn Auto-Networking" cmd /k "echo 💼 LINKEDIN PROFESSIONAL AUTO-NETWORKING & echo Port: 3007 & echo 🤝 Professional message automation + Connection management & echo. & node linkedin-personalized-service.js"
timeout /t 2 /nobreak >nul

echo.
echo ✅ ALL AUTO-REPLY SERVICES STARTED SUCCESSFULLY!
echo.
echo 📊 Auto-Reply Service Dashboard:
echo ╔════════════════════════════════════════════════════════╗
echo ║                AUTO-REPLY SERVICE STATUS              ║  
echo ╠════════════════════════════════════════════════════════╣
echo ║ 🤖 AI Brain (Personalized) │ http://localhost:3005    ║
echo ║ 📱 WhatsApp Auto-Replies   │ http://localhost:3004    ║
echo ║ 📧 Gmail Auto-Responses    │ http://localhost:3003    ║
echo ║ 📸 Instagram Auto-Engage   │ http://localhost:3006    ║
echo ║ 💼 LinkedIn Auto-Network   │ http://localhost:3007    ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 🎯 NEXT STEPS FOR COMPLETE AUTO-REPLY SETUP:
echo.
echo 1. 📱 START MOBILE APP (Easy Platform Connection):
echo    • Run: npx expo start
echo    • Scan QR with Expo Go app
echo    • Use "Quick Connect" to setup all platforms easily
echo.
echo 2. 📱 WHATSAPP SETUP (Most Important):
echo    • Look for QR code in WhatsApp terminal window
echo    • Open WhatsApp → Settings → Linked Devices → Link Device
echo    • Scan QR code (Enhanced with persistence for continuous auto-replies!)
echo.
echo 3. 🤖 OTHER PLATFORMS (Use Mobile App):
echo    • Instagram: Username/Password + SMS verification
echo    • Gmail: Email/App Password + 2FA verification  
echo    • LinkedIn: Professional login + Phone verification
echo    • All platforms include personalized AI auto-replies!
echo.
echo 4. 📊 MONITOR AUTO-REPLIES:
echo    • Use "Auto-Reply Dashboard" in mobile app
echo    • See real-time message processing and AI activity
echo    • Toggle auto-replies on/off per platform
echo.
echo 💡 STARTUP SUCCESS TIPS:
echo ├── Keep all terminal windows open for services to work
echo ├── WhatsApp auto-replies work immediately after QR scan
echo ├── Other platforms activate after mobile app setup
echo └── Check Auto-Reply Dashboard to see AI working for you!
echo.
echo 📝 Logs: Check 'logs' directory for detailed service logs
echo 🔄 Restart: Run this script again to restart all services  
echo ❌ Stop: Close all terminal windows to stop auto-reply services
echo.
echo ═══════════════════════════════════════════════════════════
echo 🎉 AIReplica Auto-Reply Platform is Ready!
echo    Connect platforms via mobile app and watch AI work! 🤖
echo ═══════════════════════════════════════════════════════════
echo.
pause