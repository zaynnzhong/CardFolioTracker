import { Card } from "../types";

// This service mimics a backend API.
// To use a real backend (Firebase/Supabase), replace the implementation of these functions.

const STORAGE_KEY = 'cardfolio_data_v2';

// Simulate network delay for realistic feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dataService = {
  async getCards(): Promise<Card[]> {
    await delay(300); // Simulate API latency
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Data corruption", e);
      return [];
    }
  },

  async saveCard(card: Card): Promise<Card> {
    await delay(300);
    const cards = await this.getCards();
    const index = cards.findIndex(c => c.id === card.id);
    
    let newCards;
    if (index >= 0) {
      newCards = cards.map(c => c.id === card.id ? card : c);
    } else {
      newCards = [...cards, card];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
    return card;
  },

  async deleteCard(id: string): Promise<void> {
    await delay(300);
    const cards = await this.getCards();
    const newCards = cards.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
  },

  async updatePrice(id: string, newPrice: number, dateStr?: string): Promise<Card | null> {
    await delay(200);
    const cards = await this.getCards();
    const card = cards.find(c => c.id === id);
    if (!card) return null;

    const history = [...card.priceHistory];
    const newDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
    const inputDateShort = newDate.split('T')[0];
    
    // Check if we already have an entry for this specific date
    const existingIndex = history.findIndex(h => h.date.split('T')[0] === inputDateShort);

    if (existingIndex >= 0) {
       // Update existing entry for that day
       history[existingIndex].value = newPrice;
    } else {
       // Add new entry
       history.push({ date: newDate, value: newPrice });
    }

    // Sort history by date to ensure graphs are correct
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Only update currentValue if the new date is the most recent (or today)
    // If user is backfilling old data, we might not want to change currentValue.
    // However, for simplicity in this app, we usually treat the user's manual update as the "current" truth
    // unless the date is explicitly in the past compared to the last known date.
    const lastHistoryDate = new Date(history[history.length - 1].date).getTime();
    const newEntryDate = new Date(newDate).getTime();
    
    const shouldUpdateCurrent = newEntryDate >= lastHistoryDate;

    const updatedCard = {
      ...card,
      currentValue: shouldUpdateCurrent ? newPrice : card.currentValue,
      priceHistory: history
    };

    const newCards = cards.map(c => c.id === id ? updatedCard : c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
    
    return updatedCard;
  }
};