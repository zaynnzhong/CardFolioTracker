import React, { useState } from 'react';
import { Card } from '../types';
import { X, TrendingUp } from 'lucide-react';

interface PriceUpdateModalProps {
  card: Card;
  onSave: (cardId: string, newPrice: number) => void;
  onCancel: () => void;
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({ card, onSave, onCancel }) => {
  const [newPrice, setNewPrice] = useState<string>(card.currentValue.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      onSave(card.id, price);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Update Price
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-slate-400 text-sm mb-1">Card</p>
            <p className="text-white font-medium">{card.year} {card.brand} {card.name}</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-emerald-400 mb-2">New Market Value ($)</label>
            <input 
              type="number"
              step="0.01"
              autoFocus
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-2xl font-mono text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex gap-3">
             <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};