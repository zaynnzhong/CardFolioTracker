import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
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
  const prodUrl = import.meta.env.VITE_APP_URL;
  if (prodUrl) {
    return prodUrl + '/confirm-email';
  }
  // For local development
  return window.location.origin + '/confirm-email';
};

export const actionCodeSettings = {
  url: getRedirectUrl(),
  handleCodeInApp: true,
};
