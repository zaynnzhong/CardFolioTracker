import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  signInWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, actionCodeSettings } from '../firebase';
import { Capacitor } from '@capacitor/core';

// Check if running in Capacitor native environment
const isCapacitorNative = Capacitor.isNativePlatform();

// Google OAuth configuration for iOS
const GOOGLE_CLIENT_ID = '398836187935-rbujq4f4v9ihmu28g87r0kgd38dlrg3d.apps.googleusercontent.com';
const GOOGLE_IOS_REDIRECT_URI = 'com.googleusercontent.apps.398836187935-rbujq4f4v9ihmu28g87r0kgd38dlrg3d:/oauth2callback';

// Generate a random nonce for OAuth security
const generateNonce = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Dynamic imports for Capacitor plugins (may not be available when loading from remote URL)
let BrowserPlugin: any = null;
let AppPlugin: any = null;

const loadCapacitorPlugins = async () => {
  if (isCapacitorNative && !BrowserPlugin) {
    try {
      const browserModule = await import('@capacitor/browser');
      BrowserPlugin = browserModule.Browser;
      console.log('[Auth] Browser plugin loaded successfully');
    } catch (e) {
      console.log('[Auth] Browser plugin not available:', e);
    }
  }
  if (isCapacitorNative && !AppPlugin) {
    try {
      const appModule = await import('@capacitor/app');
      AppPlugin = appModule.App;
      console.log('[Auth] App plugin loaded successfully');
    } catch (e) {
      console.log('[Auth] App plugin not available:', e);
    }
  }
};

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
  const pendingOAuthNonce = useRef<string | null>(null);

  useEffect(() => {
    console.log('[Auth] AuthProvider initializing...');
    console.log('[Auth] Current URL:', window.location.href);
    console.log('[Auth] User agent:', navigator.userAgent);
    console.log('[Auth] Is Capacitor Native:', isCapacitorNative);

    let unsubscribe: (() => void) | undefined;
    let urlOpenListener: any = null;

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

    // Set up URL listener for OAuth callback on native platforms
    const setupUrlListener = async () => {
      console.log('[Auth] Setting up URL listener for OAuth callback...');

      // Load plugins dynamically
      await loadCapacitorPlugins();

      if (!AppPlugin) {
        console.log('[Auth] App plugin not available, skipping URL listener setup');
        return;
      }

      urlOpenListener = await AppPlugin.addListener('appUrlOpen', async ({ url }: { url: string }) => {
        console.log('[Auth] 📱 App URL opened:', url);

        // Check if this is a Google OAuth callback
        if (url.includes('oauth2callback') || url.includes('id_token')) {
          console.log('[Auth] Google OAuth callback detected');

          try {
            // Close the browser if available
            if (BrowserPlugin) {
              await BrowserPlugin.close();
            }

            // Parse the URL - tokens are in the fragment (after #)
            const urlObj = new URL(url.replace('com.googleusercontent.apps.398836187935-rbujq4f4v9ihmu28g87r0kgd38dlrg3d:', 'https://localhost'));
            const fragment = urlObj.hash.substring(1); // Remove the #
            const params = new URLSearchParams(fragment);

            const idToken = params.get('id_token');
            const accessToken = params.get('access_token');
            const error = params.get('error');

            if (error) {
              console.error('[Auth] OAuth error:', error);
              throw new Error(`Google sign-in failed: ${error}`);
            }

            if (idToken) {
              console.log('[Auth] Got ID token from OAuth callback');

              // Create Google credential and sign in with Firebase
              const credential = GoogleAuthProvider.credential(idToken, accessToken);

              // Check if we need to link to anonymous account
              const currentUser = auth.currentUser;
              if (currentUser && currentUser.isAnonymous) {
                console.log('[Auth] Linking anonymous account to Google...');
                await linkWithCredential(currentUser, credential);
                console.log('[Auth] ✅ Account linked to Google successfully!');
              } else {
                console.log('[Auth] Signing in with Google credential...');
                await signInWithCredential(auth, credential);
                console.log('[Auth] ✅ Google sign-in successful!');
              }
            } else {
              console.error('[Auth] No ID token in callback');
              throw new Error('No ID token received from Google');
            }
          } catch (error: any) {
            console.error('[Auth] Error handling OAuth callback:', error);
            // If credential already in use, sign out anonymous and sign in
            if (error.code === 'auth/credential-already-in-use') {
              console.log('[Auth] Credential already in use, signing out and retrying...');
              await firebaseSignOut(auth);
              const urlObj = new URL(url.replace('com.googleusercontent.apps.398836187935-rbujq4f4v9ihmu28g87r0kgd38dlrg3d:', 'https://localhost'));
              const fragment = urlObj.hash.substring(1);
              const params = new URLSearchParams(fragment);
              const idToken = params.get('id_token');
              const accessToken = params.get('access_token');
              if (idToken) {
                const credential = GoogleAuthProvider.credential(idToken, accessToken);
                await signInWithCredential(auth, credential);
              }
            }
          }
        }
      });
    };

    // For native platforms, set up URL listener and auth listener
    if (isCapacitorNative) {
      console.log('[Auth] Native platform - setting up URL listener');
      setupUrlListener();
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
      if (urlOpenListener) {
        console.log('[Auth] Cleaning up URL listener');
        urlOpenListener.remove();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const currentUser = auth.currentUser;

      console.log('[Auth] signInWithGoogle called');
      console.log('[Auth] Is Capacitor Native:', isCapacitorNative);
      console.log('[Auth] Current user:', currentUser?.email || 'none');

      // For Capacitor native apps, use in-app browser OAuth flow
      if (isCapacitorNative) {
        console.log('[Auth] Capacitor native detected - using OAuth flow...');

        // Load plugins
        await loadCapacitorPlugins();

        // Generate nonce for security
        const nonce = generateNonce();
        pendingOAuthNonce.current = nonce;

        // Build Google OAuth URL for implicit flow (returns tokens directly)
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', GOOGLE_IOS_REDIRECT_URI);
        authUrl.searchParams.set('response_type', 'id_token token');
        authUrl.searchParams.set('scope', 'openid email profile');
        authUrl.searchParams.set('nonce', nonce);
        authUrl.searchParams.set('prompt', 'select_account');

        console.log('[Auth] Opening Google OAuth URL...');
        console.log('[Auth] Auth URL:', authUrl.toString());

        // Try Browser plugin first, fallback to window.location
        if (BrowserPlugin) {
          console.log('[Auth] Using Browser plugin...');
          await BrowserPlugin.open({
            url: authUrl.toString(),
            presentationStyle: 'popover'
          });
        } else {
          console.log('[Auth] Browser plugin not available, using window.location...');
          // Use window.location which will navigate in-place
          // The URL scheme redirect will bring the user back
          window.location.href = authUrl.toString();
        }

        // The URL listener set up in useEffect will handle the callback
        console.log('[Auth] OAuth started, waiting for callback...');
        return;
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
        // Retry with popup (works for web)
        if (!isCapacitorNative) {
          await signInWithPopup(auth, googleProvider);
        }
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
