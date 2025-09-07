# 🔧 Google Authentication Fix Guide

## Current Issue
Your Google authentication is returning "access is blocked" error. This typically happens due to OAuth configuration issues.

## Quick Solutions

### Solution 1: Use Email Authentication (Recommended for now)
The email authentication is working perfectly. Use email sign-in as your primary method while fixing Google auth.

### Solution 2: Fix Google OAuth Configuration

#### Step 1: Verify Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **airaplica**
3. Navigate to **APIs & Services** > **Credentials**

#### Step 2: Check OAuth 2.0 Client ID
1. Find your OAuth 2.0 client ID: `32547708972-s6ac0qt3oebeg95tnjetintbkmcrp767.apps.googleusercontent.com`
2. Click **Edit** on this client ID

#### Step 3: Add Correct Package Name and SHA-1
Your current package name in app.json is: `com.aireplica.app`

**For Expo Development:**
1. **Package name**: `com.aireplica.app`
2. **SHA-1 certificate fingerprint** (for development):
   ```
   keytool -exportcert -keystore %USERPROFILE%\.android\debug.keystore -list -v -alias androiddebugkey
   ```
   Password: `android`

#### Step 4: Add Authorized Redirect URIs
Add these redirect URIs in your OAuth client:
- `https://auth.expo.io/@jigs1188/aireplica`
- `aireplica://`

#### Step 5: Enable Required APIs
In Google Cloud Console:
1. **APIs & Services** > **Library**
2. Enable these APIs:
   - Google+ API
   - Google Identity and Access Management (IAM) API
   - Gmail API (if using email features)

### Solution 3: Update app.json (if needed)
Add Google auth scheme to your app.json:

```json
{
  "expo": {
    "scheme": "aireplica",
    "android": {
      "package": "com.aireplica.app",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### Solution 4: Verify Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **airaplica** project
3. **Authentication** > **Sign-in method**
4. Ensure **Google** is enabled
5. Add `jigs1188@gmail.com` as authorized domain if needed

## Testing Steps
1. Clear Expo cache: `npx expo start --clear`
2. Test on real Android device (not emulator)
3. Try Google sign-in
4. If still blocked, use email authentication

## Current Status
✅ **Fixed**: Asset resolution errors (icon.png → icon.jpg)
✅ **Fixed**: Country code picker - now scrollable with proper modal
⚠️ **Needs Attention**: Google authentication - enhanced error handling added

## Temporary Workaround
The app now shows better error messages for Google auth issues and provides options to:
- Use email authentication instead
- Try Google auth again
- Get specific error details

## Next Steps
1. Use email authentication for immediate access
2. Fix Google OAuth configuration following steps above
3. Test WhatsApp setup with the new scrollable country picker
4. Verify all fixed issues work properly

Your app is fully functional with email authentication while you resolve the Google OAuth configuration.
