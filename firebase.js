import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBitJOjQdIrt3LJy4pRDMyIBfP0550SK4k",
  authDomain: "aireplica.firebaseapp.com",
  projectId: "aireplica",
  storageBucket: "aireplica.firebasestorage.app",
  messagingSenderId: "203561750738",
  appId: "1:203561750738:web:b8d752b0059afcf16d5d0b",
  measurementId: "G-M85QGLBJ0L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);