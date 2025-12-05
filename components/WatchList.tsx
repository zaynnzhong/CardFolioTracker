
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
              className="relative bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all group overflow-hidden"
            >
              {/* Left Stripe for status */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isTargetMet ? 'bg-emerald-500' : 'bg-slate-700'}`} />

              <div className="flex justify-between items-start pl-2">
                <div className="flex gap-3">
                    {/* Small Thumb */}
                    <div className="w-10 h-14 bg-slate-800 rounded overflow-hidden flex-shrink-0 border border-slate-700">
                        {card.imageUrl && <img src={card.imageUrl} className="w-full h-full object-cover opacity-80" />}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-slate-200 text-sm">{card.year} {card.brand} {card.player}</h4>
                             {isTargetMet && <span className="text-[10px] bg-emerald-500 text-black px-1.5 rounded font-bold">BUY ZONE</span>}
                        </div>

                        {/* Series and Insert */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                          {card.series && <span>{card.series}</span>}
                          {card.series && card.insert && <span>•</span>}
                          {card.insert && <span>{card.insert}</span>}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {card.parallel && (
                            <span className="px-2 py-0.5 bg-crypto-lime/10 border border-crypto-lime/30 rounded text-crypto-lime text-[10px] font-semibold">
                              {card.parallel}
                            </span>
                          )}
                          {card.serialNumber && (
                            <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded text-purple-300 text-[10px] font-semibold">
                              #{card.serialNumber}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] font-semibold">
                            <GradeTag card={card} />
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase">Current</span>
                                <span className="text-sm font-mono text-white font-bold">{symbol}{card.currentValue}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase">Target</span>
                                <span className="text-sm font-mono text-slate-400">{card.purchasePrice > 0 ? `${symbol}${card.purchasePrice}` : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-col items-end gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onConvertToAsset(card); }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-95"
                        title="I bought this"
                    >
                        <ShoppingBag size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUpdatePrice(card); }}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white p-2 rounded-full transition-colors"
                        title="Update Price"
                    >
                        <Bell size={14} />
                    </button>
                </div>
              </div>

              {/* Sparkline & Distance */}
              <div className="mt-3 pl-2 flex items-center justify-between">
                 <div className="flex items-center gap-1 text-[10px]">
                    {isTargetMet ? (
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10} /> Price is good</span>
                    ) : (
                        <span className="text-rose-400">{distanceToTarget.toFixed(1)}% over target</span>
                    )}
                 </div>
                 
                 <div className="w-24 h-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData}>
                            <defs>
                                <linearGradient id="gradWatch" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={1} fill="url(#gradWatch)" />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
