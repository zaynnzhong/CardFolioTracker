import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInAnonymously,
  linkWithPopup,
  linkWithRedirect,
  linkWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, actionCodeSettings } from '../firebase';
import { Capacitor } from '@capacitor/core';

// Check if running in Capacitor native environment
const isCapacitorNative = Capacitor.isNativePlatform();

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
  setupRecaptcha: (containerId: string) => RecaptchaVerifier;
  sendPhoneCode: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] AuthProvider initializing...');
    console.log('[Auth] Current URL:', window.location.href);
    console.log('[Auth] User agent:', navigator.userAgent);
    console.log('[Auth] Is Capacitor Native:', isCapacitorNative);

    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = () => {
      console.log('[Auth] Setting up auth state listener...');
      unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('[Auth] 🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user');
        if (user) {
          console.log('[Auth] User details:', {
            email: user.email,
            uid: user.uid,
            isAnonymous: user.isAnonymous,
            emailVerified: user.emailVerified
          });
        }
        setUser(user);
        setLoading(false);
        console.log('[Auth] Loading set to false');
      });
    };

    // For native platforms, skip redirect handling - just set up auth listener
    if (isCapacitorNative) {
      console.log('[Auth] Native platform - skipping redirect check');
      setupAuthListener();
    } else {
      // Handle redirect result from Google Sign-In for web platforms
      console.log('[Auth] Checking for redirect result...');
      console.log('[Auth] Current localStorage pendingGoogleLink:', localStorage.getItem('pendingGoogleLink'));

      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('[Auth] ✅ Google Sign-In redirect successful!');
            console.log('[Auth] User email:', result.user.email);
            localStorage.removeItem('pendingGoogleLink');
          } else {
            console.log('[Auth] No redirect result');
          }
        })
        .catch((error) => {
          console.error('[Auth] ❌ Error handling redirect result:', error.code, error.message);
          if (error.code === 'auth/unauthorized-domain') {
            console.error('[Auth] UNAUTHORIZED DOMAIN! Add this domain to Firebase Console');
          }
          localStorage.removeItem('pendingGoogleLink');
        })
        .finally(() => {
          setupAuthListener();
        });
    }

    return () => {
      if (unsubscribe) {
        console.log('[Auth] Cleaning up auth listener');
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const currentUser = auth.currentUser;

      console.log('[Auth] signInWithGoogle called');
      console.log('[Auth] Is Capacitor Native:', isCapacitorNative);
      console.log('[Auth] Current user:', currentUser?.email || 'none');

      // For Capacitor native apps, try popup flow first (works better in WKWebView)
      // The redirect flow doesn't work because it leaves the app and can't return
      if (isCapacitorNative) {
        console.log('[Auth] Capacitor native detected - using popup flow for WKWebView...');

        try {
          if (currentUser && currentUser.isAnonymous) {
            console.log('[Auth] Linking anonymous account to Google (popup)...');
            await linkWithPopup(currentUser, googleProvider);
            console.log('[Auth] Account successfully linked to Google!');
          } else {
            console.log('[Auth] Signing in with Google (popup)...');
            await signInWithPopup(auth, googleProvider);
            console.log('[Auth] Google sign-in successful!');
          }
          return;
        } catch (popupError: any) {
          console.error('[Auth] Popup auth error:', popupError);

          // If popup was blocked or failed, the error will be caught here
          if (popupError.code === 'auth/popup-blocked' ||
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.code === 'auth/cancelled-popup-request') {
            console.log('[Auth] Popup was blocked or closed, user needs to try again');
            throw new Error('Sign-in popup was blocked. Please try again.');
          }

          throw popupError;
        }
      }

      // Web platform - use Firebase redirect/popup flow
      const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLocalhost = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.match(/^192\.168\.\d{1,3}\.\d{1,3}$/) ||
                         window.location.hostname.match(/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

      const usePopup = !isMobile || isLocalhost;

      console.log('[Auth] Web platform - isMobile:', isMobile, 'usePopup:', usePopup);

      if (currentUser && currentUser.isAnonymous) {
        console.log('[Auth] Linking anonymous account to Google...');
        if (usePopup) {
          await linkWithPopup(currentUser, googleProvider);
        } else {
          localStorage.setItem('pendingGoogleLink', 'true');
          await linkWithRedirect(currentUser, googleProvider);
        }
      } else {
        if (usePopup) {
          console.log('[Auth] Using popup flow for sign-in');
          await signInWithPopup(auth, googleProvider);
        } else {
          console.log('[Auth] Using redirect flow for mobile sign-in');
          await signInWithRedirect(auth, googleProvider);
        }
      }
    } catch (error: any) {
      console.error('[Auth] Error signing in with Google:', error);
      console.error('[Auth] Error code:', error.code);
      console.error('[Auth] Error message:', error.message);

      // Handle account-exists-with-different-credential error
      if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
        await firebaseSignOut(auth);
        // Retry with popup (works for both native and web)
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
      console.log('[Auth] Signed out from Firebase');
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
      console.log('[Auth] Sending OTP to:', email, 'API URL:', apiUrl);

      const response = await fetch(`${apiUrl}/api/auth/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Auth] OTP send failed:', data);
        throw new Error(data.error || 'Failed to send OTP');
      }

      console.log('[Auth] OTP sent successfully');
    } catch (error: any) {
      console.error('[Auth] Error sending OTP:', error);
      throw new Error(error.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (email: string, code: string) => {
    try {
      // Use same origin for production, localhost for dev
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
      console.log('[Auth] Verifying OTP for:', email, 'API URL:', apiUrl);

      const response = await fetch(`${apiUrl}/api/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Auth] OTP verification failed:', data);
        throw new Error(data.error || 'Failed to verify OTP');
      }

      console.log('[Auth] OTP verified, signing in with custom token');
      // Sign in with custom token from backend
      await signInWithCustomToken(auth, data.customToken);
      console.log('[Auth] Signed in successfully with OTP');
    } catch (error: any) {
      console.error('[Auth] Error verifying OTP:', error);
      throw new Error(error.message || 'Failed to verify OTP');
    }
  };

  // Phone Authentication Methods
  const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    try {
      // Clear any existing recaptcha
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }

      const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': () => {
          console.log('reCAPTCHA solved successfully');
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired, please try again');
        }
      });
      return recaptchaVerifier;
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      throw error;
    }
  };

  const sendPhoneCode = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    try {
      console.log('Sending SMS code to:', phoneNumber);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      console.log('SMS code sent successfully');
      return confirmationResult;
    } catch (error: any) {
      console.error('Error sending phone code:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Clear reCAPTCHA on error
      recaptchaVerifier.clear();

      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format. Please use international format (e.g., +1234567890)');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.code === 'auth/quota-exceeded') {
        throw new Error('SMS quota exceeded. Please upgrade your Firebase plan to Blaze (pay-as-you-go) to send SMS.');
      } else if (error.code === 'auth/project-not-authorized') {
        throw new Error('Phone authentication is not enabled. Please enable it in Firebase Console.');
      } else if (error.code === 'auth/app-not-authorized') {
        throw new Error('This app is not authorized for Firebase Phone Authentication. Please check Firebase Console settings.');
      } else {
        throw new Error(error.message || 'Failed to send verification code. Check console for details.');
      }
    }
  };

  const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string): Promise<void> => {
    try {
      console.log('Verifying phone code');
      await confirmationResult.confirm(code);
      console.log('Phone verification successful');
    } catch (error: any) {
      console.error('Error verifying phone code:', error);
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid verification code. Please try again.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('Verification code has expired. Please request a new one.');
      } else {
        throw new Error(error.message || 'Failed to verify code');
      }
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
    setupRecaptcha,
    sendPhoneCode,
    verifyPhoneCode,
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
