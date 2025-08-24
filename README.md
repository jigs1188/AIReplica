# AIReplica – Your Personal Digital Clone

## Concept
AIReplica is a mobile application designed to create your own AI-powered digital clone. This clone mimics your response style to messages, emails, meeting notes, and assists with small decisions, aiming to reduce repetitive tasks and communication overload.

## Who It's For
- Busy freelancers or startup founders
- Content creators
- Anyone overloaded with repetitive decisions or communications

## Key Features

### Auto-Reply to Texts, Emails, Comments
- Learns from your unique communication style (via uploaded samples or prompts).
- Allows for draft approval before sending.

### Decision Bot for Day-to-Day Tasks
- Provides AI-powered suggestions for common dilemmas (e.g., "Should I take this meeting?", "What caption should I write?").

### Meeting Memory + Note Generator
- Upload voice or text from calls to generate summaries, key decisions, and to-do lists, all in your personalized tone.

### Custom Prompt Templates
- Create and use personalized commands (e.g., "Write a YouTube reply to a rude comment in my style.").

## How It Works

**Onboarding:** Users train their clone by providing 5-10 sample replies, emails, and tone preferences.

**Technology:** Leverages GPT-4 (via OpenAI API) for personalization and Firebase for backend user data management. AsyncStorage is used for local session data caching, ensuring quick response times.

**User Interface:** Built with React Native, featuring a sleek, modern UI with auto-suggestions and history logs.

## Tech Stack

-   **Frontend:** React Native (with Expo) + Tailwind CSS
-   **Backend:** Firebase (for user data, authentication)
-   **AI/ML:** OpenAI GPT API (for text generation) and Whisper API (for audio transcription)
-   **Local Storage:** AsyncStorage (for quick response caching)

## Installation

To get started with the AIReplica project, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd aireplica
    ```

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