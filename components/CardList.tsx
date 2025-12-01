import React from 'react';
import { Card, Sport } from '../types';
import { TrendingUp, TrendingDown, Image as ImageIcon, ChevronRight, CheckCircle2 } from 'lucide-react';

interface CardListProps {
  cards: Card[];
  onSelect: (card: Card) => void;
}

export const CardList: React.FC<CardListProps> = ({ cards, onSelect }) => {
  const getSportColor = (sport: Sport) => {
    switch(sport) {
      case Sport.BASKETBALL: return 'text-orange-500';
      case Sport.BASEBALL: return 'text-blue-500';
      case Sport.FOOTBALL: return 'text-amber-600';
      case Sport.SOCCER: return 'text-green-500';
      case Sport.POKEMON: return 'text-yellow-500';
      default: return 'text-slate-500';
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="text-slate-600" />
        </div>
        <h3 className="text-white font-bold text-lg">No assets yet</h3>
        <p className="text-slate-500 mt-1 max-w-xs">Add your first card to start building your portfolio.</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-24">
      <div className="px-4 mb-2 flex justify-between items-end">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Your Assets</h3>
        <span className="text-slate-600 text-xs">{cards.length} Items</span>
      </div>
      
      <div className="flex flex-col">
        {cards.map((card) => {
          const profit = (card.sold ? (card.soldPrice || 0) : card.currentValue) - card.purchasePrice;
          const profitPercent = card.purchasePrice > 0 ? (profit / card.purchasePrice) * 100 : 0;
          const isProfit = profit >= 0;
          const symbol = card.currency === 'USD' ? '$' : '¥';

          return (
            <div 
              key={card.id} 
              onClick={() => onSelect(card)}
              className="flex items-center justify-between p-4 border-b border-slate-900 bg-slate-950 hover:bg-slate-900 transition-colors cursor-pointer active:bg-slate-900 group"
            >
              <div className="flex items-center gap-4">
                {/* Image / Icon */}
                <div className="relative w-12 h-16 bg-slate-900 rounded-md overflow-hidden border border-slate-800 flex-shrink-0">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.player} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  {card.sold && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col">
                  <span className="text-white font-bold text-base leading-tight">{card.player}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold uppercase ${getSportColor(card.sport)}`}>{card.sport}</span>
                    <span className="text-xs text-slate-500">{card.year} {card.brand}</span>
                  </div>
                  {card.graded && (
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded w-fit mt-1">
                      {card.gradeCompany} {card.gradeValue}
                    </span>
                  )}
                </div>
              </div>

              {/* Price / Change */}
              <div className="flex flex-col items-end gap-1">
                <span className={`font-mono font-bold text-base ${card.sold ? 'text-slate-400' : 'text-white'}`}>
                  {symbol}{card.sold ? (card.soldPrice || 0).toLocaleString() : card.currentValue.toLocaleString()}
                </span>
                
                <div className={`flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${isProfit ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                  {isProfit ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
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