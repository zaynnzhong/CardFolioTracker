import mongoose, { Schema, Document } from 'mongoose';

export interface BundledCard {
  cardId: string;
  currentValueAtPlanTime: number;
  cardSnapshot: {
    player: string;
    year: string;
    set: string;
    parallel?: string;
    grade?: string;
    imageUrl?: string;
  };
}

export interface ITradePlan extends Document {
  userId: string;
  planName: string;
  targetValue?: number;
  targetCard?: {
    player: string;
    year: string;
    set: string;
    parallel?: string;
    grade?: string;
    imageUrl?: string;
  };
  bundleCards: BundledCard[];
  cashAmount?: number;
  cashCurrency?: 'USD' | 'CNY';
  totalBundleValue: number;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  completedTransactionId?: string;
}

const BundledCardSchema = new Schema({
  cardId: { type: String, required: true },
  currentValueAtPlanTime: { type: Number, required: true },
  cardSnapshot: {
    player: { type: String, required: true },
    year: { type: String, required: true },
    set: { type: String, required: true },
    parallel: { type: String },
    grade: { type: String },
    imageUrl: { type: String }
  }
}, { _id: false });

const TradePlanSchema = new Schema({
  userId: { type: String, required: true, index: true },
  planName: { type: String, required: true },
  targetValue: { type: Number },
  targetCard: {
    player: { type: String },
    year: { type: String },
    set: { type: String },
    parallel: { type: String },
    grade: { type: String },
    imageUrl: { type: String }
  },
  bundleCards: { type: [BundledCardSchema], required: true },
  cashAmount: { type: Number },
  cashCurrency: { type: String, enum: ['USD', 'CNY'] },
  totalBundleValue: { type: Number, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
    required: true
  },
  completedTransactionId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
TradePlanSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Create index for efficient querying
TradePlanSchema.index({ userId: 1, status: 1 });
TradePlanSchema.index({ userId: 1, createdAt: -1 });

// Use a global variable to prevent recompiling model in serverless hot-reloads
export const TradePlanModel = mongoose.models.TradePlan || mongoose.model<ITradePlan>('TradePlan', TradePlanSchema, 'tradePlans');
