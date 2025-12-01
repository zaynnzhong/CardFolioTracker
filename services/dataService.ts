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

  async updatePrice(id: string, newPrice: number): Promise<Card | null> {
    await delay(200);
    const cards = await this.getCards();
    const card = cards.find(c => c.id === id);
    if (!card) return null;

    const history = [...card.priceHistory];
    const today = new Date().toISOString().split('T')[0];
    const lastDate = history.length > 0 ? history[history.length - 1].date.split('T')[0] : '';
    
    if (lastDate === today) {
       history[history.length - 1].value = newPrice;
    } else {
       history.push({ date: new Date().toISOString(), value: newPrice });
    }

    const updatedCard = {
      ...card,
      currentValue: newPrice,
      priceHistory: history
    };

    const newCards = cards.map(c => c.id === id ? updatedCard : c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
    
    return updatedCard;
  }
};