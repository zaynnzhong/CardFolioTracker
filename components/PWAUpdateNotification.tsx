import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdateNotification: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideUp">
      <div className="glass-card backdrop-blur-lg border border-crypto-lime/30 rounded-2xl p-4 shadow-xl">
        {offlineReady && (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm text-slate-200 flex-1">
              App ready to work offline
            </p>
            <button
              onClick={close}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {needRefresh && (
          <div className="flex items-center gap-3">
            <RefreshCw size={20} className="text-crypto-lime" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Update Available</p>
              <p className="text-xs text-slate-400">New version ready to install</p>
            </div>
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 bg-crypto-lime text-black rounded-lg text-sm font-semibold hover:bg-crypto-lime/90 transition-colors"
            >
              Reload
            </button>
            <button
              onClick={close}
              className="text-slate-400 hover:text-white transition-colors ml-2"
              aria-label="Close notification"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
