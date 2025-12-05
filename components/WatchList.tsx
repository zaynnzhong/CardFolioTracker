
import React from 'react';
import { Card, Sport } from '../types';
import { Eye, Bell, ShoppingBag, TrendingDown, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { GradeTag } from './GradeTag';

interface WatchListProps {
  cards: Card[];
  onSelect: (card: Card) => void;
  onConvertToAsset: (card: Card) => void;
  onUpdatePrice: (card: Card) => void;
}

export const WatchList: React.FC<WatchListProps> = ({ cards, onSelect, onConvertToAsset, onUpdatePrice }) => {
  if (cards.length === 0) return null;

  return (
    <div className="w-full pb-8 mt-6">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
           <Eye size={14} /> Watchlist
        </h3>
        <span className="text-slate-600 text-xs">{cards.length} Tracking</span>
      </div>
      
      <div className="flex flex-col gap-3 px-4">
        {cards.map((card) => {
          const symbol = card.currency === 'USD' ? '$' : '¥';
          const isTargetMet = card.currentValue <= card.purchasePrice && card.purchasePrice > 0;
          const distanceToTarget = card.purchasePrice > 0 
            ? ((card.currentValue - card.purchasePrice) / card.purchasePrice) * 100 
            : 0;

          // Simple data for sparkline
          const sparkData = card.priceHistory.map((p, i) => ({ i, value: p.value }));
          // Add current
          if (sparkData.length === 0 || card.priceHistory[card.priceHistory.length -1].value !== card.currentValue) {
             sparkData.push({ i: sparkData.length, value: card.currentValue });
          }

          return (
            <div
              key={card.id}
              onClick={() => onSelect(card)}
              className="relative bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3 transition-all group overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10"
            >
              {/* Left Stripe for status with glow effect */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isTargetMet ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500/30'}`} />

              <div className="flex items-center gap-3 pl-2">
                {/* Larger Card Thumbnail */}
                <div className="relative w-16 h-22 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700 group-hover:border-indigo-500/30 transition-all shadow-lg">
                    {card.imageUrl && <img src={card.imageUrl} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Card Info - Horizontal Layout */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: Year Brand Insert */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs text-slate-300 truncate font-semibold">
                      {card.year} {card.brand}
                      {card.insert && ` ${card.insert}`}
                    </h4>
                    {isTargetMet && (
                      <span className="text-[10px] bg-gradient-to-r from-emerald-500 to-emerald-400 text-black px-2 py-0.5 rounded-full font-bold shadow-lg shadow-emerald-500/50 animate-pulse whitespace-nowrap">
                        BUY ZONE
                      </span>
                    )}
                  </div>

                  {/* Row 2: Set Parallel Serial */}
                  <div className="text-[11px] text-slate-400 mb-1.5 truncate">
                    {card.series && <span>{card.series}</span>}
                    {card.series && (card.parallel || card.serialNumber) && <span className="mx-1">•</span>}
                    {card.parallel && <span>{card.parallel}</span>}
                    {card.parallel && card.serialNumber && <span className="mx-1">•</span>}
                    {card.serialNumber && <span>{card.serialNumber}</span>}
                  </div>

                  {/* Row 3: Player name - more prominent */}
                  <div className="text-base text-white mb-2 truncate font-bold">
                    {card.player}
                  </div>

                  {/* Grade badge and Prices in one row */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <GradeTag card={card} />

                    {/* Divider */}
                    <span className="text-slate-700 text-sm">|</span>

                    {/* Inline Prices */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Market:</span>
                        <span className="text-sm font-mono text-white font-bold">{symbol}{card.currentValue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Target:</span>
                        <span className="text-sm font-mono text-emerald-400 font-bold">{card.purchasePrice > 0 ? `${symbol}${card.purchasePrice.toLocaleString()}` : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status indicator at bottom */}
                  <div className="flex items-center gap-2 mt-2">
                    {isTargetMet ? (
                      <span className="text-emerald-400 flex items-center gap-1.5 text-[11px] font-medium">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        Price is good
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1.5 text-[11px] font-medium">
                        <TrendingUp size={12} />
                        {distanceToTarget.toFixed(1)}% over target
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onConvertToAsset(card); }}
                    className="bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white p-2 rounded-lg shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 hover:shadow-emerald-500/50"
                    title="I bought this"
                  >
                    <ShoppingBag size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdatePrice(card); }}
                    className="bg-indigo-500/20 hover:bg-gradient-to-br hover:from-indigo-600 hover:to-indigo-500 text-indigo-400 hover:text-white p-2 rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 transition-all hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-indigo-500/30"
                    title="Update Price"
                  >
                    <Bell size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
