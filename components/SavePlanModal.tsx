import React, { useState, useMemo } from 'react';
import { Card, Currency } from '../types';
import { X, Trash2, DollarSign, Plus, Search, Target, Upload } from 'lucide-react';

interface TargetCard {
  player: string;
  year: string;
  set: string;
  parallel?: string;
  grade?: string;
  imageUrl?: string;
}

interface SavePlanModalProps {
  initialCards: Card[];
  initialCashAmount: number;
  targetValue?: number;
  initialTargetCard?: {
    player: string;
    year: string;
    set: string;
    parallel?: string;
    grade?: string;
    price?: string;
  };
  allCards: Card[];
  plannerCurrency: Currency;
  convertPrice: (amount: number, from: Currency, to: Currency) => number;
  formatPrice: (amount: number, currency: Currency) => string;
  onSave: (cards: Card[], cashAmount: number, planName: string, notes: string, targetCard?: TargetCard) => Promise<void>;
  onClose: () => void;
}

export const SavePlanModal: React.FC<SavePlanModalProps> = ({
  initialCards,
  initialCashAmount,
  targetValue,
  initialTargetCard,
  allCards,
  plannerCurrency,
  convertPrice,
  formatPrice,
  onSave,
  onClose
}) => {
  const [bundleCards, setBundleCards] = useState<Card[]>(initialCards);
  const [cashAmount, setCashAmount] = useState<number>(initialCashAmount);
  const [planName, setPlanName] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Target card state - initialize from props if provided
  const [showTargetCard, setShowTargetCard] = useState(!!initialTargetCard);
  const [targetCardPlayer, setTargetCardPlayer] = useState(initialTargetCard?.player || '');
  const [targetCardYear, setTargetCardYear] = useState(initialTargetCard?.year || '');
  const [targetCardSet, setTargetCardSet] = useState(initialTargetCard?.set || '');
  const [targetCardParallel, setTargetCardParallel] = useState(initialTargetCard?.parallel || '');
  const [targetCardGrade, setTargetCardGrade] = useState(initialTargetCard?.grade || '');

  // Calculate totals
  const cardsTotal = useMemo(() => {
    return bundleCards.reduce((sum, card) => {
      const valueInPlannerCurrency = convertPrice(card.currentValue, card.currency, plannerCurrency);
      return sum + valueInPlannerCurrency;
    }, 0);
  }, [bundleCards, plannerCurrency, convertPrice]);

  const bundleTotal = cardsTotal + cashAmount;

  const percentOverTarget = targetValue
    ? ((bundleTotal - targetValue) / targetValue) * 100
    : 0;

  // Available cards for adding
  const availableCards = useMemo(() => {
    const bundleCardIds = new Set(bundleCards.map(c => c.id));
    return allCards.filter(c =>
      !c.sold &&
      c.currentValue > 0 &&
      !c.watchlist &&
      !bundleCardIds.has(c.id) &&
      (searchQuery === '' ||
        c.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.series.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allCards, bundleCards, searchQuery]);

  const handleRemoveCard = (cardId: string) => {
    setBundleCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleAddCard = (card: Card) => {
    setBundleCards(prev => [...prev, card]);
    setShowAddCard(false);
    setSearchQuery('');
  };

  const handleSave = async () => {
    if (bundleCards.length === 0) return;

    const targetCard = showTargetCard && targetCardPlayer && targetCardYear && targetCardSet
      ? {
          player: targetCardPlayer.trim(),
          year: targetCardYear.trim(),
          set: targetCardSet.trim(),
          parallel: targetCardParallel.trim() || undefined,
          grade: targetCardGrade.trim() || undefined,
        }
      : undefined;

    try {
      setSaving(true);
      await onSave(bundleCards, cashAmount, planName, planNotes, targetCard);
    } catch (error) {
      console.error('Failed to save plan:', error);
    } finally {
      setSaving(false);
    }
  };

  const getPercentageColor = (percent: number) => {
    if (percent >= 10 && percent <= 15) return 'text-green-400';
    if (percent >= 15 && percent <= 20) return 'text-crypto-lime';
    if (percent > 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="glass-card max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Save Trade Plan</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="text-slate-400" size={24} />
            </button>
          </div>

          {/* Bundle Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4 bg-slate-800/50">
              <div className="text-sm text-slate-400 mb-2">Cards Total</div>
              <div className="text-2xl font-bold text-white">
                {formatPrice(cardsTotal, plannerCurrency)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {bundleCards.length} card{bundleCards.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="glass-card p-4 bg-slate-800/50">
              <div className="text-sm text-slate-400 mb-2">Bundle Total</div>
              <div className="text-2xl font-bold text-crypto-lime">
                {formatPrice(bundleTotal, plannerCurrency)}
              </div>
              {cashAmount > 0 && (
                <div className="text-xs text-yellow-400 mt-1">
                  + {formatPrice(cashAmount, plannerCurrency)} cash
                </div>
              )}
            </div>

            {targetValue && (
              <div className="glass-card p-4 bg-slate-800/50">
                <div className="text-sm text-slate-400 mb-2">vs Target</div>
                <div className={`text-2xl font-bold ${getPercentageColor(percentOverTarget)}`}>
                  {percentOverTarget > 0 ? '+' : ''}{percentOverTarget.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Target: {formatPrice(targetValue, plannerCurrency)}
                </div>
              </div>
            )}
          </div>

          {/* Cash Amount Adjustment */}
          <div className="glass-card p-4 bg-slate-800/50 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-yellow-400" />
                <div className="text-sm font-medium text-white">Cash Amount</div>
              </div>
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
            {targetValue && cardsTotal < targetValue && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                <button
                  onClick={() => setCashAmount(Math.ceil((targetValue * 1.05 - cardsTotal) / 100) * 100)}
                  className="px-3 py-1 text-xs bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 rounded transition-colors"
                >
                  Fill to 5%
                </button>
                <button
                  onClick={() => setCashAmount(Math.ceil((targetValue * 1.08 - cardsTotal) / 100) * 100)}
                  className="px-3 py-1 text-xs bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 rounded transition-colors"
                >
                  Fill to 8%
                </button>
                <button
                  onClick={() => setCashAmount(Math.ceil((targetValue * 1.10 - cardsTotal) / 100) * 100)}
                  className="px-3 py-1 text-xs bg-crypto-lime/20 hover:bg-crypto-lime/30 text-crypto-lime border border-crypto-lime/30 rounded transition-colors"
                >
                  Fill to 10%
                </button>
                <button
                  onClick={() => setCashAmount(Math.ceil((targetValue * 1.15 - cardsTotal) / 100) * 100)}
                  className="px-3 py-1 text-xs bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 rounded transition-colors"
                >
                  Fill to 15%
                </button>
              </div>
            )}
          </div>

          {/* Cards List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Cards in Bundle</h3>
              <button
                onClick={() => setShowAddCard(!showAddCard)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  showAddCard
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Plus size={16} />
                Add Card
              </button>
            </div>

            {/* Add Card Panel */}
            {showAddCard && (
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
                  {availableCards.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm py-4">
                      {searchQuery ? 'No cards found matching your search' : 'No more cards available to add'}
                    </div>
                  ) : (
                    availableCards.map(card => {
                      const cardValue = convertPrice(card.currentValue, card.currency, plannerCurrency);
                      return (
                        <button
                          key={card.id}
                          onClick={() => handleAddCard(card)}
                          className="w-full p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 hover:border-green-500/50 transition-all text-left"
                        >
                          <div className="flex items-center gap-2">
                            {card.imageUrl && (
                              <img
                                src={card.imageUrl}
                                alt={card.player}
                                className="w-10 h-14 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm truncate">
                                {card.player}
                              </div>
                              <div className="text-xs text-slate-400 truncate">
                                {card.year} {card.series}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-green-400 whitespace-nowrap">
                              {formatPrice(cardValue, plannerCurrency)}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Current Cards */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {bundleCards.map((card) => {
                const cardValue = convertPrice(card.currentValue, card.currency, plannerCurrency);
                return (
                  <div
                    key={card.id}
                    className="glass-card p-4 bg-slate-800/30 border border-slate-700/50"
                  >
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
                          {formatPrice(cardValue, plannerCurrency)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveCard(card.id)}
                        className="p-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Remove card"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Card Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-crypto-lime" />
                <h3 className="text-lg font-semibold text-white">Target Card (Optional)</h3>
              </div>
              <button
                onClick={() => setShowTargetCard(!showTargetCard)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  showTargetCard
                    ? 'bg-crypto-lime/20 text-crypto-lime border border-crypto-lime/30'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {showTargetCard ? 'Hide' : 'Add Target Card'}
              </button>
            </div>

            {showTargetCard && (
              <div className="glass-card p-4 bg-slate-800/50 border border-crypto-lime/20 space-y-3">
                <p className="text-sm text-slate-400 mb-3">
                  Specify the card you're trying to acquire with this trade bundle
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Player Name *
                    </label>
                    <input
                      type="text"
                      value={targetCardPlayer}
                      onChange={(e) => setTargetCardPlayer(e.target.value)}
                      placeholder="e.g., LeBron James"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Year *
                    </label>
                    <input
                      type="text"
                      value={targetCardYear}
                      onChange={(e) => setTargetCardYear(e.target.value)}
                      placeholder="e.g., 2024"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Set/Series *
                    </label>
                    <input
                      type="text"
                      value={targetCardSet}
                      onChange={(e) => setTargetCardSet(e.target.value)}
                      placeholder="e.g., Prizm"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Parallel
                    </label>
                    <input
                      type="text"
                      value={targetCardParallel}
                      onChange={(e) => setTargetCardParallel(e.target.value)}
                      placeholder="e.g., Silver"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Grade
                    </label>
                    <input
                      type="text"
                      value={targetCardGrade}
                      onChange={(e) => setTargetCardGrade(e.target.value)}
                      placeholder="e.g., PSA 10"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {targetCardPlayer && targetCardYear && targetCardSet && (
                  <div className="mt-3 p-3 bg-crypto-lime/10 border border-crypto-lime/30 rounded-lg">
                    <div className="text-sm text-crypto-lime font-medium">
                      {targetCardPlayer} • {targetCardYear} {targetCardSet}
                      {targetCardParallel && ` • ${targetCardParallel}`}
                      {targetCardGrade && ` • ${targetCardGrade}`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plan Details */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Plan Name
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder={`Trade Plan - ${new Date().toLocaleDateString()}`}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                placeholder="Add any notes about this trade plan..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || bundleCards.length === 0}
              className="flex-1 bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Plan'}
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
