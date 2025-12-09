import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, BarChart3, Shield, ArrowRight, LineChart, Loader2, Mail } from 'lucide-react';
import Spline from '@splinetool/react-spline';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, sendEmailLink } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setEmailLoading(true);
    setError(null);
    try {
      await sendEmailLink(email);
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send email link');
    } finally {
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <TrendingUp className="text-crypto-lime" size={24} />,
      title: 'Real-time Tracking',
      description: 'Monitor your card portfolio value with live market comparables',
    },
    {
      icon: <BarChart3 className="text-crypto-lime" size={24} />,
      title: 'Advanced Analytics',
      description: 'Deep insights into profit/loss, ROI, and portfolio performance',
    },
    {
      icon: <LineChart className="text-crypto-lime" size={24} />,
      title: 'Price History',
      description: 'Track market trends and comparable sales over time',
    },
    {
      icon: <Shield className="text-crypto-lime" size={24} />,
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored securely with Firebase',
    },
  ];

  return (
    <div className="min-h-screen bg-crypto-darker relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-crypto-lime/10 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x,
            y: mousePosition.y,
            scale: [1, 1.2, 1],
          }}
          transition={{ scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: -mousePosition.x,
            y: -mousePosition.y,
            scale: [1, 1.3, 1],
          }}
          transition={{ scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 lg:py-12">
        {/* Hero Section with 3D Card */}
        <div className="w-full max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.8, delay: 0.1 }}
                className="mb-6 lg:mb-8"
              >
                <img
                  src="/white-type.svg"
                  alt="Prism Portfolio"
                  className="mx-auto lg:mx-0 drop-shadow-2xl"
                  style={{ width: '180px', height: 'auto' }}
                />
              </motion.div>

              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card backdrop-blur-sm border border-crypto-lime/30 mb-6"
              >
                <Sparkles className="text-crypto-lime" size={18} />
                <span className="text-crypto-lime font-bold text-xs tracking-wide">PORTFOLIO TRACKER</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 lg:mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-white via-crypto-lime to-white bg-clip-text text-transparent">
                  Track Your Cards
                </span>
                <br />
                <span className="text-white">Like Crypto Assets</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-slate-400 text-base md:text-lg max-w-xl mx-auto lg:mx-0 mb-8"
              >
                The most advanced portfolio tracker for trading cards. Monitor values, analyze trends, and maximize your returns with institutional-grade analytics.
              </motion.p>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm max-w-md mx-auto lg:mx-0"
                >
                  {error}
                </motion.div>
              )}

              {/* Auth Section */}
              {emailSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-md mx-auto lg:mx-0 p-6 bg-crypto-lime/10 border border-crypto-lime/30 rounded-2xl backdrop-blur-xl"
                >
                  <Mail className="w-12 h-12 mb-3 text-crypto-lime" />
                  <h3 className="text-xl font-bold text-white mb-2">Check your email!</h3>
                  <p className="text-slate-300 text-sm mb-3">
                    We sent a sign-in link to <span className="font-semibold text-crypto-lime">{email}</span>
                  </p>
                  <p className="text-slate-400 text-xs mb-4">
                    Click the link in the email to complete your sign-in.
                  </p>
                  <button
                    onClick={() => { setEmailSent(false); setEmail(''); }}
                    className="text-crypto-lime text-sm hover:underline"
                  >
                    Use a different email
                  </button>
                </motion.div>
              ) : (
                <div className="max-w-md mx-auto lg:mx-0">
                  {/* Email Form */}
                  <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    onSubmit={handleEmailSignIn}
                    className="mb-4"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-5 py-4 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime transition-all mb-3 text-base"
                      disabled={emailLoading}
                    />
                    <button
                      type="submit"
                      disabled={emailLoading || !email}
                      className="w-full group relative px-8 py-4 crypto-gradient rounded-xl text-black font-bold text-base shadow-2xl glow-lime inline-flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                    >
                      {emailLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Sending link...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={20} />
                          <span>Send me a sign-in link</span>
                        </>
                      )}
                    </button>
                  </motion.form>

                  {/* Divider */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="relative my-5"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700/50"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-crypto-darker text-slate-400">Or continue with</span>
                    </div>
                  </motion.div>

                  {/* Google Button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    whileHover={{ scale: loading ? 1 : 1.05 }}
                    whileTap={{ scale: loading ? 1 : 0.95 }}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full group relative px-8 py-4 bg-white hover:bg-gray-50 rounded-xl text-gray-900 font-semibold text-base shadow-xl inline-flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>

            {/* Right: 3D Spline Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden order-1 lg:order-2"
            >
              <Spline scene="https://prod.spline.design/HU7M7NWkH1Zeh5CY/scene.splinecode" />
            </motion.div>
          </div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full mt-12 mb-8 lg:mt-16 lg:mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-card backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-crypto-lime/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-crypto-lime/10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="text-slate-500 text-sm text-center mt-8"
        >
          <p>© 2025 Built by Jacky Z with Claude Code and Gemini</p>
        </motion.div>
      </div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-crypto-lime rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            y: [null, -100, -200],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
};
