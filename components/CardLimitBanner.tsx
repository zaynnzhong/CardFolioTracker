import React, { useState, useEffect } from 'react';
import { AlertCircle, Crown, X } from 'lucide-react';
import { tierService } from '../services/tierService';
import { revenueCatService } from '../services/revenueCatService';
import { UserProfile, UserTier } from '../types';
import { PaywallModal } from './PaywallModal';

interface CardLimitBannerProps {
  cardCount: number;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export function CardLimitBanner({ cardCount, onProfileUpdate }: CardLimitBannerProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isNative = revenueCatService.isNativePlatform();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await tierService.getUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleUnlockSuccess = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    }
  };

  // Don't show banner if user is unlimited or dismissed
  if (!profile || dismissed) return null;
  if (profile.tier === UserTier.UNLIMITED || profile.cardLimit === -1) return null;

  const remaining = profile.cardLimit - cardCount;
  const percentUsed = (cardCount / profile.cardLimit) * 100;

  // Show warning when at 80% capacity or above
  if (percentUsed < 80) return null;

  // Determine banner style based on severity
  const isAtLimit = remaining <= 0;
  const isVeryClose = remaining <= 2;

  const bannerStyles = isAtLimit
    ? 'bg-red-500/10 border-red-500/30'
    : isVeryClose
    ? 'bg-orange-500/10 border-orange-500/30'
    : 'bg-yellow-500/10 border-yellow-500/30';

  const iconColor = isAtLimit
    ? 'text-red-500'
    : isVeryClose
    ? 'text-orange-500'
    : 'text-yellow-500';

  const textColor = isAtLimit
    ? 'text-red-400'
    : isVeryClose
    ? 'text-orange-400'
    : 'text-yellow-400';

  return (
    <>
      <div className={`relative p-4 rounded-lg border ${bannerStyles} mb-6`}>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <AlertCircle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${textColor} mb-2`}>
              {isAtLimit
                ? `Card limit reached (${cardCount}/${profile.cardLimit})`
                : `Approaching card limit (${cardCount}/${profile.cardLimit} cards used)`}
            </p>
            <p className="text-sm text-gray-300 mb-3">
              {isAtLimit
                ? 'You\'ve reached your card limit. Unlock unlimited cards to continue adding to your collection.'
                : `You have ${remaining} card${remaining === 1 ? '' : 's'} remaining. Unlock unlimited access to grow your portfolio.`}
            </p>
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-prism text-black font-medium hover:opacity-90 transition-opacity text-sm"
            >
              <Crown className="w-4 h-4" />
              {isNative ? 'Upgrade to Pro' : 'Unlock Unlimited'}
            </button>
          </div>
        </div>
      </div>

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          onSuccess={handleUnlockSuccess}
          currentLimit={profile?.cardLimit || 30}
          currentCount={cardCount}
        />
      )}
    </>
  );
}
