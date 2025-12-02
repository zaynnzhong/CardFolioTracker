import React from 'react';
import { Card, Sport } from '../types';
import { TrendingUp, TrendingDown, Image as ImageIcon, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';

interface CardListProps {
  cards: Card[];
  onSelect: (card: Card) => void;
}

export const CardList: React.FC<CardListProps> = ({ cards, onSelect }) => {
  const getSportColor = (sport: Sport) => {
    switch (sport) {
      case Sport.BASKETBALL: return 'text-orange-400 bg-orange-500/10';
      case Sport.BASEBALL: return 'text-blue-400 bg-blue-500/10';
      case Sport.FOOTBALL: return 'text-amber-400 bg-amber-500/10';
      case Sport.SOCCER: return 'text-green-400 bg-green-500/10';
      case Sport.POKEMON: return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-emerald-500/20">
          <Sparkles className="text-emerald-400" size={32} />
        </div>
        <h3 className="text-white font-bold text-xl">No assets yet</h3>
        <p className="text-slate-400 mt-2 max-w-xs">Add your first card to start building your portfolio.</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-24">
      <div className="px-4 mb-4 flex justify-between items-end">
        <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Your Assets</h3>
        <span className="text-slate-500 text-xs font-semibold">{cards.length} Items</span>
      </div>

      <div className="flex flex-col gap-2 px-4">
        {cards.map((card) => {
          const profit = (card.sold ? (card.soldPrice || 0) : card.currentValue) - card.purchasePrice;
          const profitPercent = card.purchasePrice > 0 ? (profit / card.purchasePrice) * 100 : 0;
          const isProfit = profit >= 0;
          const symbol = card.currency === 'USD' ? '$' : '¥';

          return (
            <div
              key={card.id}
              onClick={() => onSelect(card)}
              className="group relative flex items-center justify-between p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-emerald-500/30 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 rounded-2xl transition-all duration-300 pointer-events-none" />

              <div className="relative flex items-center gap-4 flex-1">
                {/* Image / Icon */}
                <div className="relative w-14 h-18 bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 flex-shrink-0 shadow-lg">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.player} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  {card.sold && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-white font-bold text-base leading-tight truncate">
                    {card.year} {card.brand} {card.series} {card.sport} {card.cardType} {card.player} {card.serialNumber || ''}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getSportColor(card.sport)}`}>
                      {card.player}
                    </span>
                  </div>
                  {card.graded && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit mt-1.5 font-semibold">
                      {card.gradeCompany} {card.gradeValue}
                    </span>
                  )}
                </div>
              </div>

              {/* Price / Change */}
              <div className="relative flex flex-col items-end gap-1.5 ml-2">
                <span className={`font-mono font-bold text-base ${card.sold ? 'text-slate-400' : 'text-white'}`}>
                  {symbol}{card.sold ? (card.soldPrice || 0).toLocaleString() : card.currentValue.toLocaleString()}
                </span>

                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-sm ${isProfit
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                  {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(profitPercent).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};