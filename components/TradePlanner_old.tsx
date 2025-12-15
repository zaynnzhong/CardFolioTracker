import React, { useState, useMemo } from 'react';
import { Card, Currency, BundleSuggestion, BundledCard } from '../types';
import { Target, CheckSquare, Square, Save, Sparkles, X } from 'lucide-react';
import { BundleSuggestionCard } from './BundleSuggestionCard';
import { CurrencySelector } from './CurrencySelector';
import { BundleDetailModal } from './BundleDetailModal';
import { generateBundleSuggestions } from '../utils/bundleSuggestions';
import { dataService } from '../services/dataService';

interface TradePlannerProps {
  cards: Card[];
  displayCurrency: Currency;
  convertPrice: (amount: number) => string;
  getIdToken: () => Promise<string | null>;
  onClose: () => void;
  onPlanCreated: () => void;
}

// Currency conversion utility (1 USD = 7 CNY)
const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
  if (from === to) return amount;
  if (from === 'USD' && to === 'CNY') return amount * 7;
  if (from === 'CNY' && to === 'USD') return amount / 7;
  return amount;
};

const formatCurrency = (amount: number, currency: Currency): string => {
  const symbol = currency === 'USD' ? '$' : '¥';
  return `${symbol}${amount.toLocaleString()}`;
};

type PlannerMode = 'target' | 'manual';

