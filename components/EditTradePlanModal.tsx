import React, { useState, useMemo } from 'react';
import { Card, Currency, BundledCard, TradePlan } from '../types';
import { X, Save, Plus, Trash2, DollarSign, Search, Target } from 'lucide-react';

interface TargetCard {
  player: string;
  year: string;
  set: string;
  parallel?: string;
  grade?: string;
  imageUrl?: string;
}

interface EditTradePlanModalProps {
  plan: TradePlan;
  allCards: Card[];
  plannerCurrency: Currency;
  convertPrice: (amount: number, from: Currency, to: Currency) => number;
  formatPrice: (amount: number, currency: Currency) => string;
  onSave: (updates: {
    planName: string;
    bundleCards: BundledCard[];
    cashAmount?: number;
    cashCurrency?: 'USD' | 'CNY';
    totalBundleValue: number;
    notes?: string;
    targetValue?: number;
    targetCard?: TargetCard;
  }) => void;
  onClose: () => void;
}

export const EditTradePlanModal: React.FC<EditTradePlanModalProps> = ({
  plan,
  allCards,
  plannerCurrency,
  convertPrice,
  formatPrice,
  onSave,
  onClose
}) => {
  // Initialize state from existing plan
  const [planName, setPlanName] = useState(plan.planName);
  const [targetValue, setTargetValue] = useState(plan.targetValue?.toString() || '');
  const [notes, setNotes] = useState(plan.notes || '');
  const [cashAmount, setCashAmount] = useState(plan.cashAmount || 0);

  // Target card state
  const [showTargetCard, setShowTargetCard] = useState(!!plan.targetCard);
  const [targetCardPlayer, setTargetCardPlayer] = useState(plan.targetCard?.player || '');
  const [targetCardYear, setTargetCardYear] = useState(plan.targetCard?.year || '');
  const [targetCardSet, setTargetCardSet] = useState(plan.targetCard?.set || '');
  const [targetCardParallel, setTargetCardParallel] = useState(plan.targetCard?.parallel || '');
  const [targetCardGrade, setTargetCardGrade] = useState(plan.targetCard?.grade || '');

  // Convert bundled cards back to Card objects using allCards
  const initialCards = useMemo(() => {
    return plan.bundleCards.map(bc => {
      const card = allCards.find(c => c.id === bc.cardId);
      if (card) return card;

      // If card not found in current cards, create a placeholder from snapshot
      return {
        id: bc.cardId,
        player: bc.cardSnapshot.player,
        year: parseInt(bc.cardSnapshot.year),
        series: bc.cardSnapshot.set,
        parallel: bc.cardSnapshot.parallel,
        gradeValue: bc.cardSnapshot.grade,
        currentValue: bc.currentValueAtPlanTime,
        currency: plannerCurrency,
        imageUrl: bc.cardSnapshot.imageUrl,
        sport: 'Basketball', // Default
        sold: false,
        watchlist: false
      } as Card;
    }).filter(Boolean);
  }, [plan.bundleCards, allCards, plannerCurrency]);

  const [bundleCards, setBundleCards] = useState<Card[]>(initialCards);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);

  // Calculate totals
  const cardsTotal = useMemo(() => {
    return bundleCards.reduce((sum, card) => {
      return sum + convertPrice(card.currentValue, card.currency, plannerCurrency);
    }, 0);
  }, [bundleCards, plannerCurrency, convertPrice]);

  const bundleTotal = cardsTotal + cashAmount;

  const percentOverTarget = targetValue
    ? ((bundleTotal - parseFloat(targetValue)) / parseFloat(targetValue)) * 100
    : 0;

  // Available cards for adding (not in bundle, not sold, not watchlist)
  const availableCards = useMemo(() => {
    const bundleCardIds = new Set(bundleCards.map(c => c.id));
    return allCards.filter(c =>
      !c.sold &&
      !c.watchlist &&
      c.currentValue > 0 &&
      !bundleCardIds.has(c.id) &&
      (searchQuery === '' ||
        c.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.series.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => {
      const aValue = convertPrice(a.currentValue, a.currency, plannerCurrency);
      const bValue = convertPrice(b.currentValue, b.currency, plannerCurrency);
      return bValue - aValue; // High to low
    });
  }, [allCards, bundleCards, searchQuery, plannerCurrency, convertPrice]);

  const handleAddCard = (card: Card) => {
    setBundleCards([...bundleCards, card]);
    setSearchQuery('');
  };

  const handleRemoveCard = (cardId: string) => {
    setBundleCards(bundleCards.filter(c => c.id !== cardId));
  };

  const handleSave = () => {
    if (bundleCards.length === 0) {
      alert('Please add at least one card to the bundle');
      return;
    }

    // Convert cards to bundled cards format
    const updatedBundleCards: BundledCard[] = bundleCards.map(card => ({
      cardId: card.id,
      currentValueAtPlanTime: convertPrice(card.currentValue, card.currency, plannerCurrency),
      cardSnapshot: {
        player: card.player,
        year: card.year.toString(),
        set: card.series,
        parallel: card.parallel,
        grade: card.gradeValue,
        imageUrl: card.imageUrl
      }
    }));

    const targetCard = showTargetCard && targetCardPlayer && targetCardYear && targetCardSet
      ? {
          player: targetCardPlayer.trim(),
          year: targetCardYear.trim(),
          set: targetCardSet.trim(),
          parallel: targetCardParallel.trim() || undefined,
          grade: targetCardGrade.trim() || undefined,
        }
      : undefined;

    const updates = {
      planName: planName.trim() || plan.planName,
      bundleCards: updatedBundleCards,
      cashAmount: cashAmount > 0 ? cashAmount : undefined,
      cashCurrency: cashAmount > 0 ? plannerCurrency : undefined,
      totalBundleValue: bundleTotal,
      notes: notes.trim() || undefined,
      targetValue: targetValue ? parseFloat(targetValue) : undefined,
      targetCard: targetCard
    };

    onSave(updates);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="glass-card max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Trade Plan</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Plan Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Plan Name
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Enter plan name..."
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
            />
          </div>

          {/* Target Value */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Value (Optional)
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Enter target value..."
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
            />
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
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
                <div className={`text-3xl font-bold ${
                  percentOverTarget >= 10 ? 'text-crypto-lime' : 'text-red-400'
                }`}>
                  {percentOverTarget > 0 ? '+' : ''}{percentOverTarget.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Cash Amount */}
          <div className="glass-card p-4 bg-slate-800/50 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-white flex items-center gap-2">
                <DollarSign size={18} className="text-crypto-lime" />
                Cash Amount
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
            </div>
          </div>

          {/* Cards List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">
                Cards in Bundle ({bundleCards.length})
              </h3>
              <button
                onClick={() => setShowAddCard(!showAddCard)}
                className="flex items-center gap-2 px-3 py-1.5 bg-crypto-lime/20 hover:bg-crypto-lime/30 border border-crypto-lime/30 text-crypto-lime rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                Add Card
              </button>
            </div>

            {/* Add Card Panel */}
            {showAddCard && (
              <div className="glass-card p-4 bg-slate-800/50 mb-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cards to add..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableCards.length === 0 ? (
                    <div className="text-center text-slate-400 py-4">
                      {searchQuery ? 'No matching cards found' : 'No cards available to add'}
                    </div>
                  ) : (
                    availableCards.slice(0, 10).map(card => {
                      const cardValue = convertPrice(card.currentValue, card.currency, plannerCurrency);
                      return (
                        <div
                          key={card.id}
                          className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                          onClick={() => handleAddCard(card)}
                        >
                          {card.imageUrl && (
                            <img
                              src={card.imageUrl}
                              alt={card.player}
                              className="w-12 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{card.player}</div>
                            <div className="text-xs text-slate-400">
                              {card.year} {card.series}
                              {card.parallel && ` • ${card.parallel}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">
                              {formatPrice(cardValue, plannerCurrency)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Current Cards */}
            <div className="space-y-2">
              {bundleCards.length === 0 ? (
                <div className="text-center text-slate-400 py-8 border border-dashed border-slate-700 rounded-lg">
                  No cards in bundle. Click "Add Card" to add cards.
                </div>
              ) : (
                bundleCards.map(card => {
                  const cardValue = convertPrice(card.currentValue, card.currency, plannerCurrency);
                  return (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
                    >
                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt={card.player}
                          className="w-16 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-white mb-1">{card.player}</div>
                        <div className="text-sm text-slate-400">
                          {card.year} {card.series}
                          {card.parallel && ` • ${card.parallel}`}
                          {card.gradeValue && ` • ${card.gradeValue}`}
                        </div>
                      </div>
                      <div className="text-right mr-3">
                        <div className="font-bold text-white">
                          {formatPrice(cardValue, plannerCurrency)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCard(card.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })
              )}
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

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this trade plan..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Changes
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
