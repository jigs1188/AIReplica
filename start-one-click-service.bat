@echo off
echo 🚀 Starting AIReplica One-Click Platform Service...

REM Start the one-click platform service
start "One-Click Platform Service" cmd /k "cd /d %~dp0 && node one-click-platform-service.js"

REM Wait a moment for the service to start
timeout /t 3

echo ✅ One-Click Platform Service started on port 3001
echo 📱 You can now use the one-click setup in the AIReplica app!

REM Optional: Start the main webhook server too
echo.
echo Starting main webhook server...
start "Main Webhook Server" cmd /k "cd /d %~dp0 && node working-webhook-server.js"

echo.
echo 🎉 All services are running!
echo 🔗 One-Click Platform Service: http://localhost:3001
echo 🔗 Main Webhook Server: http://localhost:3000
echo 🔗 Health Check: http://localhost:3001/health
echo.
echo Press any key to continue...
pause > nul
