import React from 'react';
import { CardStackLoader } from './CardStackLoader';

export const LoaderPreview: React.FC = () => {
  return (
    <div className="relative">
      <CardStackLoader />

      {/* Instructions overlay */}
      <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none">
        <div className="glass-card backdrop-blur-xl border border-crypto-lime/30 rounded-2xl p-4 max-w-md mx-auto pointer-events-auto">
          <h3 className="text-lg font-bold text-white mb-2">🎨 Loading Screen Preview</h3>
          <p className="text-sm text-slate-300 mb-3">
            This is how your loading screen will look when users first open the app or when data is loading.
          </p>
          <div className="text-xs text-slate-400 space-y-1">
            <div>✨ 3 cards with smooth switching animation</div>
            <div>💫 3D depth effect with perspective</div>
            <div>🌟 Shine animation across active card</div>
            <div>🔄 Auto-cycles every 1.5 seconds</div>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-3 w-full py-2 bg-crypto-lime text-black rounded-xl text-sm font-semibold hover:scale-105 transition-transform"
          >
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
};
