import React, { useState } from 'react';
import { Card, Platform } from '../types';
import { X, TrendingUp, Calendar, Info } from 'lucide-react';

interface PriceUpdateModalProps {
  card: Card;
  onSave: (cardId: string, newPrice: number, date: string, platform?: string, parallel?: string, grade?: string, serialNumber?: string) => void;
  onCancel: () => void;
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({ card, onSave, onCancel }) => {
  const [newPrice, setNewPrice] = useState<string>(card.currentValue.toString());
  const [priceDate, setPriceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState<Platform>(Platform.EBAY);
  const [parallel, setParallel] = useState<string>(card.parallel || '');
  const [grade, setGrade] = useState<string>('Raw');
  const [serialNumber, setSerialNumber] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      console.log('[PriceUpdateModal] Submitting:', { cardId: card.id, price, priceDate, platform, parallel, grade, serialNumber });
      onSave(card.id, price, priceDate, platform, parallel, grade, serialNumber || undefined);
    }
  };

  const isWatchlist = card.watchlist;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900/95 border border-slate-800/50 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            {isWatchlist ? 'Log Market Sale' : 'Update Value'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
            <p className="text-slate-500 text-xs uppercase font-semibold mb-1.5 tracking-wide">Card</p>
            <p className="text-white font-semibold text-sm">{card.year} {card.brand} {card.player}</p>
            {card.series && <p className="text-slate-400 text-xs mt-0.5">{card.series}</p>}
            {card.parallel && <p className="text-emerald-400 text-xs mt-0.5 font-semibold">My Parallel: {card.parallel}</p>}
          </div>

          <div className="flex items-start gap-2 bg-blue-500/10 p-3 rounded-xl text-blue-300 text-xs border border-blue-500/20">
             <Info size={14} className="flex-shrink-0 mt-0.5" />
             <p>
               {isWatchlist
                 ? "Log a recent sale to track market trends."
                 : "Update your asset's value based on a recent comparable."}
             </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {Object.values(Platform).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Calendar size={12} /> Date
                </label>
                <input
                  type="date"
                  value={priceDate}
                  onChange={(e) => setPriceDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Parallel
                </label>
                <input
                  type="text"
                  value={parallel}
                  onChange={(e) => setParallel(e.target.value)}
                  placeholder="e.g., Silver, Purple Ice"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Grade
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g., PSA 10, Raw"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Serial Number (Optional)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g., 15/99, 1/1"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">
                Price ({card.currency})
              </label>
              <input
                type="number"
                step="0.01"
                autoFocus
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
             <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};