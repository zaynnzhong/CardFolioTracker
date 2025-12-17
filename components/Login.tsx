import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Mail, ArrowLeft, UserPlus, Shield, Phone } from 'lucide-react';
import type { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

interface LoginProps {
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBack }) => {
  console.log('Login component mounted, onBack:', !!onBack);
  const { signInWithGoogle, signInAsGuest, sendOTP, verifyOTP, setupRecaptcha, sendPhoneCode, verifyPhoneCode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  console.log('Login render - codeSent:', codeSent, 'email:', email);

  // Setup reCAPTCHA when component mounts
  useEffect(() => {
    if (loginMethod === 'phone') {
      const verifier = setupRecaptcha('recaptcha-container');
      setRecaptchaVerifier(verifier);

      return () => {
        if (verifier) {
          verifier.clear();
        }
      };
    }
  }, [loginMethod]);

  const loadingImages = [
    '/loading-1.webp',
    '/loading-2.webp',
    '/loading-3.webp'
  ];

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setEmailLoading(true);
    setError(null);
    try {
      await sendOTP(email);
      setCodeSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setEmailLoading(true);
    setError(null);
    try {
      await verifyOTP(email, otp);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setGuestLoading(true);
    setError(null);
    try {
      await signInAsGuest();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as guest');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    if (!recaptchaVerifier) {
      setError('reCAPTCHA not initialized. Please refresh the page.');
      return;
    }

    setPhoneLoading(true);
    setError(null);
    try {
      const result = await sendPhoneCode(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setPhoneCodeSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneCode || phoneCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    if (!confirmationResult) {
      setError('No verification in progress. Please request a new code.');
      return;
    }

    setPhoneLoading(true);
    setError(null);
    try {
      await verifyPhoneCode(confirmationResult, phoneCode);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crypto-darker text-slate-200 flex relative overflow-hidden">
      {/* Back Button - Fixed position */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-6 left-6 z-20 flex items-center gap-2 text-slate-400 hover:text-crypto-lime transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      )}

      {/* Left Side - Animated Content */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden items-center justify-center p-8">
        {/* Animated Background Gradients - Multiple layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
        <div className="absolute inset-0 bg-gradient-to-br from-crypto-lime/10 via-purple-500/10 to-blue-500/10" style={{ animation: 'gradient-shift 8s ease-in-out infinite' }} />
        <div className="absolute inset-0 bg-gradient-to-tl from-rose-500/5 via-transparent to-crypto-lime/5" style={{ animation: 'gradient-shift-reverse 10s ease-in-out infinite' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/10 to-crypto-lime/5" style={{ animation: 'gradient-pulse 12s ease-in-out infinite' }} />

        {/* Bento Grid Layout - 3 Cards Balanced */}
        <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
          <div className="flex gap-6 items-center justify-center">
            {/* Image 1 - Left Card */}
            <div
              className="rounded-lg overflow-hidden shadow-2xl transition-all duration-500 hover:scale-105"
              style={{
                animation: 'float-smooth 6s ease-in-out infinite, glow-subtle-lime 3s ease-in-out infinite',
                animationDelay: '0s',
                width: '200px',
                aspectRatio: '2.5 / 3.5',
              }}
            >
              <img
                src={loadingImages[0]}
                alt="Preview 1"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Image 2 - Center Card */}
            <div
              className="rounded-lg overflow-hidden shadow-2xl transition-all duration-500 hover:scale-105"
              style={{
                animation: 'float-smooth 7s ease-in-out infinite, glow-subtle-purple 3.5s ease-in-out infinite',
                animationDelay: '1s',
                width: '200px',
                aspectRatio: '2.5 / 3.5',
              }}
            >
              <img
                src={loadingImages[1]}
                alt="Preview 2"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Image 3 - Right Card */}
            <div
              className="rounded-lg overflow-hidden shadow-2xl transition-all duration-500 hover:scale-105"
              style={{
                animation: 'float-smooth 8s ease-in-out infinite, glow-subtle-blue 4s ease-in-out infinite',
                animationDelay: '2s',
                width: '200px',
                aspectRatio: '2.5 / 3.5',
              }}
            >
              <img
                src={loadingImages[2]}
                alt="Preview 3"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Floating Particles with enhanced animations */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `rgba(${Math.random() > 0.5 ? '163, 230, 53' : '139, 92, 246'}, ${Math.random() * 0.5 + 0.3})`,
              animation: `float-particle ${Math.random() * 6 + 5}s ease-in-out infinite, fade-in-out ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
              boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(${Math.random() > 0.5 ? '163, 230, 53' : '139, 92, 246'}, 0.5)`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float-smooth {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) translateX(10px) rotate(1deg);
          }
          50% {
            transform: translateY(-8px) translateX(-8px) rotate(-1deg);
          }
          75% {
            transform: translateY(12px) translateX(8px) rotate(0.5deg);
          }
        }

        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-30px) translateX(15px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-15px) translateX(-20px);
            opacity: 1;
          }
          75% {
            transform: translateY(20px) translateX(10px);
            opacity: 0.5;
          }
        }

        @keyframes fade-in-out {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1) rotate(5deg);
          }
        }

        @keyframes gradient-shift-reverse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.15) rotate(-5deg);
          }
        }

        @keyframes gradient-pulse {
          0%, 100% {
            opacity: 0.6;
            transform: translateX(0) scale(1);
          }
          33% {
            opacity: 0.9;
            transform: translateX(10%) scale(1.08);
          }
          66% {
            opacity: 0.7;
            transform: translateX(-10%) scale(1.05);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.2;
            filter: blur(40px);
          }
          50% {
            opacity: 0.4;
            filter: blur(60px);
          }
        }

        @keyframes glow-subtle-lime {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(163, 230, 53, 0.1);
          }
          50% {
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 60px rgba(163, 230, 53, 0.15);
          }
        }

        @keyframes glow-subtle-purple {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(139, 92, 246, 0.1);
          }
          50% {
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 60px rgba(139, 92, 246, 0.15);
          }
        }

        @keyframes glow-subtle-blue {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 60px rgba(59, 130, 246, 0.15);
          }
        }
      `}</style>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 bg-crypto-darker flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/white-type.svg"
              alt="Prism"
              className="mx-auto mb-4 drop-shadow-2xl"
              style={{ width: '160px', height: 'auto' }}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-slate-400 text-sm lg:text-base">Welcome back to Prism Portfolio</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email');
                setError(null);
                setCodeSent(false);
                setPhoneCodeSent(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-crypto-lime text-black'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Mail size={18} />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('phone');
                setError(null);
                setCodeSent(false);
                setPhoneCodeSent(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                loginMethod === 'phone'
                  ? 'bg-crypto-lime text-black'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Phone size={18} />
              <span>Phone</span>
            </button>
          </div>

          {/* Email OTP Flow */}
          {loginMethod === 'email' && codeSent ? (
            <div className="mb-6">
              <div className="mb-6 p-6 bg-crypto-lime/10 border border-crypto-lime/30 rounded-xl text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-crypto-lime" />
                <h3 className="text-xl font-semibold text-white mb-2">Check your email!</h3>
                <p className="text-slate-300 text-sm mb-2">
                  We sent a 6-digit code to <span className="font-semibold text-crypto-lime">{email}</span>
                </p>
                <p className="text-slate-400 text-xs">
                  Enter the code below to sign in. The code expires in 5 minutes.
                </p>
              </div>

              <form onSubmit={handleVerifyOTP}>
                <div className="mb-5">
                  <label htmlFor="otp" className="block text-sm font-medium text-slate-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime transition-all"
                    disabled={emailLoading}
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={emailLoading || otp.length !== 6}
                  className="w-full bg-crypto-lime hover:bg-crypto-lime/90 text-black font-bold py-3.5 px-6 text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Shield size={20} />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => { setCodeSent(false); setOtp(''); setError(null); }}
                    className="text-slate-400 text-xs hover:text-crypto-lime transition-colors"
                  >
                    Use a different email
                  </button>
                </div>
              </form>
            </div>
          ) : loginMethod === 'phone' && phoneCodeSent ? (
            <div className="mb-6">
              <div className="mb-6 p-6 bg-crypto-lime/10 border border-crypto-lime/30 rounded-xl text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-crypto-lime" />
                <h3 className="text-xl font-semibold text-white mb-2">Check your phone!</h3>
                <p className="text-slate-300 text-sm mb-2">
                  We sent a 6-digit code to <span className="font-semibold text-crypto-lime">{phoneNumber}</span>
                </p>
                <p className="text-slate-400 text-xs">
                  Enter the code below to sign in.
                </p>
              </div>

              <form onSubmit={handleVerifyPhoneCode}>
                <div className="mb-5">
                  <label htmlFor="phoneCode" className="block text-sm font-medium text-slate-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="phoneCode"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime transition-all"
                    disabled={phoneLoading}
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading || phoneCode.length !== 6}
                  className="w-full bg-crypto-lime hover:bg-crypto-lime/90 text-black font-bold py-3.5 px-6 text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {phoneLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Shield size={20} />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => { setPhoneCodeSent(false); setPhoneCode(''); setError(null); }}
                    className="text-slate-400 text-xs hover:text-crypto-lime transition-colors"
                  >
                    Use a different phone number
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Email Form */}
              {loginMethod === 'email' && (
                <form onSubmit={handleSendOTP} className="mb-6">
                  <div className="mb-5">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 text-base bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime transition-all"
                      disabled={emailLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={emailLoading || !email}
                    className="w-full bg-crypto-lime hover:bg-crypto-lime/90 text-black font-bold py-3.5 px-6 text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {emailLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Mail size={20} />
                        <span>Send verification code</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Phone Form */}
              {loginMethod === 'phone' && (
                <form onSubmit={handleSendPhoneCode} className="mb-6">
                  <div className="mb-5">
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-4 py-3 text-base bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime transition-all"
                      disabled={phoneLoading}
                    />
                    <p className="text-slate-500 text-xs mt-2">
                      Include country code (e.g., +1 for US, +86 for China)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={phoneLoading || !phoneNumber}
                    className="w-full bg-crypto-lime hover:bg-crypto-lime/90 text-black font-bold py-3.5 px-6 text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {phoneLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Phone size={20} />
                        <span>Send verification code</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-crypto-darker text-slate-500 uppercase tracking-wider">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-3.5 px-6 text-base rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
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
                  </>
                )}
              </button>

              {/* Guest Sign In */}
              <button
                onClick={handleGuestSignIn}
                disabled={guestLoading}
                className="w-full mt-3 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 text-slate-300 font-bold py-3.5 px-6 text-base rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guestLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>Continue as Guest</span>
                  </>
                )}
              </button>
              <p className="text-slate-500 text-xs text-center mt-3">
                Guest mode limited to 8 cards. Sign in to unlock unlimited cards.
              </p>
            </>
          )}

          <p className="text-slate-500 text-xs text-center mt-8">
            By signing in, you agree to our <span className="text-slate-400 hover:text-crypto-lime cursor-pointer">Terms</span> and <span className="text-slate-400 hover:text-crypto-lime cursor-pointer">Privacy Policy</span>
          </p>

          {/* reCAPTCHA Container (hidden) */}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    </div>
  );
};
