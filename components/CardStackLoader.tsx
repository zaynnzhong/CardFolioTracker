import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const CardStackLoader: React.FC = () => {
  const [activeCard, setActiveCard] = useState(0);

  // Card data with different colors and content
  const cards = [
    {
      id: 1,
      color: 'from-crypto-lime/20 to-emerald-500/20',
      borderColor: 'border-crypto-lime/30',
      player: 'Loading',
      year: '2024'
    },
    {
      id: 2,
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-400/30',
      player: 'Your',
      year: '2024'
    },
    {
      id: 3,
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-400/30',
      player: 'Portfolio',
      year: '2024'
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [cards.length]);

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <img
          src="/white-type.svg"
          alt="Prism"
          className="drop-shadow-2xl"
          style={{ width: '180px', height: 'auto' }}
        />
      </motion.div>

      {/* Card Stack */}
      <div className="relative w-64 h-80 mb-8">
        {cards.map((card, index) => {
          const isActive = index === activeCard;
          const offset = (index - activeCard + cards.length) % cards.length;

          return (
            <motion.div
              key={card.id}
              className={`absolute inset-0 glass-card backdrop-blur-xl rounded-3xl border ${card.borderColor} overflow-hidden`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: isActive ? 1 : 0.95 - (offset * 0.05),
                y: offset * 12,
                z: -offset * 50,
                opacity: isActive ? 1 : 0.4 - (offset * 0.15),
                rotateY: isActive ? 0 : offset * 5,
              }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                transformStyle: 'preserve-3d',
                zIndex: cards.length - offset,
              }}
            >
              {/* Card Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color}`} />

              {/* Card Content */}
              <div className="relative h-full p-6 flex flex-col justify-between">
                {/* Top Section */}
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                    Sports Card
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {card.player}
                  </div>
                  <div className="text-sm text-slate-300">
                    {card.year} Collection
                  </div>
                </div>

                {/* Card Image Placeholder */}
                <div className="flex-1 flex items-center justify-center my-4">
                  <motion.div
                    animate={{
                      scale: isActive ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-32 h-32 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                  >
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-crypto-lime/30 to-emerald-500/30" />
                  </motion.div>
                </div>

                {/* Bottom Section */}
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs text-slate-400">Value</div>
                    <div className="text-lg font-bold text-crypto-lime">
                      $---.--
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    #{card.id}/3
                  </div>
                </div>
              </div>

              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: isActive ? ['-100%', '200%'] : '-100%',
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-crypto-lime border-t-transparent rounded-full"
          />
          <span className="text-slate-300 text-sm">Loading your collection...</span>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2">
          {cards.map((_, index) => (
            <motion.div
              key={index}
              className="w-2 h-2 rounded-full"
              animate={{
                backgroundColor: index === activeCard ? '#9aea62' : '#334155',
                scale: index === activeCard ? 1.2 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-crypto-lime/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
};
