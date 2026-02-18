/**
 * Seed Demo Data Script
 *
 * Creates a demo account with pre-populated data for App Store review.
 *
 * Usage:
 *   npx ts-node src/scripts/seedDemoData.ts
 *
 * Required env vars:
 *   MONGODB_URI - MongoDB connection string
 *   FIREBASE_SERVICE_ACCOUNT_KEY - Firebase admin credentials
 *   DEMO_EMAIL - Email for the demo account (e.g., demo@prism-cards.com)
 *   DEMO_OTP_CODE - OTP code for demo login bypass (e.g., 888888)
 */

import dotenv from 'dotenv';
import path from 'path';

// Try loading from server/.env first, then from project root .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

import mongoose from 'mongoose';
import admin from 'firebase-admin';
import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();

// ---- Firebase Admin Init ----
const initFirebase = () => {
  if (admin.apps.length > 0) return;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
};

// ---- Card Schema (inline to avoid import issues) ----
const CardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  player: { type: String, required: true },
  sport: { type: String, required: true },
  year: { type: Number, required: true },
  brand: { type: String, required: true },
  series: { type: String, required: true },
  insert: { type: String, required: true },
  parallel: String,
  purchasePrice: { type: Number, required: true },
  currency: { type: String, enum: ['USD', 'CNY'], default: 'USD' },
  currentValue: { type: Number, required: true },
  priceHistory: [{
    date: String,
    value: Number,
    platform: String,
    parallel: String,
    grade: String,
    serialNumber: String,
  }],
  imageUrl: String,
  watchlist: Boolean,
  sold: Boolean,
  soldPrice: Number,
  soldDate: String,
  soldVia: { type: String, enum: ['sale', 'trade'] },
  graded: Boolean,
  gradeCompany: String,
  gradeValue: String,
  autoGrade: String,
  certNumber: String,
  notes: String,
  serialNumber: String,
  purchaseDate: String,
  acquisitionSource: String,
  acquisitionSourceOther: String,
  offers: [{ id: String, offerPrice: Number, platform: String, senderName: String, date: String, notes: String }],
  neverTrade: Boolean,
});

const CardModel = mongoose.models.Card || mongoose.model('Card', CardSchema);

const TradePlanSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  planName: { type: String, required: true },
  targetValue: Number,
  targetCard: {
    player: String,
    year: Number,
    set: String,
    parallel: String,
    grade: String,
    estimatedValue: Number,
  },
  bundleCards: [{
    cardId: String,
    currentValueAtPlanTime: Number,
    cardSnapshot: {
      player: String,
      year: Number,
      set: String,
      parallel: String,
      grade: String,
      imageUrl: String,
    },
  }],
  cashAmount: { type: Number, default: 0 },
  cashCurrency: { type: String, default: 'USD' },
  totalBundleValue: Number,
  notes: String,
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  completedTransactionId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const TradePlanModel = mongoose.models.TradePlan || mongoose.model('TradePlan', TradePlanSchema);

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, index: true },
  tier: { type: String, default: 'UNLIMITED' },
  cardLimit: { type: Number, default: 9999 },
  unlockKey: String,
  whitelisted: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

const UserProfileModel = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);

// ---- Helper: generate price history ----
function generatePriceHistory(
  basePrice: number,
  months: number,
  trend: 'up' | 'down' | 'stable' | 'volatile',
  currency: 'USD' | 'CNY' = 'USD'
): { date: string; value: number; platform?: string }[] {
  const history: { date: string; value: number; platform?: string }[] = [];
  const platforms = ['eBay', 'PWCC', 'MySlabs', 'Mercari', 'StockX'];
  let price = basePrice;

  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(Math.floor(Math.random() * 28) + 1);

    let change = 0;
    switch (trend) {
      case 'up':
        change = price * (Math.random() * 0.12 + 0.01);
        break;
      case 'down':
        change = price * -(Math.random() * 0.10 + 0.01);
        break;
      case 'stable':
        change = price * (Math.random() * 0.06 - 0.03);
        break;
      case 'volatile':
        change = price * (Math.random() * 0.20 - 0.10);
        break;
    }

    price = Math.max(price + change, basePrice * 0.3);
    price = Math.round(price * 100) / 100;

    history.push({
      date: date.toISOString(),
      value: price,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
    });
  }

  return history;
}

