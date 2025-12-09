import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export const ConfirmEmail: React.FC = () => {
  const { confirmEmailLink, isEmailLinkValid } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'email-input'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    const handleEmailLink = async () => {
      const url = window.location.href;

      // Check if this is a valid email link
      if (!isEmailLinkValid(url)) {
        setStatus('error');
        setError('Invalid sign-in link. The link may have expired or already been used.');
        return;
      }

      // Try to get email from localStorage
      const savedEmail = window.localStorage.getItem('emailForSignIn');

      if (savedEmail) {
        // We have the email, complete sign-in
        try {
          await confirmEmailLink(savedEmail, url);
          setStatus('success');
        } catch (err: any) {
          setStatus('error');
          setError(err.message || 'Failed to sign in. Please try again.');
        }
      } else {
        // Need to ask for email
        setStatus('email-input');
      }
    };

    handleEmailLink();
  }, [confirmEmailLink, isEmailLinkValid]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setEmailLoading(true);
    setError(null);

    try {
      const url = window.location.href;
      await confirmEmailLink(email, url);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Make sure you entered the correct email address.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto px-6">
        {/* Logo */}
        <div className="text-center mb-12">
          <img
            src="/white-type.svg"
            alt="Prism"
            className="mx-auto mb-8 drop-shadow-2xl"
            style={{ width: '180px', height: 'auto' }}
          />
        </div>

        {/* Status Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-crypto-lime animate-spin" />
              <h2 className="text-2xl font-bold text-white mb-2">Confirming your email...</h2>
              <p className="text-slate-400">Please wait while we sign you in.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-crypto-lime" />
              <h2 className="text-2xl font-bold text-white mb-2">Sign-in successful!</h2>
              <p className="text-slate-400 mb-6">Redirecting you to your portfolio...</p>
              <div className="w-12 h-1 bg-crypto-lime/30 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-crypto-lime rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-rose-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Sign-in failed</h2>
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm mb-6">
                {error || 'An error occurred during sign-in.'}
              </div>
              <a
                href="/"
                className="inline-block bg-crypto-lime hover:bg-crypto-lime/90 text-black font-semibold py-3 px-6 rounded-xl transition-all"
              >
                Back to sign in
              </a>
            </div>
          )}

          {status === 'email-input' && (
            <div className="py-4">
              <div className="text-center mb-6">
                <Mail className="w-12 h-12 mx-auto mb-3 text-crypto-lime" />
                <h2 className="text-2xl font-bold text-white mb-2">Confirm your email</h2>
                <p className="text-slate-400 text-sm">
                  Please enter the email address you used to request the sign-in link.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime transition-all"
                    disabled={emailLoading}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailLoading || !email}
                  className="w-full bg-crypto-lime hover:bg-crypto-lime/90 text-black font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailLoading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <span>Complete sign-in</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
