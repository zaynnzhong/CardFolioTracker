import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInAnonymously,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken
} from 'firebase/auth';
import { auth, googleProvider, actionCodeSettings } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  sendEmailLink: (email: string) => Promise<void>;
  confirmEmailLink: (email: string, url: string) => Promise<void>;
  isEmailLinkValid: (url: string) => boolean;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const currentUser = auth.currentUser;

      // If user is anonymous, link their account to Google
      if (currentUser && currentUser.isAnonymous) {
        console.log('Linking anonymous account to Google...');
        await linkWithPopup(currentUser, googleProvider);
        console.log('Account successfully linked to Google!');
      } else {
        // Regular sign-in for non-anonymous users
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);

      // Handle account-exists-with-different-credential error
      if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
        // Sign out the anonymous account and sign in with the existing account
        await firebaseSignOut(auth);
        await signInWithPopup(auth, googleProvider);
      } else {
        throw error;
      }
    }
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const sendEmailLink = async (email: string) => {
    try {
      console.log('Attempting to send email link to:', email);
      console.log('Action code settings:', actionCodeSettings);
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      console.log('Email link sent successfully!');
      // Save email to localStorage for later verification
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error: any) {
      console.error('Error sending email link:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }
  };

  const confirmEmailLink = async (email: string, url: string) => {
    try {
      const currentUser = auth.currentUser;

      // If user is anonymous, link their account to email
      if (currentUser && currentUser.isAnonymous) {
        console.log('Linking anonymous account to email...');
        const credential = EmailAuthProvider.credentialWithLink(email, url);
        await linkWithCredential(currentUser, credential);
        console.log('Account successfully linked to email!');
      } else {
        // Regular sign-in for non-anonymous users
        await signInWithEmailLink(auth, email, url);
      }

      // Clear email from localStorage after successful sign-in
      window.localStorage.removeItem('emailForSignIn');
    } catch (error: any) {
      console.error('Error confirming email link:', error);

      // Handle account-exists-with-different-credential error
      if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
        // Sign out the anonymous account and sign in with the existing account
        await firebaseSignOut(auth);
        await signInWithEmailLink(auth, email, url);
        window.localStorage.removeItem('emailForSignIn');
      } else {
        throw error;
      }
    }
  };

  const isEmailLinkValid = (url: string): boolean => {
    return isSignInWithEmailLink(auth, url);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const currentUser = auth.currentUser;

      // If user is anonymous, link their account to email/password
      if (currentUser && currentUser.isAnonymous) {
        console.log('Linking anonymous account to email/password...');
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(currentUser, credential);
        console.log('Account successfully linked to email/password!');
      } else {
        // Regular sign-up for non-anonymous users
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Error signing up with email:', error);

      // Handle account-exists-with-different-credential error
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else {
        throw error;
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Error signing in with email:', error);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password.');
      } else {
        throw error;
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  const sendOTP = async (email: string) => {
    try {
      // Use same origin for production, localhost for dev
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
      const response = await fetch(`${apiUrl}/api/auth/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      console.log('OTP sent successfully');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      throw new Error(error.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (email: string, code: string) => {
    try {
      // Use same origin for production, localhost for dev
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
      const response = await fetch(`${apiUrl}/api/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      // Sign in with custom token from backend
      await signInWithCustomToken(auth, data.customToken);
      console.log('Signed in successfully with OTP');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      throw new Error(error.message || 'Failed to verify OTP');
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInAsGuest,
    sendEmailLink,
    confirmEmailLink,
    isEmailLinkValid,
    signUpWithEmail,
    signInWithEmail,
    sendOTP,
    verifyOTP,
    signOut,
    getIdToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
