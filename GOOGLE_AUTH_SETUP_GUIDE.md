# 🔥 Firebase Google Authentication Setup

## Overview
This guide will help you set up Google Authentication for your AIReplica app.

## Step 1: Firebase Console Setup

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Select your AIReplica project

### 2. Enable Google Authentication
1. Click on **Authentication** in the left sidebar
2. Go to the **Sign-in method** tab
3. Click on **Google** provider
4. Toggle **Enable** switch
5. Add your **Project support email** (required)
6. Click **Save**

### 3. Get Configuration Keys
1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Copy the configuration values you already have in `firebase.js`

## Step 2: Google Cloud Console Setup

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select the same project as your Firebase project

### 2. Enable Google+ API
1. Go to **APIs & Services** > **Library**
2. Search for **Google+ API**
3. Click **Enable**

### 3. Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Select **Application type**: **Android** (for Expo)
4. **Name**: `AIReplica Android`
5. **Package name**: Get this from your `app.json` (usually `com.yourname.aireplica`)
6. **SHA-1 certificate fingerprint**: For development, use:
   - **Windows**: Open Command Prompt and run:
   ```
   keytool -exportcert -keystore %USERPROFILE%\.android\debug.keystore -list -v -alias androiddebugkey
   ```
   - **Mac/Linux**: Open Terminal and run:
   ```
   keytool -exportcert -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey
   ```
   - Default password is: `android`
   - Copy the SHA-1 fingerprint from the output (looks like: `AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12`)

**Note**: If you don't have the debug keystore yet, run your Expo app once with `expo run:android` to generate it.
   ```
   keytool -exportcert -keystore ~/.android/debug.keystore -list -v
   ```
   Default password is: `android`

### 4. For Web Support (Optional)
1. Create another OAuth client ID
2. Select **Application type**: **Web application**
3. **Name**: `AIReplica Web`
4. **Authorized redirect URIs**: Add your domain when you have one

## Step 3: Configure Your App

### 1. Create .env file
```bash
cp .env.example .env
```

### 2. Add your Google Client ID
Edit `.env` file and replace:
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=YOUR_ANDROID_CLIENT_ID_HERE
```

### 3. Update app.json (if needed)
Make sure your `expo.android.package` matches what you used in Google Cloud Console.

## Step 4: Test Authentication

### 1. Start your app
```bash
npm start
```

### 2. Test the flow
1. Open app on device/simulator
2. Go through onboarding steps
3. Try "Continue with Google" button
4. Should open Google sign-in flow
5. After signing in, should redirect back to app

## Troubleshooting

### Common Issues:

1. **"Error 10" or "Network Error"**
   - Check that SHA-1 fingerprint matches
   - Ensure package name is correct
   - Make sure Google+ API is enabled

2. **"Invalid client ID"**
   - Verify client ID is correct in .env file
   - Make sure you're using the Android client ID, not web

3. **"Redirect URI mismatch"**
   - For web testing, add localhost redirect URIs
   - Check that your app scheme matches

4. **"Google Services not available"**
   - Make sure you're testing on a device with Google Play Services
   - Try on a real device instead of emulator

### Debug Steps:
1. Check console logs for detailed error messages
2. Verify all credentials are correct
3. Test with a real device
4. Check Firebase Authentication users tab to see if accounts are created

## Security Notes
- Never commit your .env file with real credentials
- Add .env to your .gitignore
- Use different credentials for production
- Regularly rotate your API keys

## Next Steps
Once Google Auth is working:
1. Test email/password authentication
2. Test the full onboarding flow
3. Verify user data is stored correctly
4. Test dashboard access after authentication

---

Need help? Check the Firebase documentation or reach out for support!
