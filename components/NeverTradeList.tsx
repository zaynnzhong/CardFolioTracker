import React, { useState, useMemo } from 'react';
import { Card, Currency } from '../types';
import { Shield, ShieldOff, Search } from 'lucide-react';

interface NeverTradeListProps {
  cards: Card[];
  displayCurrency: Currency;
  convertPrice: (amount: number, from: Currency, to: Currency) => number;
  formatPrice: (amount: number, currency: Currency) => string;
  onToggleNeverTrade: (cardId: string, neverTrade: boolean) => Promise<void>;
}

export const NeverTradeList: React.FC<NeverTradeListProps> = ({
  cards,
  displayCurrency,
  convertPrice,
  formatPrice,
  onToggleNeverTrade
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  // Filter to portfolio cards only (not sold, not watchlist) and sort by value (high to low)
  const portfolioCards = useMemo(() => {
    return cards
      .filter(c => !c.sold && !c.watchlist)
      .sort((a, b) => {
        const aValue = convertPrice(a.currentValue, a.currency, displayCurrency);
        const bValue = convertPrice(b.currentValue, b.currency, displayCurrency);
        return bValue - aValue; // High to low
      });
  }, [cards, convertPrice, displayCurrency]);

  // Filter by search query
  const filteredCards = useMemo(() => {
    if (!searchQuery) return portfolioCards;

    const query = searchQuery.toLowerCase();
    return portfolioCards.filter(c =>
      c.player.toLowerCase().includes(query) ||
      c.series.toLowerCase().includes(query) ||
      c.year.toString().includes(query)
    );
  }, [portfolioCards, searchQuery]);

  // Separate into never trade and available for trade
  const neverTradeCards = useMemo(() =>
    filteredCards.filter(c => c.neverTrade),
    [filteredCards]
  );

  const availableCards = useMemo(() =>
    filteredCards.filter(c => !c.neverTrade),
    [filteredCards]
  );

  const handleToggle = async (cardId: string, currentStatus: boolean) => {
    setLoading(cardId);
    try {
      await onToggleNeverTrade(cardId, !currentStatus);
    } catch (error) {
      console.error('Failed to toggle neverTrade status:', error);
      alert('Failed to update card status. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const renderCard = (card: Card, isProtected: boolean) => {
    const cardValue = convertPrice(card.currentValue, card.currency, displayCurrency);
    const isLoading = loading === card.id;

    return (
      <div
        key={card.id}
        className="glass-card p-3 sm:p-4 bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-all rounded-xl"
      >
        <div className="flex items-center gap-3">
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt={card.player}
              className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded flex-shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm sm:text-base truncate">{card.player}</div>
            <div className="text-xs sm:text-sm text-slate-400 truncate">
              {card.year} {card.series}
              {card.parallel && ` • ${card.parallel}`}
            </div>
            {card.gradeValue && (
              <div className="text-xs text-slate-500 truncate">{card.gradeCompany} {card.gradeValue}</div>
            )}
            <div className="text-base sm:text-lg font-bold text-crypto-lime mt-1">
              {formatPrice(cardValue, displayCurrency)}
            </div>
          </div>

          <button
            onClick={() => handleToggle(card.id, !!card.neverTrade)}
            disabled={isLoading}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${
              isProtected
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600/50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProtected ? (
              <>
                <Shield size={18} />
                <span className="hidden sm:inline">Protected</span>
              </>
            ) : (
              <>
                <ShieldOff size={18} />
                <span className="hidden sm:inline">Mark Safe</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Never Trade List</h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          Mark cards as "Never Trade" to exclude them from trade suggestions
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search cards..."
          className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="glass-card p-3 sm:p-4 bg-slate-800/50 rounded-xl">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Protected</div>
          <div className="text-xl sm:text-2xl font-bold text-green-400">
            {neverTradeCards.length}
          </div>
        </div>
        <div className="glass-card p-3 sm:p-4 bg-slate-800/50 rounded-xl">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Available</div>
          <div className="text-xl sm:text-2xl font-bold text-crypto-lime">
            {availableCards.length}
          </div>
        </div>
      </div>

      {/* Protected Cards Section */}
      {neverTradeCards.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="text-green-400" size={18} />
            Protected ({neverTradeCards.length})
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {neverTradeCards.map(card => renderCard(card, true))}
          </div>
        </div>
      )}

      {/* Available Cards Section */}
      {availableCards.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
            Available for Trade ({availableCards.length})
          </h3>
          <div className="space-y-2 sm:space-y-3 max-h-[50vh] sm:max-h-96 overflow-y-auto">
            {availableCards.map(card => renderCard(card, false))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <p className="text-slate-500 text-sm">
            {searchQuery ? 'No cards found matching your search' : 'No cards in your portfolio'}
          </p>
        </div>
      )}
    </div>
  );
};
