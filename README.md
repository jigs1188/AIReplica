# 🤖 AIReplica - AI Personal Assistant

**One-tap platform connections. AI handles everything.**

## 🚀 Quick Test (2 Steps)

### 1. Start the App
```bash
npm install
npm run dev
```

### 2. Start Backend (New Terminal)  
```bash
npm run webhook
```

**Done!** Scan QR code with Expo Go to test.

## 📱 Test Features

- ✅ **Connect platforms** (WhatsApp, Instagram, LinkedIn, etc.)
- ✅ **AI auto-replies** (Powered by GPT-4)
- ✅ **Simple dashboard** (One-tap controls)
- ✅ **Subscription plans** (Free → Pro → Business)

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