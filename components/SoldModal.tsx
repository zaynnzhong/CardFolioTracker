import React, { useState } from 'react';
import { Card, Platform } from '../types';
import { X, DollarSign, Calendar } from 'lucide-react';

interface SoldModalProps {
  card: Card;
  onSave: (cardId: string, soldPrice: number, soldDate: string, platform: Platform) => void;
  onCancel: () => void;
}

export const SoldModal: React.FC<SoldModalProps> = ({ card, onSave, onCancel }) => {
  const [soldPrice, setSoldPrice] = useState<string>(
    card.currentValue !== -1 ? card.currentValue.toString() : card.purchasePrice.toString()
  );
  const [soldDate, setSoldDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState<Platform>(Platform.EBAY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(soldPrice);
    if (!isNaN(price) && price >= 0) {
      onSave(card.id, price, soldDate, platform);
    }
  };

  const symbol = card.currency === 'USD' ? '$' : '¥';
  const profit = parseFloat(soldPrice) - card.purchasePrice;
  const profitPercent = card.purchasePrice > 0 ? (profit / card.purchasePrice) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900/95 border border-slate-800/50 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="text-emerald-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Mark as Sold</h2>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Card Info */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
            <p className="text-slate-500 text-xs uppercase font-semibold mb-1.5 tracking-wide">Card</p>
            <p className="text-white font-semibold text-sm">{card.year} {card.brand} {card.player}</p>
            {card.series && <p className="text-slate-400 text-xs mt-0.5">{card.series} - {card.insert}</p>}
            {card.parallel && <p className="text-emerald-400 text-xs mt-0.5 font-semibold">{card.parallel}</p>}
            {card.graded && (
              <p className="text-blue-400 text-xs mt-1 font-semibold">
                {card.gradeCompany} {card.gradeValue}
              </p>
            )}
          </div>

          {/* Cost Basis Reference */}
          <div className="bg-slate-800/30 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">Cost Basis</span>
              <span className="text-sm font-mono font-semibold text-slate-300">
                {symbol}{card.purchasePrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Sold Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Sold Price ({card.currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="0.00"
              autoFocus
            />
          </div>

          {/* Profit/Loss Preview */}
          {soldPrice && !isNaN(parseFloat(soldPrice)) && (
            <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: profit >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                  {profit >= 0 ? 'Profit' : 'Loss'}
                </span>
                <div className="text-right">
                  <div className={`text-lg font-mono font-bold ${profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {profit >= 0 ? '+' : ''}{symbol}{Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-xs font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {profit >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sale Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                Sale Date
              </div>
            </label>
            <input
              type="date"
              required
              value={soldDate}
              onChange={(e) => setSoldDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              {Object.values(Platform).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              Confirm Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
