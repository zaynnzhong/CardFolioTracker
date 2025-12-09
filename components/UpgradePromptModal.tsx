import React, { useState } from 'react';
import { X, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UpgradePromptModalProps {
  onClose: () => void;
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({ onClose }) => {
  const { signInWithGoogle, sendEmailLink } = useAuth();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendEmailLink(email);
      setEmailSent(true);
    } catch (error) {
      console.error('Error sending email link:', error);
      alert('Failed to send email link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900/95 border border-slate-800/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="text-crypto-lime" size={24} />
            Upgrade to Continue
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {emailSent ? (
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-crypto-lime" />
              <h3 className="text-xl font-semibold text-white mb-2">Check your email!</h3>
              <p className="text-slate-300 text-sm mb-4">
                We sent a sign-in link to <span className="font-semibold text-crypto-lime">{email}</span>
              </p>
              <p className="text-slate-400 text-xs">
                Your guest cards will be automatically linked to your new account.
              </p>
              <button
                onClick={() => { setEmailSent(false); setEmail(''); }}
                className="mt-4 text-crypto-lime text-sm hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-crypto-lime/10 border border-crypto-lime/30 rounded-xl p-4 mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">Guest Limit Reached</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    You've reached the maximum of <span className="font-bold text-crypto-lime">8 cards</span> for guest accounts.
                  </p>
                  <p className="text-slate-400 text-sm">
                    Create an account to unlock unlimited cards and keep your collection safe!
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">What you'll get:</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-crypto-lime">✓</span>
                      <span>Unlimited cards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-crypto-lime">✓</span>
                      <span>Your guest cards will be automatically saved</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-crypto-lime">✓</span>
                      <span>Access from any device</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-crypto-lime">✓</span>
                      <span>Price tracking & analytics</span>
                    </li>
                  </ul>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime transition-all mb-3"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-crypto-lime hover:bg-crypto-lime/90 text-black font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send sign-in link'}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-900 text-slate-500 uppercase tracking-wider">Or</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
