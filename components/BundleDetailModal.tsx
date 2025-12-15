import React, { useState, useMemo } from 'react';
import { Card, Currency, BundleSuggestion } from '../types';
import { X, Edit2, Save, Trash2, Search, RefreshCw, Plus } from 'lucide-react';

interface BundleDetailModalProps {
  suggestion: BundleSuggestion;
  targetValue?: number;
  allCards: Card[];
  plannerCurrency: Currency;
  convertPrice: (amount: number, from: Currency, to: Currency) => number;
  formatPrice: (amount: number, currency: Currency) => string;
  onClose: () => void;
  onSaveAsBundle: (cards: Card[], cashAmount?: number) => void;
}

export const BundleDetailModal: React.FC<BundleDetailModalProps> = ({
  suggestion,
  targetValue,
  allCards,
  plannerCurrency,
  convertPrice,
  formatPrice,
  onClose,
  onSaveAsBundle
}) => {
  const [editMode, setEditMode] = useState(false);
  const [bundleCards, setBundleCards] = useState<Card[]>(suggestion.cards);
  const [cashAmount, setCashAmount] = useState<number>(suggestion.cashAmount || 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [replacingCardId, setReplacingCardId] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);

  // Calculate bundle total in planner currency (cards only)
  const cardsTotal = useMemo(() => {
    return bundleCards.reduce((sum, card) => {
      const valueInPlannerCurrency = convertPrice(card.currentValue, card.currency, plannerCurrency);
      return sum + valueInPlannerCurrency;
    }, 0);
  }, [bundleCards, plannerCurrency, convertPrice]);

  // Total including cash
  const bundleTotal = cardsTotal + cashAmount;

  const percentOverTarget = targetValue
    ? ((bundleTotal - targetValue) / targetValue) * 100
    : 0;

  // Available cards for swapping/adding (excluding current bundle cards, only holdings not watchlist)
  const availableForSwap = useMemo(() => {
    const bundleCardIds = new Set(bundleCards.map(c => c.id));
    return allCards.filter(c =>
      !c.sold &&
      c.currentValue > 0 &&
      !c.watchlist && // Only cards in portfolio (holdings), not watchlist
      !bundleCardIds.has(c.id) &&
      (searchQuery === '' ||
        c.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.series.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allCards, bundleCards, searchQuery]);

  const handleRemoveCard = (cardId: string) => {
    setBundleCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleReplaceCard = (oldCardId: string, newCard: Card) => {
    setBundleCards(prev => prev.map(c => c.id === oldCardId ? newCard : c));
    setReplacingCardId(null);
    setSearchQuery('');
  };

  const handleAddCard = (newCard: Card) => {
    setBundleCards(prev => [...prev, newCard]);
    setShowAddCard(false);
    setSearchQuery('');
  };

  const handleOpenReplace = (cardId: string) => {
    setReplacingCardId(cardId);
    setShowAddCard(false); // Close add card panel
    setSearchQuery(''); // Clear search
  };

  const handleOpenAddCard = () => {
    setShowAddCard(!showAddCard);
    setReplacingCardId(null); // Close any replace panel
    setSearchQuery(''); // Clear search
  };

  const handleSave = () => {
    onSaveAsBundle(bundleCards, cashAmount > 0 ? cashAmount : undefined);
  };

  const getPercentageColor = (percent: number) => {
    if (percent >= 10 && percent <= 15) return 'text-green-400';
    if (percent >= 15 && percent <= 20) return 'text-crypto-lime';
    if (percent > 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="glass-card max-w-4xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Bundle Details</h2>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-sm text-slate-400">
                  {bundleCards.length} card{bundleCards.length !== 1 ? 's' : ''}
                </div>
                {targetValue && (
                  <div className="text-sm">
                    <span className="text-slate-400">Target: </span>
                    <span className="text-white font-semibold">
                      {formatPrice(targetValue, plannerCurrency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="text-slate-400" size={24} />
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-4 bg-slate-800/50">
              <div className="text-sm text-slate-400 mb-2">Cards Total</div>
              <div className="text-2xl font-bold text-white">
                {formatPrice(cardsTotal, plannerCurrency)}
              </div>
              {cashAmount > 0 && (
                <div className="text-xs text-yellow-400 font-medium mt-1">
                  + {formatPrice(cashAmount, plannerCurrency)} cash
                </div>
              )}
              <div className="text-sm text-crypto-lime font-semibold mt-2 pt-2 border-t border-slate-700/50">
                Total: {formatPrice(bundleTotal, plannerCurrency)}
              </div>
            </div>

            {targetValue && (
              <div className="glass-card p-4 bg-slate-800/50">
                <div className="text-sm text-slate-400 mb-2">vs Target</div>
                <div className={`text-3xl font-bold ${getPercentageColor(percentOverTarget)}`}>
                  {percentOverTarget > 0 ? '+' : ''}{percentOverTarget.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Cash Amount Adjustment */}
          {editMode && (
            <div className="glass-card p-4 bg-slate-800/50 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-white">Cash Amount</div>
                {cashAmount > 0 && (
                  <button
                    onClick={() => setCashAmount(0)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove Cash
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCashAmount(Math.max(0, cashAmount - 100))}
                  className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  -100
                </button>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-center focus:border-crypto-lime focus:outline-none"
                  placeholder="0"
                  step="100"
                  min="0"
                />
                <button
                  onClick={() => setCashAmount(cashAmount + 100)}
                  className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  +100
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setCashAmount(cashAmount + 500)}
                  className="flex-1 px-3 py-1 text-xs bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 rounded transition-colors"
                >
                  +500
                </button>
                <button
                  onClick={() => setCashAmount(cashAmount + 1000)}
                  className="flex-1 px-3 py-1 text-xs bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 rounded transition-colors"
                >
                  +1000
                </button>
                {targetValue && cardsTotal < targetValue && (
                  <button
                    onClick={() => setCashAmount(Math.ceil((targetValue * 1.10 - cardsTotal) / 100) * 100)}
                    className="flex-1 px-3 py-1 text-xs bg-crypto-lime/20 hover:bg-crypto-lime/30 text-crypto-lime border border-crypto-lime/30 rounded transition-colors"
                  >
                    Fill to 110%
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Edit Mode Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Cards in Bundle</h3>
            <div className="flex gap-2">
              {editMode && (
                <button
                  onClick={handleOpenAddCard}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    showAddCard
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Plus size={16} />
                  Add Card
                </button>
              )}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  editMode
                    ? 'bg-crypto-lime/20 text-crypto-lime border border-crypto-lime/30'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Edit2 size={16} />
                {editMode ? 'Editing' : 'Edit Bundle'}
              </button>
            </div>
          </div>

          {/* Add Card Panel */}
          {showAddCard && editMode && (
            <div className="mb-4 p-4 bg-slate-900/50 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for card to add..."
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none text-sm"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableForSwap.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-4">
                    {searchQuery ? 'No cards found matching your search' : 'No more cards available to add'}
                  </div>
                ) : (
                  availableForSwap.map(addCard => {
                    const addValueInPlannerCurrency = convertPrice(
                      addCard.currentValue,
                      addCard.currency,
                      plannerCurrency
                    );
                    return (
                      <button
                        key={addCard.id}
                        onClick={() => handleAddCard(addCard)}
                        className="w-full p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 hover:border-green-500/50 transition-all text-left"
                      >
                        <div className="flex items-center gap-2">
                          {addCard.imageUrl && (
                            <img
                              src={addCard.imageUrl}
                              alt={addCard.player}
                              className="w-10 h-14 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm truncate">
                              {addCard.player}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {addCard.year} {addCard.series}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-green-400 whitespace-nowrap">
                            {formatPrice(addValueInPlannerCurrency, plannerCurrency)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {bundleCards.map((card) => {
              const cardValueInPlannerCurrency = convertPrice(card.currentValue, card.currency, plannerCurrency);
              const isReplacing = replacingCardId === card.id;

              return (
                <div key={card.id}>
                  <div className="glass-card p-4 bg-slate-800/30 border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt={card.player}
                          className="w-16 h-20 object-cover rounded"
                        />
                      )}

                      <div className="flex-1">
                        <div className="font-semibold text-white mb-1">{card.player}</div>
                        <div className="text-sm text-slate-400">
                          {card.year} {card.series}
                          {card.parallel && ` • ${card.parallel}`}
                          {card.gradeValue && ` • ${card.gradeValue}`}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          {formatPrice(cardValueInPlannerCurrency, plannerCurrency)}
                        </div>
                        {card.currency !== plannerCurrency && (
                          <div className="text-xs text-slate-500">
                            Originally {formatPrice(card.currentValue, card.currency)}
                          </div>
                        )}
                      </div>

                      {editMode && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => isReplacing ? setReplacingCardId(null) : handleOpenReplace(card.id)}
                            className="p-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="Replace card"
                          >
                            <RefreshCw size={18} />
                          </button>
                          <button
                            onClick={() => handleRemoveCard(card.id)}
                            className="p-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            title="Remove card"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Replacement Panel */}
                  {isReplacing && editMode && (
                    <div className="mt-2 p-4 bg-slate-900/50 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Search size={16} className="text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for replacement card..."
                          className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none text-sm"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {availableForSwap.length === 0 ? (
                          <div className="text-center text-slate-500 text-sm py-4">
                            {searchQuery ? 'No cards found matching your search' : 'No cards available for replacement'}
                          </div>
                        ) : (
                          availableForSwap.map(replaceCard => {
                            const replaceValueInPlannerCurrency = convertPrice(
                              replaceCard.currentValue,
                              replaceCard.currency,
                              plannerCurrency
                            );
                            return (
                              <button
                                key={replaceCard.id}
                                onClick={() => handleReplaceCard(card.id, replaceCard)}
                                className="w-full p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 hover:border-crypto-lime/50 transition-all text-left"
                              >
                                <div className="flex items-center gap-2">
                                  {replaceCard.imageUrl && (
                                    <img
                                      src={replaceCard.imageUrl}
                                      alt={replaceCard.player}
                                      className="w-10 h-14 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-sm truncate">
                                      {replaceCard.player}
                                    </div>
                                    <div className="text-xs text-slate-400 truncate">
                                      {replaceCard.year} {replaceCard.series}
                                    </div>
                                  </div>
                                  <div className="text-sm font-bold text-crypto-lime whitespace-nowrap">
                                    {formatPrice(replaceValueInPlannerCurrency, plannerCurrency)}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={bundleCards.length === 0}
              className="flex-1 bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {editMode ? 'Save Edited Bundle' : 'Use This Bundle'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700/50 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
