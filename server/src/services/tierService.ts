import { connectToDb } from '../db';
import { UserProfileModel, UnlockKeyModel, SystemConfigModel } from '../models/userTier';
import { UserProfile, UnlockKey, SystemConfig, UserTier } from '../types/userTier';

export const tierService = {
  /**
   * Get or create user profile
   */
  async getUserProfile(userId: string, email: string): Promise<UserProfile> {
    await connectToDb();

    let profile = await UserProfileModel.findOne({ userId });

    if (!profile) {
      // Get system config to check whitelist and default limit
      const config = await this.getSystemConfig();
      const isWhitelisted = config.emailWhitelist.includes(email.toLowerCase());

      // Create new profile
      profile = new UserProfileModel({
        userId,
        email: email.toLowerCase(),
        tier: isWhitelisted ? UserTier.UNLIMITED : UserTier.FREE,
        cardLimit: isWhitelisted ? -1 : config.defaultCardLimit,
        whitelisted: isWhitelisted,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await profile.save();
    }

    return profile.toObject();
  },

  /**
   * Check if user can add more cards
   * Note: Watchlist cards are excluded from the limit - only portfolio cards count
   */
  async canAddCard(userId: string, email: string): Promise<{ allowed: boolean; limit: number; current: number; message?: string }> {
    await connectToDb();

    const profile = await this.getUserProfile(userId, email);
    console.log('[TierService] canAddCard - Profile:', { userId, tier: profile.tier, cardLimit: profile.cardLimit });

    // Unlimited users can always add
    if (profile.tier === UserTier.UNLIMITED || profile.cardLimit === -1) {
      console.log('[TierService] canAddCard - Unlimited user, allowing');
      return { allowed: true, limit: -1, current: 0 };
    }

    // Count current portfolio cards for this user (exclude watchlist cards)
    const CardModel = (await import('../db')).default;
    const mongoose = await import('mongoose');
    const count = await mongoose.models.Card.countDocuments({
      userId,
      $or: [
        { watchlist: { $exists: false } }, // Cards without watchlist field (legacy data)
        { watchlist: false }                // Cards explicitly not in watchlist
      ]
    });

    console.log('[TierService] canAddCard - Portfolio card count:', count, '/', profile.cardLimit);

    if (count >= profile.cardLimit) {
      console.log('[TierService] canAddCard - Limit reached, denying');
      return {
        allowed: false,
        limit: profile.cardLimit,
        current: count,
        message: `You've reached your limit of ${profile.cardLimit} cards. Upgrade to add more cards.`
      };
    }

    console.log('[TierService] canAddCard - Under limit, allowing');
    return {
      allowed: true,
      limit: profile.cardLimit,
      current: count
    };
  },

  /**
   * Validate and redeem unlock key
   */
  async redeemUnlockKey(userId: string, email: string, keyString: string): Promise<{ success: boolean; message: string; profile?: UserProfile }> {
    await connectToDb();

    // Find the key
    const unlockKey = await UnlockKeyModel.findOne({ key: keyString });

    if (!unlockKey) {
      return { success: false, message: 'Invalid unlock key' };
    }

    if (!unlockKey.active) {
      return { success: false, message: 'This unlock key has been deactivated' };
    }

    // Check expiration
    if (unlockKey.expiresAt) {
      const expiryDate = new Date(unlockKey.expiresAt);
      if (expiryDate < new Date()) {
        return { success: false, message: 'This unlock key has expired' };
      }
    }

    // Check usage limit
    if (unlockKey.maxUses !== -1 && unlockKey.usedCount >= unlockKey.maxUses) {
      return { success: false, message: 'This unlock key has reached its usage limit' };
    }

    // Get or create user profile
    let profile = await UserProfileModel.findOne({ userId });

    if (!profile) {
      profile = new UserProfileModel({
        userId,
        email: email.toLowerCase(),
        createdAt: new Date().toISOString()
      });
    }

    // Check if user already used a key
    if (profile.unlockKey && profile.unlockKey !== keyString) {
      return { success: false, message: 'You have already used a different unlock key' };
    }

    // Update profile
    profile.tier = unlockKey.tier;
    profile.cardLimit = unlockKey.cardLimit;
    profile.unlockKey = keyString;
    profile.updatedAt = new Date().toISOString();
    await profile.save();

    // Increment key usage if not already counted
    if (profile.unlockKey !== keyString) {
      unlockKey.usedCount += 1;
      await unlockKey.save();
    }

    return {
      success: true,
      message: `Successfully unlocked ${unlockKey.cardLimit === -1 ? 'unlimited' : unlockKey.cardLimit} cards!`,
      profile: profile.toObject()
    };
  },

  /**
   * Get system configuration
   */
  async getSystemConfig(): Promise<SystemConfig> {
    await connectToDb();

    let config = await SystemConfigModel.findOne({ configKey: 'main' });

    if (!config) {
      // Create default config
      config = new SystemConfigModel({
        configKey: 'main',
        defaultCardLimit: 30,
        emailWhitelist: [],
        adminEmails: []
      });
      await config.save();
    }

    return config.toObject();
  },

  /**
   * Update system configuration (admin only)
   */
  async updateSystemConfig(updates: Partial<SystemConfig>): Promise<SystemConfig> {
    await connectToDb();

    const config = await SystemConfigModel.findOneAndUpdate(
      { configKey: 'main' },
      { $set: updates },
      { new: true, upsert: true }
    );

    return config!.toObject();
  },

  /**
   * Add email to whitelist (admin only)
   */
  async addToWhitelist(email: string): Promise<SystemConfig> {
    await connectToDb();

    const normalizedEmail = email.toLowerCase();
    const config = await SystemConfigModel.findOne({ configKey: 'main' });

    if (!config) {
      throw new Error('System config not found');
    }

    if (!config.emailWhitelist.includes(normalizedEmail)) {
      config.emailWhitelist.push(normalizedEmail);
      await config.save();

      // Update existing user profile if they exist
      const profile = await UserProfileModel.findOne({ email: normalizedEmail });
      if (profile) {
        profile.tier = UserTier.UNLIMITED;
        profile.cardLimit = -1;
        profile.whitelisted = true;
        profile.updatedAt = new Date().toISOString();
        await profile.save();
      }
    }

    return config.toObject();
  },

  /**
   * Remove email from whitelist (admin only)
   */
  async removeFromWhitelist(email: string): Promise<SystemConfig> {
    await connectToDb();

    const normalizedEmail = email.toLowerCase();
    const config = await SystemConfigModel.findOne({ configKey: 'main' });

    if (!config) {
      throw new Error('System config not found');
    }

    config.emailWhitelist = config.emailWhitelist.filter(e => e !== normalizedEmail);
    await config.save();

    // Update existing user profile if they exist and haven't used a key
    const profile = await UserProfileModel.findOne({ email: normalizedEmail });
    if (profile && !profile.unlockKey) {
      profile.tier = UserTier.FREE;
      profile.cardLimit = config.defaultCardLimit;
      profile.whitelisted = false;
      profile.updatedAt = new Date().toISOString();
      await profile.save();
    }

    return config.toObject();
  },

  /**
   * Create unlock key (admin only)
   */
  async createUnlockKey(params: {
    tier: UserTier;
    cardLimit: number;
    maxUses?: number;
    expiresAt?: string;
  }): Promise<UnlockKey> {
    await connectToDb();

    // Generate random key (e.g., PRISM-XXXX-XXXX-XXXX)
    const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `PRISM-${randomPart()}-${randomPart()}-${randomPart()}`;

    const unlockKey = new UnlockKeyModel({
      key,
      tier: params.tier,
      cardLimit: params.cardLimit,
      maxUses: params.maxUses || -1,
      expiresAt: params.expiresAt,
      usedCount: 0,
      active: true,
      createdAt: new Date().toISOString()
    });

    await unlockKey.save();
    return unlockKey.toObject();
  },

  /**
   * List all unlock keys (admin only)
   */
  async listUnlockKeys(): Promise<UnlockKey[]> {
    await connectToDb();
    const keys = await UnlockKeyModel.find().sort({ createdAt: -1 });
    return keys.map(k => k.toObject());
  },

  /**
   * Deactivate unlock key (admin only)
   */
  async deactivateUnlockKey(key: string): Promise<UnlockKey | null> {
    await connectToDb();
    const unlockKey = await UnlockKeyModel.findOneAndUpdate(
      { key },
      { active: false },
      { new: true }
    );
    return unlockKey ? unlockKey.toObject() : null;
  },

  /**
   * Check if user is admin
   */
  async isAdmin(email: string): Promise<boolean> {
    const config = await this.getSystemConfig();
    return config.adminEmails.includes(email.toLowerCase());
  }
};
