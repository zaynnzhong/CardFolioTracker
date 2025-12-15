import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Crown, Loader2, Settings } from 'lucide-react';
import { revenueCatService } from '../services/revenueCatService';
import { PurchasesOfferings, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { UserProfile } from '../types';

interface PaywallModalProps {
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  currentLimit: number;
  currentCount: number;
}

export function PaywallModal({ onClose, onSuccess, currentLimit, currentCount }: PaywallModalProps) {
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUnlockKeyInput, setShowUnlockKeyInput] = useState(false);

  const isNative = revenueCatService.isNativePlatform();

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offers = await revenueCatService.getOfferings();
      setOfferings(offers);
    } catch (err: any) {
      setError('Failed to load subscription options');
      console.error('Failed to load offerings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setPurchasing(true);
      setError('');

      const result = await revenueCatService.purchasePackage(pkg.identifier);

      if (result.success) {
        setSuccess('Successfully upgraded to Pro! Enjoy unlimited cards.');
        // Reload the page to fetch new user profile
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (result.error) {
        // Don't show error for user cancellation
        if (result.error !== 'Purchase cancelled') {
          setError(result.error);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      setError('');

      const result = await revenueCatService.restorePurchases();

      if (result.error) {
        setError(result.error);
      } else if (result.customerInfo) {
        const hasProAccess = await revenueCatService.hasProAccess();
        if (hasProAccess) {
          setSuccess('Purchases restored! You have Pro access.');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setError('No active subscriptions found. If you believe this is an error, please contact support.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while restoring purchases.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await revenueCatService.presentCustomerCenter();
    } catch (err: any) {
      console.error('Failed to open Customer Center:', err);
      // Fallback to opening platform subscription management
      const managementURL = revenueCatService.getManagementURL();
      if (managementURL) {
        window.open(managementURL, '_system');
      }
    }
  };

  const formatPrice = (pkg: PurchasesPackage): string => {
    return pkg.product.priceString;
  };

  const getPackageTitle = (pkg: PurchasesPackage): string => {
    if (pkg.identifier.includes('annual')) return 'Annual';
    if (pkg.identifier.includes('monthly')) return 'Monthly';
    if (pkg.identifier.includes('lifetime')) return 'Lifetime';
    return pkg.packageType;
  };

  const proFeatures = [
    'Unlimited cards in your portfolio',
    'Advanced analytics and insights',
    'Priority customer support',
    'Early access to new features',
    'No ads, ever',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-800 my-8">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-800 bg-gradient-to-r from-prism/20 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-prism" />
            <h2 className="text-2xl font-bold text-white">Upgrade to Pro</h2>
          </div>
          <p className="text-gray-300">
            You've used {currentCount} of {currentLimit} cards. Upgrade for unlimited access!
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-prism animate-spin" />
            </div>
          ) : error && !isNative ? (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-6">
                In-app purchases are only available on iOS and Android apps.
              </p>
              <button
                onClick={() => setShowUnlockKeyInput(true)}
                className="px-6 py-3 rounded-lg bg-prism text-black font-medium hover:opacity-90 transition-opacity"
              >
                Enter Unlock Key Instead
              </button>
            </div>
          ) : (
            <>
              {/* Features List */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-prism" />
                  What you'll get:
                </h3>
                <div className="space-y-3">
                  {proFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-prism flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription Options */}
              {offerings?.current && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-bold text-white">Choose your plan:</h3>
                  {offerings.current.availablePackages.map((pkg) => (
                    <button
                      key={pkg.identifier}
                      onClick={() => handlePurchase(pkg)}
                      disabled={purchasing}
                      className="w-full p-6 rounded-lg border-2 border-gray-700 hover:border-prism transition-all bg-gray-800/50 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <h4 className="text-lg font-bold text-white group-hover:text-prism transition-colors">
                            {getPackageTitle(pkg)}
                          </h4>
                          <p className="text-sm text-gray-400">{pkg.product.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-prism">{formatPrice(pkg)}</p>
                          {pkg.identifier.includes('annual') && (
                            <p className="text-xs text-gray-400">Best Value</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <p className="text-green-500 text-sm">{success}</p>
                </div>
              )}

              {/* Restore Purchases */}
              {isNative && (
                <div className="space-y-2">
                  <button
                    onClick={handleRestore}
                    disabled={purchasing}
                    className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors py-2"
                  >
                    Already purchased? Restore purchases
                  </button>
                  <button
                    onClick={handleManageSubscription}
                    disabled={purchasing}
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage Subscription
                  </button>
                </div>
              )}

              {/* Alternative: Unlock Key */}
              <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                <p className="text-sm text-gray-400 mb-3">
                  Have a promotional unlock key?
                </p>
                <button
                  onClick={() => setShowUnlockKeyInput(true)}
                  className="text-prism hover:underline text-sm font-medium"
                >
                  Enter unlock key instead
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 text-center">
          <p className="text-xs text-gray-500">
            Subscription will auto-renew. Cancel anytime from your App Store settings.
          </p>
        </div>
      </div>
    </div>
  );
}
