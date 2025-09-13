@echo off
echo ===============================================
echo     LINKEDIN CONNECTION SETUP
echo ===============================================
echo.
echo Starting LinkedIn personalized service...
echo.
echo 1. Service will start on port 3003
echo 2. Browser will open for LinkedIn OAuth
echo 3. Login with your LinkedIn account
echo 4. Grant professional messaging permissions
echo 5. Return to app when complete
echo.
echo Note: LinkedIn API access required
echo Get it from: developer.linkedin.com
echo.
echo Starting service now...
echo.

REM Start LinkedIn service
node linkedin-personalized-service.js

pause
