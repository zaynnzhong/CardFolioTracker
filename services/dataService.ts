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

  async updatePrice(id: string, newPrice: number, getIdToken: () => Promise<string | null>, dateStr?: string, platform?: string, parallel?: string, grade?: string, serialNumber?: string): Promise<Card | null> {
    const headers = await getAuthHeaders(getIdToken);
    console.log('[dataService] Sending updatePrice request:', { id, price: newPrice, date: dateStr, platform, parallel, grade, serialNumber });
    const res = await fetch(`${API_URL}/cards/${id}/price`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ price: newPrice, date: dateStr, platform, parallel, grade, serialNumber })
    });
    if (!res.ok) return null;
    const result = await res.json();
    console.log('[dataService] updatePrice response:', result);
    return result;
  },

  async deletePriceEntry(id: string, priceDate: string, getIdToken: () => Promise<string | null>): Promise<Card | null> {
    const headers = await getAuthHeaders(getIdToken);
    console.log('[dataService] Sending deletePriceEntry request:', { id, priceDate });
    const res = await fetch(`${API_URL}/cards/${id}/price/${encodeURIComponent(priceDate)}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) return null;
    const result = await res.json();
    console.log('[dataService] deletePriceEntry response:', result);
    return result;
  },

  async editPriceEntry(id: string, oldDate: string, newPrice: number, getIdToken: () => Promise<string | null>, newDate?: string, platform?: string, parallel?: string, grade?: string, serialNumber?: string): Promise<Card | null> {
    const headers = await getAuthHeaders(getIdToken);
    console.log('[dataService] Sending editPriceEntry request:', { id, oldDate, newPrice, newDate, platform, parallel, grade, serialNumber });
    const res = await fetch(`${API_URL}/cards/${id}/price/${encodeURIComponent(oldDate)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ price: newPrice, date: newDate, platform, parallel, grade, serialNumber })
    });
    if (!res.ok) return null;
    const result = await res.json();
    console.log('[dataService] editPriceEntry response:', result);
    return result;
  }
};