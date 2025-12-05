
export interface PricePoint {
  date: string; // ISO String
  value: number;
  platform?: string; // Platform where this price was observed
  parallel?: string; // Parallel (e.g., Silver, Red, Purple Ice, Base)
  grade?: string; // Grade (e.g., PSA 10, BGS 10, PSA 10+10, Raw)
  serialNumber?: string; // Serial number of the comp (e.g., 15/99, 1/1)
}

export interface Offer {
  id: string;
  offerPrice: number;
  platform: string; // e.g., eBay, Wecard, Xianyu, Instagram, Other
  senderName: string;
  date: string; // ISO String
  notes?: string;
}

export enum Sport {
  BASKETBALL = 'Basketball',
  BASEBALL = 'Baseball',
  FOOTBALL = 'Football',
  SOCCER = 'Soccer',
  POKEMON = 'Pokemon',
  F1 = 'F1',
  OTHER = 'Other',
}

export type Currency = 'USD' | 'CNY';

export enum AcquisitionSource {
  SELF_RIP = 'Self Rip (Case/Box)',
  BREAK = 'Break',
  EBAY = 'eBay',
  CARD_HOBBY = 'CardHobby',
  WECARD = 'Wecard',
  XIANYU = 'Xianyu',
  CARD_SHOW = 'Card Show',
  ALT = 'Alt',
  FANATICS = 'Fanatics',
  PWCC = 'PWCC',
  OTHER = 'Other'
}

export enum Platform {
  EBAY = 'eBay',
  CARD_HOBBY = 'CardHobby',
  XIANYU = 'Xianyu',
  CARD_SHOW = 'Card Show',
  ALT = 'Alt',
  FANATICS = 'Fanatics',
  PWCC = 'PWCC',
  GOLDIN = 'Goldin',
  HERITAGE = 'Heritage',
  WECARD = 'Wecard',
  OTHER = 'Other'
}

export interface Card {
  id: string;

  // Visual
  imageUrl?: string; // Base64 string

  // Core Details
  player: string;
  year: number;
  sport: Sport;
  brand: string;   // e.g. Panini Prizm
  series: string;  // e.g. National Treasures, Flawless
  insert: string;  // e.g. RPA, Base, Auto
  parallel?: string; // e.g. Silver, Purple Ice, Red, Gold (THIS is what distinguishes price)
  serialNumber?: string; // e.g. 15/99

  // Grading
  graded: boolean;
  gradeCompany?: string; // PSA, BGS, SGC, CGC
  gradeValue?: string;   // 10, 9.5
  autoGrade?: string;    // Auto grade for card+auto (10, 9, etc)
  certNumber?: string;

  // Economics
  currency: Currency;
  purchaseDate: string;
  purchasePrice: number; // For Watchlist items, this is the Target Price
  acquisitionSource?: AcquisitionSource;
  acquisitionSourceOther?: string; // For when source is 'Other'

  // Current Status (Unsold)
  currentValue: number; // Can be -1 to indicate "Unknown/Unsure"
  priceHistory: PricePoint[];
  offers?: Offer[]; // Pending offers received

  // Sales (Sold)
  sold: boolean;
  soldDate?: string;
  soldPrice?: number;
  soldVia?: 'sale' | 'trade'; // How the card was disposed of

  // Watchlist Status
  watchlist?: boolean;

  // Bulk Entry Grouping
  bulkGroupId?: string; // Links cards added together in bulk mode

  notes?: string;
}

export interface TransactionLine {
  direction: 'OUT' | 'IN';
  item: string; // Card description or "Cash"
  bookedAs: 'Taxable SALE' | 'New PURCHASE' | 'Cash received' | 'Cash paid';
  amountFMV: number;
  costBasis?: number;
  realizedGainLoss?: number;
  cardId?: string; // Reference to card if applicable
}

export interface Transaction {
  id: string;
  date: string;
  type: 'sale' | 'trade';
  lines: TransactionLine[];
  notes?: string;
}

export interface Stats {
  totalInvested: { USD: number; CNY: number };
  currentPortfolioValue: { USD: number; CNY: number }; // Only unsold
  unrealizedProfit: { USD: number; CNY: number }; // Paper profit
  realizedProfit: { USD: number; CNY: number }; // Cash profit from sold
  soldTotal: { USD: number; CNY: number };
  cash: { USD: number; CNY: number }; // Net cash position: Total Invested + Realized P/L
  cardCount: number;
}
