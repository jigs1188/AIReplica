@echo off
echo ===============================================
echo     GMAIL CONNECTION SETUP
echo ===============================================
echo.
echo Starting Gmail personalized service...
echo.
echo 1. Service will start on port 3001
echo 2. Browser will open for Google OAuth
echo 3. Login with your Gmail account
echo 4. Grant necessary permissions
echo 5. Return to app when complete
echo.
echo Starting service now...
echo.

REM Start Gmail service
node gmail-personalized-service.js

pause