export const TradePlanner: React.FC<TradePlannerProps> = ({
  cards,
  displayCurrency,
  convertPrice,
  getIdToken,
  onClose,
  onPlanCreated
}) => {
  const [mode, setMode] = useState<PlannerMode>('target');
  const [plannerCurrency, setPlannerCurrency] = useState<Currency>(displayCurrency);
  const [targetValue, setTargetValue] = useState<string>('');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [selectedSuggestion, setSelectedSuggestion] = useState<BundleSuggestion | null>(null);
  const [viewingBundle, setViewingBundle] = useState<BundleSuggestion | null>(null);
  const [showSavePlanModal, setShowSavePlanModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Filter available cards (not sold)
  const availableCards = useMemo(
    () => cards.filter(c => !c.sold && c.currentValue > 0),
    [cards]
  );

  // Generate bundle suggestions when target value is set
  // Convert all cards to planner currency for accurate bundling
  const cardsInPlannerCurrency = useMemo(() => {
    return availableCards.map(card => ({
      ...card,
      currentValue: convertCurrency(card.currentValue, card.currency, plannerCurrency)
    }));
  }, [availableCards, plannerCurrency]);

  const bundleSuggestions = useMemo(() => {
    const target = parseFloat(targetValue);
    if (isNaN(target) || target <= 0) return [];
    setLoadingSuggestions(true);
    const suggestions = generateBundleSuggestions(cardsInPlannerCurrency, target);
    setLoadingSuggestions(false);
    return suggestions;
  }, [targetValue, cardsInPlannerCurrency]);

  // Calculate total for manually selected cards in planner currency
  const manualSelectionTotal = useMemo(() => {
    return cardsInPlannerCurrency
      .filter(c => selectedCards.has(c.id))
      .reduce((sum, c) => sum + c.currentValue, 0);
  }, [selectedCards, cardsInPlannerCurrency]);

  const handleSaveFromBundle = (bundleCards: Card[]) => {
    // Set selected cards from edited bundle
    const cardIds = new Set(bundleCards.map(c => c.id));
    setSelectedCards(cardIds);
    setViewingBundle(null);
    // Optionally show save modal immediately
    setShowSavePlanModal(true);
  };

  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    setSelectedCards(newSelection);
    setSelectedSuggestion(null); // Clear suggestion when manually selecting
  };

  const handleSelectSuggestion = (suggestion: BundleSuggestion) => {
    setSelectedSuggestion(suggestion);
    // Update manual selection to match suggestion
    const newSelection = new Set(suggestion.cards.map(c => c.id));
    setSelectedCards(newSelection);
  };

  const handleSavePlan = async () => {
    if (selectedCards.size === 0) return;

    const bundleCards: BundledCard[] = availableCards
      .filter(c => selectedCards.has(c.id))
      .map(card => ({
        cardId: card.id,
        currentValueAtPlanTime: card.currentValue,
        cardSnapshot: {
          player: card.player,
          year: card.year.toString(),
          set: card.series,
          parallel: card.parallel,
          grade: card.gradeValue,
          imageUrl: card.imageUrl
        }
      }));

    const totalValue = bundleCards.reduce((sum, c) => sum + c.currentValueAtPlanTime, 0);

    const defaultName = `Trade Plan - ${new Date().toLocaleDateString()}`;

    try {
      setSaving(true);
      await dataService.createTradePlan({
        planName: planName.trim() || defaultName,
        targetValue: mode === 'target' && targetValue ? parseFloat(targetValue) : undefined,
        bundleCards,
        totalBundleValue: totalValue,
        notes: planNotes.trim() || undefined
      }, getIdToken);

      onPlanCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create trade plan:', error);
      alert('Failed to create trade plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedCardsInfo = () => {
    const selectedCardsList = availableCards.filter(c => selectedCards.has(c.id));
    return {
      cards: selectedCardsList,
      count: selectedCardsList.length,
      total: selectedCardsList.reduce((sum, c) => sum + c.currentValue, 0)
    };
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="glass-card max-w-6xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-crypto-lime" size={24} />
                Trade Planner
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Create a trade bundle to track and execute later
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="text-slate-400" size={24} />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setMode('target')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'target'
                  ? 'border-crypto-lime bg-crypto-lime/10'
                  : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <Target className={mode === 'target' ? 'text-crypto-lime' : 'text-slate-400'} size={24} />
              <div className={`font-bold mt-2 ${mode === 'target' ? 'text-crypto-lime' : 'text-white'}`}>
                Plan for Target Card
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Enter target value and get AI suggestions
              </div>
            </button>

            <button
              onClick={() => setMode('manual')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'manual'
                  ? 'border-crypto-lime bg-crypto-lime/10'
                  : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <CheckSquare className={mode === 'manual' ? 'text-crypto-lime' : 'text-slate-400'} size={24} />
              <div className={`font-bold mt-2 ${mode === 'manual' ? 'text-crypto-lime' : 'text-white'}`}>
                Manual Selection
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Choose specific cards from your portfolio
              </div>
            </button>
          </div>

          {/* Target Value Input (Target Mode) */}
          {mode === 'target' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Card Value ({displayCurrency})
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g., 5000"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
              />
              {targetValue && parseFloat(targetValue) > 0 && (
                <div className="mt-2 text-sm text-slate-400">
                  Generating bundles valued at {convertPrice(parseFloat(targetValue) * 1.10)} - {convertPrice(parseFloat(targetValue) * 1.20)} (10-20% negotiation room)
                </div>
              )}
            </div>
          )}

          {/* Bundle Suggestions (Target Mode) */}
          {mode === 'target' && bundleSuggestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bundle Suggestions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundleSuggestions.map((suggestion, idx) => (
                  <BundleSuggestionCard
                    key={idx}
                    suggestion={suggestion}
                    targetValue={parseFloat(targetValue)}
                    displayCurrency={displayCurrency}
                    convertPrice={convertPrice}
                    onSelect={() => handleSelectSuggestion(suggestion)}
                    selected={selectedSuggestion === suggestion}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Manual Card Selection (Manual Mode) */}
          {mode === 'manual' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Select Cards</h3>
                <div className="text-sm">
                  <span className="text-slate-400">Selected: </span>
                  <span className="text-white font-bold">{selectedCards.size} cards</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-crypto-lime font-bold">{convertPrice(manualSelectionTotal)}</span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => toggleCardSelection(card.id)}
                    className={`w-full p-3 rounded-lg border transition-all ${
                      selectedCards.has(card.id)
                        ? 'border-crypto-lime bg-crypto-lime/10'
                        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 ${selectedCards.has(card.id) ? 'text-crypto-lime' : 'text-slate-400'}`}>
                        {selectedCards.has(card.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>

                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt={card.player}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}

                      <div className="flex-1 text-left">
                        <div className="font-medium text-white">{card.player}</div>
                        <div className="text-sm text-slate-400">
                          {card.year} {card.series} {card.parallel && `• ${card.parallel}`} {card.gradeValue && `• ${card.gradeValue}`}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-white">{convertPrice(card.currentValue)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {selectedCards.size > 0 && !showSavePlanModal && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowSavePlanModal(true)}
                className="flex-1 bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save as Trade Plan
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-700/50 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Save Plan Modal */}
          {showSavePlanModal && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Save Trade Plan</h3>

              <div className="space-y-4">
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

                <div className="flex gap-3">
                  <button
                    onClick={handleSavePlan}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Plan'}
                  </button>
                  <button
                    onClick={() => setShowSavePlanModal(false)}
                    className="px-6 py-3 bg-slate-700/50 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
