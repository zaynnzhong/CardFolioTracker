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
  EmailAuthProvider
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

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInAsGuest,
    sendEmailLink,
    confirmEmailLink,
    isEmailLinkValid,
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
