import React, { useState } from 'react';
import { Card } from '../types';
import { X, TrendingUp, Calendar, Info } from 'lucide-react';

interface PriceUpdateModalProps {
  card: Card;
  onSave: (cardId: string, newPrice: number, date: string) => void;
  onCancel: () => void;
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({ card, onSave, onCancel }) => {
  const [newPrice, setNewPrice] = useState<string>(card.currentValue.toString());
  const [priceDate, setPriceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      onSave(card.id, price, priceDate);
    }
  };

  const isWatchlist = card.watchlist;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            {isWatchlist ? 'Log Market Sale' : 'Update Valuation'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <p className="text-slate-500 text-xs uppercase font-bold mb-1">Card Subject</p>
            <p className="text-white font-medium text-sm">{card.year} {card.brand} {card.player}</p>
            {card.series && <p className="text-slate-400 text-xs">{card.series}</p>}
          </div>

          <div className="mb-4 flex items-start gap-2 bg-blue-500/10 p-2 rounded text-blue-300 text-xs">
             <Info size={14} className="flex-shrink-0 mt-0.5" />
             <p>
               {isWatchlist 
                 ? "Saw this card sell recently? Log the price and date to track market trends."
                 : "Update your asset's current estimated value based on a recent market comparable (Comp)."}
             </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                Sold Price ({card.currency})
              </label>
              <input 
                type="number"
                step="0.01"
                autoFocus
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-2xl font-mono text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="col-span-2">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                 <Calendar size={12} /> Date of Sale
               </label>
               <input 
                 type="date"
                 value={priceDate}
                 onChange={(e) => setPriceDate(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
               />
            </div>
          </div>

          <div className="flex gap-3">
             <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-lg text-slate-300 hover:bg-slate-800 font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-colors text-sm"
            >
              Log Price
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};