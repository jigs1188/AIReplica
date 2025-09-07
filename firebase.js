import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, enableNetwork, disableNetwork } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with offline persistence and better error handling
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cache: persistentLocalCache({
    cacheSizeBytes: 100 * 1024 * 1024, // 100MB cache
  })
});

// Handle network state changes
const handleNetworkChange = async () => {
  try {
    if (navigator.onLine) {
      await enableNetwork(db);
    } else {
      await disableNetwork(db);
    }
  } catch (error) {
    console.warn('Network state change error:', error);
  }
};

// Listen for network changes (if available)
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);
}

export { db };