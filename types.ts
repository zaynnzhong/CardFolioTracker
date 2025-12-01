export interface PricePoint {
  date: string; // ISO String
  value: number;
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

export interface Card {
  id: string;
  
  // Visual
  imageUrl?: string; // Base64 string

  // Core Details
  player: string;
  year: number;
  sport: Sport;
  brand: string;   // e.g. Panini Prizm
  series: string;  // e.g. Silver Prizm, Mojo
  cardType: string; // e.g. RPA, Base, Insert
  serialNumber?: string; // e.g. 15/99

  // Grading
  graded: boolean;
  gradeCompany?: string; // PSA, BGS, SGC, CGC
  gradeValue?: string;   // 10, 9.5
  certNumber?: string;

  // Economics
  currency: Currency;
  purchaseDate: string;
  purchasePrice: number;
  
  // Current Status (Unsold)
  currentValue: number;
  priceHistory: PricePoint[];
  
  // Sales (Sold)
  sold: boolean;
  soldDate?: string;
  soldPrice?: number;

  notes?: string;
}

export interface Stats {
  totalInvested: { USD: number; CNY: number };
  currentPortfolioValue: { USD: number; CNY: number }; // Only unsold
  unrealizedProfit: { USD: number; CNY: number }; // Paper profit
  realizedProfit: { USD: number; CNY: number }; // Cash profit from sold
  soldTotal: { USD: number; CNY: number };
  cardCount: number;
}