import { Card } from "../types";

// Use relative URL in production, localhost in development
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

export const getMarketInsight = async (card: Card): Promise<string> => {
  try {
    const res = await fetch(`${API_URL}/gemini/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card })
    });

    if (!res.ok) throw new Error('Failed to fetch insight');
    const data = await res.json();
    return data.insight;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to fetch market insights at this moment. Please try again later.";
  }
};