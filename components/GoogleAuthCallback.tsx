import React, { useEffect, useState } from 'react';
import { signInWithCredential, GoogleAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';

export const GoogleAuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[GoogleAuthCallback] Processing OAuth callback...');
        console.log('[GoogleAuthCallback] URL:', window.location.href);

        // Get tokens from URL fragment (after #)
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);

        const idToken = params.get('id_token');
        const accessToken = params.get('access_token');
        const error = params.get('error');

        if (error) {
          console.error('[GoogleAuthCallback] OAuth error:', error);
          setError(`Authentication failed: ${error}`);
          setStatus('error');
          return;
        }

        if (!idToken) {
          console.error('[GoogleAuthCallback] No ID token in callback');
          setError('No authentication token received');
          setStatus('error');
          return;
        }

        console.log('[GoogleAuthCallback] Got ID token, signing in with Firebase...');

        // Create Google credential
        const credential = GoogleAuthProvider.credential(idToken, accessToken);

        // Check if we need to link to anonymous account
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
          console.log('[GoogleAuthCallback] Linking anonymous account to Google...');
          try {
            await linkWithCredential(currentUser, credential);
            console.log('[GoogleAuthCallback] ✅ Account linked successfully!');
          } catch (linkError: any) {
            if (linkError.code === 'auth/credential-already-in-use') {
              console.log('[GoogleAuthCallback] Credential in use, signing in directly...');
              await auth.signOut();
              await signInWithCredential(auth, credential);
            } else {
              throw linkError;
            }
          }
        } else {
          console.log('[GoogleAuthCallback] Signing in with Google credential...');
          await signInWithCredential(auth, credential);
        }

        console.log('[GoogleAuthCallback] ✅ Sign-in successful!');
        setStatus('success');

        // Redirect back to app or home page
        setTimeout(() => {
          // Check if we came from the iOS app by checking for the app URL scheme
          // The app's URL scheme is 'prismportfolio'
          const isFromApp = localStorage.getItem('oauth_nonce') !== null;

          if (isFromApp) {
            // Clear the nonce
            localStorage.removeItem('oauth_nonce');
            // Redirect to app using URL scheme - this will open the app
            console.log('[GoogleAuthCallback] Redirecting to app via URL scheme...');
            window.location.href = 'prismportfolio://auth/success';
          } else {
            // Regular web - just go home
            window.location.href = '/';
          }
        }, 1000);

      } catch (err: any) {
        console.error('[GoogleAuthCallback] Error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-crypto-darker flex items-center justify-center">
      <div className="text-center p-8">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-crypto-lime animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Signing in...</h2>
            <p className="text-slate-400">Please wait while we complete your sign-in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Sign-in successful!</h2>
            <p className="text-slate-400">Redirecting you now...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Sign-in failed</h2>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Return to app
            </button>
          </>
        )}
      </div>
    </div>
  );
};
