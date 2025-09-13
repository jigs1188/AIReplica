@echo off
echo ===============================================
echo     INSTAGRAM CONNECTION SETUP
echo ===============================================
echo.
echo Starting Instagram personalized service...
echo.
echo 1. Service will start on port 3002
echo 2. Browser will open for Instagram OAuth
echo 3. Login with your Instagram account
echo 4. Grant DM and profile permissions
echo 5. Return to app when complete
echo.
echo Note: Instagram Basic Display API required
echo Get it from: developers.facebook.com
echo.
echo Starting service now...
echo.

REM Start Instagram service
node instagram-personalized-service.js

pause
