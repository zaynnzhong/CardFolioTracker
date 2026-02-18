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
import { auth, googleProvider, appleProvider, actionCodeSettings } from '../firebase';
import { Capacitor } from '@capacitor/core';

// Check if running in Capacitor native environment
const isCapacitorNative = Capacitor.isNativePlatform();

// Google OAuth configuration
// Use Web client ID for browser-based OAuth (works on both web and iOS WKWebView)
const GOOGLE_WEB_CLIENT_ID = '286826518600-ht2pnomv9npsmua25vm2adkff9h962u0.apps.googleusercontent.com';
const GOOGLE_OAUTH_REDIRECT_URI = 'https://prism-cards.com/auth/google/callback';

// Generate a random nonce for OAuth security
const generateNonce = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Wait for native Google Sign-In bridge to be available (with retries and event listener)
const waitForNativeBridge = async (maxWaitMs: number = 3000): Promise<boolean> => {
  // Check if already available
  if (typeof (window as any).nativeGoogleSignIn === 'function') {
    console.log('[Auth] Native bridge already available');
    return true;
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms
    let resolved = false;

    // Listen for ready event from native side
    const handleReady = () => {
      if (!resolved) {
        resolved = true;
        console.log('[Auth] Native bridge ready (via event) after', Date.now() - startTime, 'ms');
        window.removeEventListener('nativeGoogleSignInReady', handleReady);
        resolve(true);
      }
    };
    window.addEventListener('nativeGoogleSignInReady', handleReady);

    // Also poll in case event was already fired
    const pollInterval = setInterval(() => {
      if (resolved) {
        clearInterval(pollInterval);
        return;
      }

      if (typeof (window as any).nativeGoogleSignIn === 'function') {
        resolved = true;
        clearInterval(pollInterval);
        window.removeEventListener('nativeGoogleSignInReady', handleReady);
        console.log('[Auth] Native bridge found (via polling) after', Date.now() - startTime, 'ms');
        resolve(true);
        return;
      }

      if (Date.now() - startTime >= maxWaitMs) {
        resolved = true;
        clearInterval(pollInterval);
        window.removeEventListener('nativeGoogleSignInReady', handleReady);
        console.log('[Auth] Native bridge not found after', maxWaitMs, 'ms');
        resolve(false);
      }
    }, checkInterval);
  });
};


