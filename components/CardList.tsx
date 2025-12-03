import React, { useState, useMemo } from 'react';
import { Card, Sport } from '../types';
import { TrendingUp, TrendingDown, Image as ImageIcon, ChevronRight, CheckCircle2, Sparkles, Filter, ArrowUpDown } from 'lucide-react';

interface CardListProps {
  cards: Card[];
  onSelect: (card: Card) => void;
}

type SortOption = 'price-high' | 'price-low' | 'trend-up' | 'trend-down';

export const CardList: React.FC<CardListProps> = ({ cards, onSelect }) => {
  const [filterPlayer, setFilterPlayer] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('price-high');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique players for filter dropdown
  const uniquePlayers = useMemo(() => {
    const players = [...new Set(cards.map(c => c.player))].sort();
    return players;
  }, [cards]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let filtered = [...cards];

    // Apply player filter
    if (filterPlayer) {
      filtered = filtered.filter(c => c.player === filterPlayer);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a.sold ? (a.soldPrice || 0) : (a.currentValue === -1 ? 0 : a.currentValue);
      const bValue = b.sold ? (b.soldPrice || 0) : (b.currentValue === -1 ? 0 : b.currentValue);
      const aProfit = aValue - a.purchasePrice;
      const bProfit = bValue - b.purchasePrice;
      const aProfitPercent = a.purchasePrice > 0 ? (aProfit / a.purchasePrice) * 100 : 0;
      const bProfitPercent = b.purchasePrice > 0 ? (bProfit / b.purchasePrice) * 100 : 0;

      switch (sortBy) {
        case 'price-high':
          return bValue - aValue; // High to low
        case 'price-low':
          return aValue - bValue; // Low to high
        case 'trend-up':
          return bProfitPercent - aProfitPercent; // Best trending first
        case 'trend-down':
          return aProfitPercent - bProfitPercent; // Worst trending first
        default:
          return 0;
      }
    });

    return filtered;
  }, [cards, filterPlayer, sortBy]);

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
      <div className="px-5 mb-3">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Holdings</h3>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-medium">{filteredAndSortedCards.length}</span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl p-3 mb-3 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Filter by Player
              </label>
              <select
                value={filterPlayer}
                onChange={(e) => setFilterPlayer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">All Players</option>
                {uniquePlayers.map(player => (
                  <option key={player} value={player}>{player}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
                <ArrowUpDown size={12} /> Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="trend-up">Trending: Best First</option>
                <option value="trend-down">Trending: Worst First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4">
        {filteredAndSortedCards.map((card) => {
          const profit = (card.sold ? (card.soldPrice || 0) : card.currentValue) - card.purchasePrice;
          const profitPercent = card.purchasePrice > 0 ? (profit / card.purchasePrice) * 100 : 0;
          const isProfit = profit >= 0;
          const symbol = card.currency === 'USD' ? '$' : '¥';

          return (
            <div
              key={card.id}
              onClick={() => onSelect(card)}
              className="group relative flex items-start justify-between p-4 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-200 cursor-pointer active:scale-[0.99]"
            >
              <div className="relative flex items-start gap-3 flex-1 min-w-0">
                {/* Image / Icon */}
                <div className="relative w-16 h-20 bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50 flex-shrink-0 shadow-md">
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
                <div className="flex flex-col flex-1 min-w-0 gap-1">
                  <span className="text-white font-semibold text-sm leading-tight line-clamp-2">
                    {card.year} {card.brand} {card.series} {card.sport} {card.cardType} {card.player} {card.serialNumber || ''}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${getSportColor(card.sport)}`}>
                      {card.player}
                    </span>
                    {card.graded && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold">
                        {card.gradeCompany} {card.gradeValue}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price / Change */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                {card.currentValue === -1 && !card.sold ? (
                  <>
                    <span className="font-mono font-bold text-lg text-amber-400">Unknown</span>
                    <span className="text-xs font-medium text-amber-400/60">?</span>
                  </>
                ) : (
                  <>
                    <span className={`font-mono font-bold text-lg ${card.sold ? 'text-slate-400' : 'text-white'}`}>
                      {symbol}{card.sold ? (card.soldPrice || 0).toLocaleString() : card.currentValue.toLocaleString()}
                    </span>

                    <div className={`flex items-center gap-1 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="text-sm font-semibold">
                        {isProfit ? '+' : ''}{Math.abs(profitPercent).toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};