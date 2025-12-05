import React from 'react';
import { Card, Sport } from '../types';
import { TrendingUp, TrendingDown, Edit2, Trash2, Activity, CheckCircle2, Image as ImageIcon, StickyNote } from 'lucide-react';
import { GradeTag } from './GradeTag';

interface CardTableProps {
  cards: Card[];
  onUpdatePrice: (card: Card) => void;
  onEdit: (card: Card) => void;
  onDelete: (id: string) => void;
  onAnalyze: (card: Card) => void;
}

export const CardTable: React.FC<CardTableProps> = ({ cards, onUpdatePrice, onEdit, onDelete, onAnalyze }) => {
  
  const getSportColor = (sport: Sport) => {
    switch(sport) {
      case Sport.BASKETBALL: return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case Sport.BASEBALL: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case Sport.FOOTBALL: return 'bg-amber-700/10 text-amber-700 border-amber-700/20';
      case Sport.SOCCER: return 'bg-green-500/10 text-green-500 border-green-500/20';
      case Sport.POKEMON: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case Sport.F1: return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getCurrencySymbol = (currency: 'USD' | 'CNY') => currency === 'USD' ? '$' : '¥';

  if (cards.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
        <p className="text-slate-500 text-lg">Your collection is empty. Add your first card to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
            <th className="p-4 font-medium w-16">Img</th>
            <th className="p-4 font-medium">Card Information</th>
            <th className="p-4 font-medium">Details</th>
            <th className="p-4 font-medium text-right">Cost</th>
            <th className="p-4 font-medium text-right">Market / Sold</th>
            <th className="p-4 font-medium text-right">P/L</th>
            <th className="p-4 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {cards.map((card) => {
            const currentPrice = card.sold ? (card.soldPrice || 0) : card.currentValue;
            const profit = currentPrice - card.purchasePrice;
            const profitPercent = card.purchasePrice > 0 ? (profit / card.purchasePrice) * 100 : 0;
            const isProfit = profit >= 0;
            const symbol = getCurrencySymbol(card.currency);

            return (
              <tr key={card.id} className={`hover:bg-slate-800/30 transition-colors ${card.sold ? 'bg-slate-900/40 opacity-75' : ''}`}>
                <td className="p-4">
                  <div className="w-12 h-16 bg-slate-800 rounded-md overflow-hidden border border-slate-700 flex items-center justify-center">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.player} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={16} className="text-slate-600" />
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-slate-100 text-base">{card.player}</span>
                       {card.sold && <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold border border-emerald-500/30">SOLD</span>}
                    </div>
                    <div className="text-sm text-slate-400">{card.year} {card.brand}</div>
                    <div className="text-xs text-slate-500">{card.series} {card.cardType}</div>
                    {card.notes && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 italic">
                         <StickyNote size={10} />
                         <span className="truncate max-w-[150px]">{card.notes}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSportColor(card.sport)}`}>
                        {card.sport}
                    </span>
                    {card.serialNumber && (
                       <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-amber-200 border border-amber-500/30 font-mono">
                         {card.serialNumber}
                       </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-600 font-mono">
                      <GradeTag card={card} />
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="text-slate-300 font-mono">{symbol}{card.purchasePrice.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500">{card.purchaseDate}</div>
                </td>
                <td className="p-4 text-right">
                   <div className={`font-bold font-mono text-base ${card.sold ? 'text-emerald-300' : 'text-white'}`}>
                     {symbol}{currentPrice.toFixed(2)}
                   </div>
                   <div className="text-[10px] text-slate-500">
                      {card.sold 
                        ? `Sold: ${card.soldDate}` 
                        : (card.priceHistory.length > 0 
                            ? `Updated: ${new Date(card.priceHistory[card.priceHistory.length - 1].date).toLocaleDateString()}` 
                            : 'No history')
                      }
                   </div>
                </td>
                <td className="p-4 text-right">
                  <div className={`flex items-center justify-end gap-1 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {symbol}{Math.abs(profit).toFixed(2)}
                  </div>
                  <div className={`text-xs ${isProfit ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                    {profitPercent.toFixed(1)}%
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-1.5">
                    {!card.sold && (
                      <button 
                        onClick={() => onUpdatePrice(card)}
                        title="Update Daily Price"
                        className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded transition-colors"
                      >
                        <TrendingUp size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => onAnalyze(card)}
                      title="AI Insight"
                      className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded transition-colors"
                    >
                      <Activity size={14} />
                    </button>
                    <button 
                      onClick={() => onEdit(card)}
                      title="Edit"
                      className="p-1.5 bg-slate-800 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onDelete(card.id)}
                      title="Delete"
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};