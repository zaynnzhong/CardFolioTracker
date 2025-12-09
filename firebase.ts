import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken
} from 'firebase/auth';

// Firebase configuration
// Replace these with your actual Firebase project config values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Email link auth configuration
// Use production URL if available, otherwise fall back to current origin
const getRedirectUrl = () => {
  // If VITE_APP_URL is explicitly set, use it
  const prodUrl = import.meta.env.VITE_APP_URL;
  if (prodUrl) {
    return prodUrl + '/confirm-email';
  }

  // Auto-detect production vs local
  // If we're on localhost or 127.0.0.1, use current origin
  // Otherwise, assume we're in production and use the current origin (which should be the deployed URL)
  return window.location.origin + '/confirm-email';
};

export const actionCodeSettings = {
  url: getRedirectUrl(),
  handleCodeInApp: true,
};
