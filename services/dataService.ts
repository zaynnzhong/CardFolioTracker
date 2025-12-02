import { Card } from "../types";

// Use relative URL in production, localhost in development
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

// Helper to get auth headers
const getAuthHeaders = async (getIdToken: () => Promise<string | null>) => {
  const token = await getIdToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const dataService = {
  async getCards(getIdToken: () => Promise<string | null>): Promise<Card[]> {
    try {
      const headers = await getAuthHeaders(getIdToken);
      const res = await fetch(`${API_URL}/cards`, { headers });
      if (!res.ok) throw new Error('Failed to fetch cards');
      return await res.json();
    } catch (e) {
      console.error("API Error", e);
      return [];
    }
  },

  async saveCard(card: Card, getIdToken: () => Promise<string | null>): Promise<Card> {
    const headers = await getAuthHeaders(getIdToken);
    const res = await fetch(`${API_URL}/cards`, {
      method: 'POST',
      headers,
      body: JSON.stringify(card)
    });
    return await res.json();
  },

  async deleteCard(id: string, getIdToken: () => Promise<string | null>): Promise<void> {
    const headers = await getAuthHeaders(getIdToken);
    await fetch(`${API_URL}/cards/${id}`, {
      method: 'DELETE',
      headers
    });
  },

  async updatePrice(id: string, newPrice: number, getIdToken: () => Promise<string | null>, dateStr?: string): Promise<Card | null> {
    const headers = await getAuthHeaders(getIdToken);
    const res = await fetch(`${API_URL}/cards/${id}/price`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ price: newPrice, date: dateStr })
    });
    if (!res.ok) return null;
    return await res.json();
  }
};