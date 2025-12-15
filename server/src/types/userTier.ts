// User tier and limit system types

export enum UserTier {
  FREE = 'free',
  UNLIMITED = 'unlimited'
}

export interface UserProfile {
  userId: string; // Firebase user ID
  email: string;
  tier: UserTier;
  cardLimit: number; // -1 for unlimited
  unlockKey?: string; // If unlocked via key
  whitelisted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnlockKey {
  key: string;
  tier: UserTier;
  cardLimit: number; // -1 for unlimited
  maxUses: number; // -1 for unlimited uses
  usedCount: number;
  createdAt: string;
  expiresAt?: string; // Optional expiration
  active: boolean;
}

export interface SystemConfig {
  defaultCardLimit: number; // Default limit for new free users
  emailWhitelist: string[]; // Emails that get unlimited access
  adminEmails: string[]; // Emails that can access admin interface
}

export interface UsageStats {
  userId: string;
  cardCount: number;
  lastChecked: string;
}
