import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { requestNotificationPermission, onForegroundMessage } from '../firebase';
import { auth } from '../firebase';

interface NotificationPermissionProps {
  onTokenSaved?: (token: string) => void;
}

export const NotificationPermission: React.FC<NotificationPermissionProps> = ({ onTokenSaved }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);

      // Show prompt if permission not granted and not previously dismissed
      const dismissedUntil = localStorage.getItem('notification-prompt-dismissed');
      if (Notification.permission === 'default' && (!dismissedUntil || Date.now() > parseInt(dismissedUntil))) {
        // Wait a bit before showing prompt (better UX)
        setTimeout(() => setShowPrompt(true), 5000);
      }
    }

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[Notification] Foreground message:', payload);

      // Show notification using browser API
      if (payload.notification) {
        new Notification(payload.notification.title || 'Prism Portfolio', {
          body: payload.notification.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: payload.data?.tag || 'prism-notification',
          data: payload.data
        });
      }
    });

    return unsubscribe;
  }, []);

  const handleEnable = async () => {
    try {
      const token = await requestNotificationPermission();

      if (token) {
        console.log('[Notification] Token obtained:', token);
        setPermission('granted');
        setShowPrompt(false);

        // Save token to backend
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/fcm-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ fcmToken: token })
          });

          if (response.ok) {
            console.log('[Notification] Token saved to backend');
            onTokenSaved?.(token);
          } else {
            console.error('[Notification] Failed to save token to backend');
          }
        }
      } else {
        setPermission('denied');
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('[Notification] Error requesting permission:', error);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Remember dismissal for 7 days
    const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('notification-prompt-dismissed', dismissedUntil.toString());
  };

  if (!showPrompt || permission !== 'default' || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideUp">
      <div className="glass-card backdrop-blur-lg border border-crypto-lime/30 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-crypto-lime/10 border border-crypto-lime/30 flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-crypto-lime" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white mb-1">Enable Notifications</h3>
            <p className="text-sm text-slate-300 mb-3">
              Get alerts for price changes, market updates, and offers on your cards.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                className="flex-1 py-2.5 px-4 bg-crypto-lime text-black rounded-xl text-sm font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-4 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0 p-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
