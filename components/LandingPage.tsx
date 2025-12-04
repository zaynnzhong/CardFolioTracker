import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, BarChart3, Shield, ArrowRight, LineChart, Loader2 } from 'lucide-react';
import Spline from '@splinetool/react-spline';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
                  src="/logo.png"
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

              {/* CTA Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group relative px-8 py-4 crypto-gradient rounded-2xl text-black font-bold text-lg shadow-2xl glow-lime inline-flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in with Google</span>
                    <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                  </>
                )}
              </motion.button>
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
