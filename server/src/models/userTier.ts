import mongoose, { Schema, Document } from 'mongoose';
import { UserProfile, UnlockKey, SystemConfig, UserTier } from '../types/userTier';

// User Profile Schema
const UserProfileSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, index: true },
  tier: { type: String, enum: Object.values(UserTier), default: UserTier.FREE },
  cardLimit: { type: Number, default: 30 },
  unlockKey: String,
  whitelisted: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

// Unlock Key Schema
const UnlockKeySchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  tier: { type: String, enum: Object.values(UserTier), required: true },
  cardLimit: { type: Number, required: true },
  maxUses: { type: Number, default: -1 },
  usedCount: { type: Number, default: 0 },
  createdAt: { type: String, default: () => new Date().toISOString() },
  expiresAt: String,
  active: { type: Boolean, default: true }
});

// System Config Schema
const SystemConfigSchema = new Schema({
  configKey: { type: String, required: true, unique: true, default: 'main' },
  defaultCardLimit: { type: Number, default: 30 },
  emailWhitelist: [{ type: String }],
  adminEmails: [{ type: String }]
});

// Models
export const UserProfileModel = mongoose.models.UserProfile ||
  mongoose.model<UserProfile & Document>('UserProfile', UserProfileSchema);

export const UnlockKeyModel = mongoose.models.UnlockKey ||
  mongoose.model<UnlockKey & Document>('UnlockKey', UnlockKeySchema);

export const SystemConfigModel = mongoose.models.SystemConfig ||
  mongoose.model<SystemConfig & Document>('SystemConfig', SystemConfigSchema);
