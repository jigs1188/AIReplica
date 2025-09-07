# 🤖 AIReplica - AI Personal Assistant

**Real WhatsApp Auto-Reply System. AI handles everything.**

## 🚀 Quick Start (3 Steps)

### 1. Start Backend Servers
```bash
# Terminal 1 - WhatsApp Service
node whatsapp-business-service.js

# Terminal 2 - Platform Service  
node real-platform-service.js
```

### 2. Start Mobile App
```bash
# Terminal 3 - Expo App
npx expo start
```

### 3. Setup WhatsApp Auto-Reply
- Open Expo Go app and scan QR code
- Go to Dashboard → "📱 Real WhatsApp Setup"
- Verify your phone number with OTP
- Configure auto-reply personality and rules

**Done!** Your WhatsApp will now auto-reply to friends and contacts.

## � Complete Setup Guide

**📱 [COMPLETE WHATSAPP GUIDE](COMPLETE_WHATSAPP_GUIDE.md)** - Follow this single guide for everything

## 📱 What You Can Do

- ✅ **Real WhatsApp Auto-Reply** (Your actual phone number)
- ✅ **Phone Number Verification** (Real OTP via WhatsApp)
- ✅ **AI-Powered Responses** (GPT-4 based on your personality)
- ✅ **Live Message Testing** (Test with real friends)
- ✅ **Customizable Personality** (Professional, Friendly, Casual, Helpful)
- ✅ **Real-Time Monitoring** (See all conversations and responses)

## 🧪 Run System Test

```bash
node test-system.js
```

## 🎯 What You Built

**Frontend**: React Native app with simplified OAuth
**Backend**: Node.js server with webhook processing  
**AI**: OpenAI GPT-4 for smart responses
**Auth**: Firebase user management
**Billing**: SaaS subscription system

## 🚀 Deploy to Production

```bash
# Deploy backend to Railway
npm install -g @railway/cli
railway login
railway init  
railway up

# Build mobile app
npx expo build
```

**Your AI assistant startup is ready!** 🎉

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Install Expo-specific dependencies:**
    ```bash
    npx expo install expo-linear-gradient react-native-safe-area-context @expo/vector-icons
    ```

4.  **Configure Firebase and OpenAI:**
    -   Create a Firebase project and update `firebase.js` with your `firebaseConfig`.
    -   Set up your OpenAI API key in `openai.js` (or via environment variables).

## How to Run the App

After installation and configuration, you can run the app using the following commands:

-   **Start the development server:**
    ```bash
    npm start
    ```

-   **Run on web:**
    ```bash
    npm run web
    ```

-   **Run on Android emulator/device:**
    ```bash
    npm run android
    ```

-   **Run on iOS simulator/device:**
    ```bash
    npm run ios
    ```

## Project Structure (Key Directories)

-   `app/`: Contains the main application screens and navigation.
-   `components/`: Reusable UI components.
-   `assets/`: Static assets like fonts and images.
-   `firebase.js`: Firebase configuration and initialization.
-   `openai.js`: OpenAI API client setup.