import { Purchases, LOG_LEVEL, PurchasesOfferings, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const REVENUECAT_API_KEY_IOS = import.meta.env.VITE_REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || '';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
} as const;

// Entitlement identifier
export const ENTITLEMENT_ID = 'PRISM Cards Portfolio Pro';

export interface Entitlement {
  identifier: string;
  isActive: boolean;
}

export const revenueCatService = {
  /**
   * Initialize RevenueCat SDK
   * Call this once when app starts (after user is authenticated)
   */
  async initialize(userId: string): Promise<void> {
    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('[RevenueCat] Web platform detected, skipping initialization');
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      const apiKey = platform === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

      if (!apiKey) {
        console.warn('[RevenueCat] API key not configured for platform:', platform);
        return;
      }

      // Configure SDK
      await Purchases.configure({
        apiKey,
        appUserID: userId, // Use Firebase UID
      });

      // Set log level for debugging (remove in production)
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      console.log('[RevenueCat] Initialized successfully for user:', userId);
    } catch (error) {
      console.error('[RevenueCat] Initialization failed:', error);
      throw error;
    }
  },

  /**
   * Get available offerings (subscription packages)
   */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[RevenueCat] Web platform - no offerings available');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      console.log('[RevenueCat] Offerings:', offerings);
      return offerings;
    } catch (error) {
      console.error('[RevenueCat] Failed to get offerings:', error);
      return null;
    }
  },

  /**
   * Purchase a package
   */
  async purchasePackage(packageIdentifier: string): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('[RevenueCat] Purchase not available on web platform');
      return { success: false, error: 'In-app purchases are only available on mobile devices' };
    }

    try {
      const offerings = await this.getOfferings();
      if (!offerings?.current) {
        return { success: false, error: 'No subscription packages are currently available. Please try again later.' };
      }

      // Find the package
      const pkg = offerings.current.availablePackages.find(
        (p) => p.identifier === packageIdentifier
      );

      if (!pkg) {
        return { success: false, error: 'The selected subscription package is not available.' };
      }

      // Purchase the package
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });

      console.log('[RevenueCat] Purchase successful:', customerInfo);
      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('[RevenueCat] Purchase failed:', error);

      // Handle user cancellation gracefully
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }

      // Handle network errors
      if (error.message?.includes('network') || error.message?.includes('Network')) {
        return { success: false, error: 'Network error. Please check your connection and try again.' };
      }

      // Handle payment errors
      if (error.message?.includes('payment') || error.message?.includes('Payment')) {
        return { success: false, error: 'Payment failed. Please check your payment method and try again.' };
      }

      // Generic error
      return { success: false, error: error.message || 'Purchase failed. Please try again.' };
    }
  },

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<{ customerInfo?: CustomerInfo; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('[RevenueCat] Restore not available on web platform');
      return { error: 'Restore purchases is only available on mobile devices' };
    }

    try {
      const { customerInfo } = await Purchases.restorePurchases();
      console.log('[RevenueCat] Purchases restored:', customerInfo);
      return { customerInfo };
    } catch (error: any) {
      console.error('[RevenueCat] Restore failed:', error);

      // Handle network errors
      if (error.message?.includes('network') || error.message?.includes('Network')) {
        return { error: 'Network error. Please check your connection and try again.' };
      }

      return { error: error.message || 'Failed to restore purchases. Please try again.' };
    }
  },

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Failed to get customer info:', error);
      return null;
    }
  },

  /**
   * Check if user has active "PRISM Cards Portfolio Pro" entitlement
   */
  async hasProAccess(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // On web, always return false (no in-app purchases)
      return false;
    }

    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;

      // Check for "PRISM Cards Portfolio Pro" entitlement
      const proEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      return proEntitlement ? true : false;
    } catch (error) {
      console.error('[RevenueCat] Failed to check pro access:', error);
      return false;
    }
  },

  /**
   * Get all active entitlements
   */
  async getActiveEntitlements(): Promise<Entitlement[]> {
    if (!Capacitor.isNativePlatform()) {
      return [];
    }

    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return [];

      const entitlements: Entitlement[] = [];
      for (const [identifier, entitlement] of Object.entries(customerInfo.entitlements.active)) {
        entitlements.push({
          identifier,
          isActive: true
        });
      }

      return entitlements;
    } catch (error) {
      console.error('[RevenueCat] Failed to get entitlements:', error);
      return [];
    }
  },

  /**
   * Set user attributes for analytics
   */
  async setUserAttributes(attributes: { email?: string; displayName?: string }): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      if (attributes.email) {
        await Purchases.setEmail({ email: attributes.email });
      }
      if (attributes.displayName) {
        await Purchases.setDisplayName({ displayName: attributes.displayName });
      }
    } catch (error) {
      console.error('[RevenueCat] Failed to set user attributes:', error);
    }
  },

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  },

  /**
   * Present Customer Center for subscription management
   * Allows users to manage subscriptions, view billing history, etc.
   */
  async presentCustomerCenter(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('[RevenueCat] Customer Center not available on web platform');
      return;
    }

    try {
      // Note: presentCustomerCenter is available in @revenuecat/purchases-capacitor v11+
      // If this method doesn't exist, users should manage subscriptions via App Store/Play Store
      if ('presentCustomerCenter' in Purchases) {
        await (Purchases as any).presentCustomerCenter();
      } else {
        console.warn('[RevenueCat] Customer Center not available in current SDK version. Users should manage subscriptions via App Store or Play Store settings.');
        // Open platform-specific subscription management
        const platform = Capacitor.getPlatform();
        if (platform === 'ios') {
          window.open('https://apps.apple.com/account/subscriptions', '_system');
        } else if (platform === 'android') {
          window.open('https://play.google.com/store/account/subscriptions', '_system');
        }
      }
    } catch (error) {
      console.error('[RevenueCat] Failed to present Customer Center:', error);
      throw error;
    }
  },

  /**
   * Get management URL for web users
   * Web users should be directed to manage subscriptions via app stores
   */
  getManagementURL(): string | null {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    const platform = Capacitor.getPlatform();
    if (platform === 'ios') {
      return 'https://apps.apple.com/account/subscriptions';
    } else if (platform === 'android') {
      return 'https://play.google.com/store/account/subscriptions';
    }

    return null;
  }
};