// Wait for native Apple Sign-In bridge to be available
const waitForNativeAppleBridge = async (maxWaitMs: number = 3000): Promise<boolean> => {
  if (typeof (window as any).nativeAppleSignIn === 'function') {
    return true;
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = 100;
    let resolved = false;

    const handleReady = () => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('nativeAppleSignInReady', handleReady);
        resolve(true);
      }
    };
    window.addEventListener('nativeAppleSignInReady', handleReady);

    const pollInterval = setInterval(() => {
      if (resolved) {
        clearInterval(pollInterval);
        return;
      }

      if (typeof (window as any).nativeAppleSignIn === 'function') {
        resolved = true;
        clearInterval(pollInterval);
        window.removeEventListener('nativeAppleSignInReady', handleReady);
        resolve(true);
        return;
      }

      if (Date.now() - startTime >= maxWaitMs) {
        resolved = true;
        clearInterval(pollInterval);
        window.removeEventListener('nativeAppleSignInReady', handleReady);
        resolve(false);
      }
    }, checkInterval);
  });
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
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
  deleteAccount: () => Promise<void>;
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


    // For native platforms, just set up auth listener
    // OAuth callback is handled by GoogleAuthCallback component
    if (isCapacitorNative) {
      console.log('[Auth] Native platform - setting up auth listener');
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

      // For Capacitor native apps, use native Google Sign-In via ASWebAuthenticationSession
      if (isCapacitorNative) {
        console.log('[Auth] Capacitor native detected - waiting for native Google Sign-In bridge...');

        // Wait for native bridge to be available (may take a moment after page load)
        const bridgeAvailable = await waitForNativeBridge(3000);

        if (bridgeAvailable) {
          console.log('[Auth] Using native Google Sign-In bridge (ASWebAuthenticationSession)');

          try {
            const result = await (window as any).nativeGoogleSignIn();
            console.log('[Auth] Native sign-in returned tokens');

            const { idToken, accessToken } = result;

            if (!idToken) {
              throw new Error('No ID token received from native sign-in');
            }

            // Create Google credential and sign in with Firebase
            const credential = GoogleAuthProvider.credential(idToken, accessToken || null);

            // Check if we need to link to anonymous account
            if (currentUser && currentUser.isAnonymous) {
              console.log('[Auth] Linking anonymous account to Google...');
              try {
                await linkWithCredential(currentUser, credential);
                console.log('[Auth] ✅ Account linked successfully!');
              } catch (linkError: any) {
                if (linkError.code === 'auth/credential-already-in-use') {
                  console.log('[Auth] Credential in use, signing in directly...');
                  await firebaseSignOut(auth);
                  await signInWithCredential(auth, credential);
                } else {
                  throw linkError;
                }
              }
            } else {
              console.log('[Auth] Signing in with Google credential...');
              await signInWithCredential(auth, credential);
            }

            console.log('[Auth] ✅ Native Google Sign-In successful!');
            return;
          } catch (error: any) {
            // Check if user cancelled
            if (error.message === 'cancelled' || error.message?.includes('cancelled')) {
              console.log('[Auth] User cancelled Google Sign-In');
              return; // Don't throw, just return silently
            }
            console.error('[Auth] Native Google Sign-In failed:', error);
            throw error;
          }
        } else {
          // Bridge not available after waiting - this shouldn't happen in normal operation
          console.error('[Auth] Native bridge not available after waiting! This indicates a problem with iOS setup.');
          throw new Error('Google Sign-In is not available. Please restart the app and try again.');
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
        // Retry with popup (works for web)
        if (!isCapacitorNative) {
          await signInWithPopup(auth, googleProvider);
        }
      } else {
        throw error;
      }
    }
  };

  const signInWithApple = async () => {
    try {
      const currentUser = auth.currentUser;

      console.log('[Auth] signInWithApple called');
      console.log('[Auth] Is Capacitor Native:', isCapacitorNative);

      // For Capacitor native apps, use native Apple Sign-In via ASAuthorizationAppleIDProvider
      if (isCapacitorNative) {
        console.log('[Auth] Capacitor native detected - waiting for native Apple Sign-In bridge...');

        const bridgeAvailable = await waitForNativeAppleBridge(3000);

        if (bridgeAvailable) {
          console.log('[Auth] Using native Apple Sign-In bridge');

          try {
            const result = await (window as any).nativeAppleSignIn();
            console.log('[Auth] Native Apple sign-in returned tokens');

            const { idToken, rawNonce } = result;

            if (!idToken) {
              throw new Error('No ID token received from native Apple sign-in');
            }

            // Create Apple credential with nonce
            const credential = OAuthProvider.credentialFromJSON({
              providerId: 'apple.com',
              signInMethod: 'oauth',
              idToken: idToken,
              rawNonce: rawNonce
            }) as any;

            // Use OAuthProvider.credential instead for proper nonce handling
            const oauthCredential = new OAuthProvider('apple.com').credential({
              idToken: idToken,
              rawNonce: rawNonce
            });

            if (currentUser && currentUser.isAnonymous) {
              console.log('[Auth] Linking anonymous account to Apple...');
              try {
                await linkWithCredential(currentUser, oauthCredential);
                console.log('[Auth] Account linked successfully!');
              } catch (linkError: any) {
                if (linkError.code === 'auth/credential-already-in-use') {
                  console.log('[Auth] Credential in use, signing in directly...');
                  await firebaseSignOut(auth);
                  await signInWithCredential(auth, oauthCredential);
                } else {
                  throw linkError;
                }
              }
            } else {
              console.log('[Auth] Signing in with Apple credential...');
              await signInWithCredential(auth, oauthCredential);
            }

            console.log('[Auth] Native Apple Sign-In successful!');
            return;
          } catch (error: any) {
            if (error.message === 'cancelled' || error.message?.includes('cancelled')) {
              console.log('[Auth] User cancelled Apple Sign-In');
              return;
            }
            console.error('[Auth] Native Apple Sign-In failed:', error);
            throw error;
          }
        } else {
          console.error('[Auth] Native Apple bridge not available after waiting!');
          throw new Error('Apple Sign-In is not available. Please restart the app and try again.');
        }
      }

      // Web platform - use Firebase popup/redirect flow with Apple provider
      const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLocalhost = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.match(/^192\.168\.\d{1,3}\.\d{1,3}$/) ||
                         window.location.hostname.match(/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

      const usePopup = !isMobile || isLocalhost;

      console.log('[Auth] Web platform Apple Sign-In - isMobile:', isMobile, 'usePopup:', usePopup);

      if (currentUser && currentUser.isAnonymous) {
        console.log('[Auth] Linking anonymous account to Apple...');
        if (usePopup) {
          await linkWithPopup(currentUser, appleProvider);
        } else {
          await linkWithRedirect(currentUser, appleProvider);
        }
      } else {
        if (usePopup) {
          await signInWithPopup(auth, appleProvider);
        } else {
          await signInWithRedirect(auth, appleProvider);
        }
      }
    } catch (error: any) {
      console.error('[Auth] Error signing in with Apple:', error);

      if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
        await firebaseSignOut(auth);
        if (!isCapacitorNative) {
          await signInWithPopup(auth, appleProvider);
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

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');

      const token = await user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

      console.log('[Auth] Deleting account...');
      const response = await fetch(`${apiUrl}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      console.log('[Auth] Account deleted successfully, signing out...');
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('[Auth] Error deleting account:', error);
      throw new Error(error.message || 'Failed to delete account');
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
    signInWithApple,
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
    deleteAccount,
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
