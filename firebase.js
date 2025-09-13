import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { initializeFirestore, getFirestore, persistentLocalCache, enableNetwork, disableNetwork } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = Platform.OS === 'web' 
  ? initializeAuth(app) 
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// Initialize Firestore with offline persistence and better error handling
// Check if Firestore is already initialized to prevent re-initialization errors
let db;
try {
  db = getFirestore(app);
} catch (_error) {
  // If getFirestore fails, initialize Firestore
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    cache: persistentLocalCache({
      cacheSizeBytes: 100 * 1024 * 1024, // 100MB cache
    })
  });
}

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

// Listen for network changes (React Native safe)
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);
} else {
  // React Native environment - network monitoring handled elsewhere
  console.log('📡 Firebase: React Native environment detected');
}

export { db };