// ---- Main Seed Function ----
async function seedDemoData() {
  const demoEmail = process.env.DEMO_EMAIL;
  if (!demoEmail) {
    console.error('DEMO_EMAIL env var is required');
    process.exit(1);
  }

  console.log(`\n=== Seeding Demo Data for ${demoEmail} ===\n`);

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI env var is required');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Init Firebase
  initFirebase();

  // Create or get Firebase user
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(demoEmail);
    console.log(`Existing Firebase user found: ${userRecord.uid}`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      userRecord = await admin.auth().createUser({
        email: demoEmail,
        emailVerified: true,
        displayName: 'Demo User',
      });
      console.log(`Created new Firebase user: ${userRecord.uid}`);
    } else {
      throw err;
    }
  }

  const userId = userRecord.uid;

  // Clean existing demo data
  await CardModel.deleteMany({ userId });
  await TradePlanModel.deleteMany({ userId });
  await UserProfileModel.deleteOne({ userId });
  console.log('Cleaned existing demo data');

  // ---- Create User Profile (UNLIMITED tier) ----
  await UserProfileModel.create({
    userId,
    email: demoEmail,
    tier: 'UNLIMITED',
    cardLimit: 9999,
    whitelisted: true,
  });
  console.log('Created user profile (UNLIMITED tier)');

  // ---- Create Portfolio Cards (15 cards) ----
  const portfolioCards = [
    // Basketball
    {
      player: 'Luka Doncic', sport: 'Basketball', year: 2018, brand: 'Panini', series: 'Prizm',
      insert: 'Base', parallel: 'Silver', purchasePrice: 850, currentValue: 1200,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'up' as const,
    },
    {
      player: 'Victor Wembanyama', sport: 'Basketball', year: 2023, brand: 'Panini', series: 'Prizm',
      insert: 'Base', parallel: 'Red White Blue', purchasePrice: 120, currentValue: 280,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'up' as const,
    },
    {
      player: 'Anthony Edwards', sport: 'Basketball', year: 2020, brand: 'Panini', series: 'Prizm',
      insert: 'Base', parallel: 'Silver', purchasePrice: 300, currentValue: 450,
      graded: true, gradeCompany: 'BGS', gradeValue: '9.5', trend: 'up' as const,
    },
    {
      player: 'Jayson Tatum', sport: 'Basketball', year: 2017, brand: 'Panini', series: 'Donruss Optic',
      insert: 'Rated Rookie', purchasePrice: 200, currentValue: 175,
      graded: true, gradeCompany: 'PSA', gradeValue: '9', trend: 'down' as const,
    },
    {
      player: 'LeBron James', sport: 'Basketball', year: 2003, brand: 'Topps', series: 'Chrome',
      insert: 'Base', purchasePrice: 3500, currentValue: 4200,
      graded: true, gradeCompany: 'PSA', gradeValue: '8', trend: 'stable' as const,
      neverTrade: true,
    },
    // Baseball
    {
      player: 'Shohei Ohtani', sport: 'Baseball', year: 2018, brand: 'Topps', series: 'Chrome',
      insert: 'Base', parallel: 'Refractor', purchasePrice: 600, currentValue: 950,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'up' as const,
    },
    {
      player: 'Julio Rodriguez', sport: 'Baseball', year: 2022, brand: 'Topps', series: 'Chrome',
      insert: 'Base', purchasePrice: 80, currentValue: 65,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'down' as const,
    },
    {
      player: 'Elly De La Cruz', sport: 'Baseball', year: 2023, brand: 'Bowman', series: 'Chrome',
      insert: '1st Bowman', parallel: 'Refractor', purchasePrice: 150, currentValue: 220,
      graded: false, trend: 'volatile' as const,
    },
    // Football
    {
      player: 'Caleb Williams', sport: 'Football', year: 2024, brand: 'Panini', series: 'Prizm',
      insert: 'Base', parallel: 'Silver', purchasePrice: 90, currentValue: 145,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'up' as const,
    },
    {
      player: 'Patrick Mahomes', sport: 'Football', year: 2017, brand: 'Panini', series: 'Prizm',
      insert: 'Base', parallel: 'Silver', purchasePrice: 1800, currentValue: 2100,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'stable' as const,
      neverTrade: true,
    },
    {
      player: 'CJ Stroud', sport: 'Football', year: 2023, brand: 'Panini', series: 'Prizm',
      insert: 'Base', purchasePrice: 55, currentValue: 75,
      graded: true, gradeCompany: 'BGS', gradeValue: '9.5', trend: 'up' as const,
    },
    // Soccer
    {
      player: 'Jude Bellingham', sport: 'Soccer', year: 2020, brand: 'Topps', series: 'Chrome',
      insert: 'Base', parallel: 'Refractor', purchasePrice: 400, currentValue: 680,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'up' as const,
    },
    {
      player: 'Lamine Yamal', sport: 'Soccer', year: 2023, brand: 'Topps', series: 'Merlin',
      insert: 'Base', purchasePrice: 50, currentValue: 120,
      graded: false, trend: 'up' as const,
    },
    // Pokemon
    {
      player: 'Charizard', sport: 'Pokemon', year: 1999, brand: 'WOTC', series: 'Base Set',
      insert: 'Holo', purchasePrice: 2800, currentValue: 3500,
      graded: true, gradeCompany: 'PSA', gradeValue: '7', trend: 'stable' as const,
      neverTrade: true,
    },
    {
      player: 'Pikachu VMAX', sport: 'Pokemon', year: 2021, brand: 'Pokemon', series: 'Vivid Voltage',
      insert: 'Rainbow Rare', purchasePrice: 180, currentValue: 250,
      graded: true, gradeCompany: 'CGC', gradeValue: '9.5', trend: 'up' as const,
    },
  ];

  const createdCards: any[] = [];
  for (const card of portfolioCards) {
    const id = uuidv4();
    const priceHistory = generatePriceHistory(card.purchasePrice, 6, card.trend);
    const finalPrice = priceHistory[priceHistory.length - 1].value;

    const doc = await CardModel.create({
      id,
      userId,
      player: card.player,
      sport: card.sport,
      year: card.year,
      brand: card.brand,
      series: card.series,
      insert: card.insert,
      parallel: card.parallel || undefined,
      purchasePrice: card.purchasePrice,
      currency: 'USD',
      currentValue: card.currentValue || finalPrice,
      priceHistory,
      graded: card.graded || false,
      gradeCompany: card.gradeCompany || undefined,
      gradeValue: card.gradeValue || undefined,
      neverTrade: card.neverTrade || false,
      purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acquisitionSource: ['eBay', 'LCS', 'Card Show', 'PWCC', 'Trade'][Math.floor(Math.random() * 5)],
    });

    createdCards.push(doc);
  }
  console.log(`Created ${createdCards.length} portfolio cards`);

  // ---- Create Watchlist Cards (5 cards) ----
  const watchlistCards = [
    {
      player: 'Anthony Edwards', sport: 'Basketball', year: 2020, brand: 'Panini', series: 'National Treasures',
      insert: 'RPA', parallel: '/99', purchasePrice: 0, currentValue: 8500,
      graded: true, gradeCompany: 'BGS', gradeValue: '9.5', trend: 'volatile' as const,
    },
    {
      player: 'Shohei Ohtani', sport: 'Baseball', year: 2018, brand: 'Topps', series: 'Update',
      insert: 'Base', parallel: 'Gold /2018', purchasePrice: 0, currentValue: 1200,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'up' as const,
    },
    {
      player: 'Travis Kelce', sport: 'Football', year: 2013, brand: 'Panini', series: 'Prizm',
      insert: 'Base', parallel: 'Silver', purchasePrice: 0, currentValue: 550,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'up' as const,
    },
    {
      player: 'Erling Haaland', sport: 'Soccer', year: 2020, brand: 'Topps', series: 'Chrome',
      insert: 'Base', purchasePrice: 0, currentValue: 350,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'stable' as const,
    },
    {
      player: 'Umbreon VMAX', sport: 'Pokemon', year: 2021, brand: 'Pokemon', series: 'Evolving Skies',
      insert: 'Alternate Art', purchasePrice: 0, currentValue: 450,
      graded: true, gradeCompany: 'PSA', gradeValue: '10', trend: 'up' as const,
    },
  ];

  for (const card of watchlistCards) {
    const id = uuidv4();
    const priceHistory = generatePriceHistory(card.currentValue * 0.7, 4, card.trend);

    await CardModel.create({
      id,
      userId,
      player: card.player,
      sport: card.sport,
      year: card.year,
      brand: card.brand,
      series: card.series,
      insert: card.insert,
      parallel: card.parallel || undefined,
      purchasePrice: 0,
      currency: 'USD',
      currentValue: card.currentValue,
      priceHistory,
      watchlist: true,
      graded: card.graded || false,
      gradeCompany: card.gradeCompany || undefined,
      gradeValue: card.gradeValue || undefined,
    });
  }
  console.log('Created 5 watchlist cards');

  // ---- Create Sold Cards (3 cards) ----
  const soldCards = [
    {
      player: 'Ja Morant', sport: 'Basketball', year: 2019, brand: 'Panini', series: 'Prizm',
      insert: 'Base', parallel: 'Silver', purchasePrice: 400, currentValue: 250,
      soldPrice: 520, soldVia: 'sale' as const,
      graded: true, gradeCompany: 'PSA', gradeValue: '10',
    },
    {
      player: 'Ronald Acuna Jr', sport: 'Baseball', year: 2018, brand: 'Topps', series: 'Update',
      insert: 'Base', purchasePrice: 150, currentValue: 180,
      soldPrice: 280, soldVia: 'sale' as const,
      graded: true, gradeCompany: 'PSA', gradeValue: '10',
    },
    {
      player: 'Justin Herbert', sport: 'Football', year: 2020, brand: 'Panini', series: 'Prizm',
      insert: 'Base', parallel: 'Silver', purchasePrice: 350, currentValue: 200,
      soldPrice: 300, soldVia: 'trade' as const,
      graded: true, gradeCompany: 'PSA', gradeValue: '9',
    },
  ];

  for (const card of soldCards) {
    const id = uuidv4();
    const soldDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await CardModel.create({
      id,
      userId,
      player: card.player,
      sport: card.sport,
      year: card.year,
      brand: card.brand,
      series: card.series,
      insert: card.insert,
      parallel: card.parallel || undefined,
      purchasePrice: card.purchasePrice,
      currency: 'USD',
      currentValue: card.soldPrice,
      priceHistory: generatePriceHistory(card.purchasePrice, 4, 'volatile'),
      sold: true,
      soldPrice: card.soldPrice,
      soldDate,
      soldVia: card.soldVia,
      graded: card.graded,
      gradeCompany: card.gradeCompany,
      gradeValue: card.gradeValue,
      purchaseDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acquisitionSource: 'eBay',
    });
  }
  console.log('Created 3 sold cards');

  // ---- Create Trade Plans (2 plans) ----
  // Plan 1: Pending bundle trade
  const bundleCardIds = createdCards.slice(3, 5).map((c) => c.id);
  await TradePlanModel.create({
    userId,
    planName: 'Trade Up to Wemby National Treasures RPA',
    targetValue: 5000,
    targetCard: {
      player: 'Victor Wembanyama',
      year: 2023,
      set: 'National Treasures',
      parallel: 'RPA /99',
      grade: 'BGS 9.5',
      estimatedValue: 5000,
    },
    bundleCards: createdCards.slice(3, 6).map((c) => ({
      cardId: c.id,
      currentValueAtPlanTime: c.currentValue,
      cardSnapshot: {
        player: c.player,
        year: c.year,
        set: c.series,
        parallel: c.parallel,
        grade: c.gradeValue ? `${c.gradeCompany} ${c.gradeValue}` : 'Raw',
      },
    })),
    cashAmount: 500,
    cashCurrency: 'USD',
    totalBundleValue: createdCards.slice(3, 6).reduce((sum: number, c: any) => sum + c.currentValue, 0) + 500,
    notes: 'Offered on Blowout Forums. Seller wants cash + cards. Waiting for response.',
    status: 'pending',
  });

  // Plan 2: Completed trade
  await TradePlanModel.create({
    userId,
    planName: 'Ohtani Chrome for Julio + Cash',
    targetValue: 950,
    targetCard: {
      player: 'Shohei Ohtani',
      year: 2018,
      set: 'Topps Chrome',
      parallel: 'Refractor',
      grade: 'PSA 10',
      estimatedValue: 950,
    },
    bundleCards: [{
      cardId: 'completed-trade-card',
      currentValueAtPlanTime: 600,
      cardSnapshot: {
        player: 'Julio Rodriguez',
        year: 2022,
        set: 'Topps Chrome',
        grade: 'PSA 10',
      },
    }],
    cashAmount: 350,
    cashCurrency: 'USD',
    totalBundleValue: 950,
    notes: 'Completed on eBay. Great deal!',
    status: 'completed',
    completedTransactionId: uuidv4(),
  });
  console.log('Created 2 trade plans');

  // ---- Summary ----
  const totalCards = await CardModel.countDocuments({ userId });
  const totalPlans = await TradePlanModel.countDocuments({ userId });

  console.log('\n=== Seed Complete ===');
  console.log(`User: ${demoEmail} (${userId})`);
  console.log(`Total cards: ${totalCards} (15 portfolio + 5 watchlist + 3 sold)`);
  console.log(`Trade plans: ${totalPlans}`);
  console.log(`Tier: UNLIMITED`);
  console.log(`\nDemo login: Use Email tab, enter "${demoEmail}", then enter OTP code "${process.env.DEMO_OTP_CODE || '(set DEMO_OTP_CODE)'}"`);

  await mongoose.disconnect();
  process.exit(0);
}

seedDemoData().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
