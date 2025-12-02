import { Card } from "../types";

// Use relative URL in production, localhost in development
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

export const dataService = {
  async getCards(): Promise<Card[]> {
    try {
      const res = await fetch(`${API_URL}/cards`);
      if (!res.ok) throw new Error('Failed to fetch cards');
      return await res.json();
    } catch (e) {
      console.error("API Error", e);
      return [];
    }
  },

  async saveCard(card: Card): Promise<Card> {
    const res = await fetch(`${API_URL}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    });
    return await res.json();
  },

  async deleteCard(id: string): Promise<void> {
    await fetch(`${API_URL}/cards/${id}`, { method: 'DELETE' });
  },

  async updatePrice(id: string, newPrice: number, dateStr?: string): Promise<Card | null> {
    const res = await fetch(`${API_URL}/cards/${id}/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: newPrice, date: dateStr })
    });
    if (!res.ok) return null;
    return await res.json();
  }
};