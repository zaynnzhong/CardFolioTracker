import React, { useState, useMemo, useEffect } from 'react';
import { Card, Currency, BundleSuggestion, BundledCard } from '../types';
import { Target, CheckSquare, Square, Save, Sparkles, X, Loader2 } from 'lucide-react';
import { BundleSuggestionCard } from './BundleSuggestionCard';
import { CurrencySelector } from './CurrencySelector';
import { BundleDetailModal } from './BundleDetailModal';
import { SavePlanModal } from './SavePlanModal';
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
  const [savePlanCards, setSavePlanCards] = useState<Card[]>([]);
  const [savePlanCashAmount, setSavePlanCashAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [debouncedTargetValue, setDebouncedTargetValue] = useState('');

  // Target card state
  const [showTargetCardInput, setShowTargetCardInput] = useState(false);
  const [showWatchlistSelector, setShowWatchlistSelector] = useState(false);
  const [targetCardPlayer, setTargetCardPlayer] = useState('');
  const [targetCardYear, setTargetCardYear] = useState('');
  const [targetCardSet, setTargetCardSet] = useState('');
  const [targetCardParallel, setTargetCardParallel] = useState('');
  const [targetCardGrade, setTargetCardGrade] = useState('');
  const [targetCardPrice, setTargetCardPrice] = useState('');

  // Filter available cards (not sold, not watchlist - those are targets to acquire)
  const availableCards = useMemo(
    () => cards.filter(c => !c.sold && !c.watchlist && c.currentValue > 0),
    [cards]
  );

  // Get watchlist cards for target card selection
  const watchlistCards = useMemo(
    () => cards.filter(c => c.watchlist),
    [cards]
  );

  // Convert all cards to planner currency for accurate bundling
  const cardsInPlannerCurrency = useMemo(() => {
    return availableCards.map(card => ({
      ...card,
      currentValue: convertCurrency(card.currentValue, card.currency, plannerCurrency)
    }));
  }, [availableCards, plannerCurrency]);

  // Debounce target value changes to prevent excessive calculations
  useEffect(() => {
    // Show loading immediately when user types
    if (targetValue && parseFloat(targetValue) > 0) {
      setLoadingSuggestions(true);
    }

    const timer = setTimeout(() => {
      setDebouncedTargetValue(targetValue);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [targetValue]);

  // Generate bundle suggestions when debounced target value is set
  const bundleSuggestions = useMemo(() => {
    const target = parseFloat(debouncedTargetValue);
    if (isNaN(target) || target <= 0) {
      setLoadingSuggestions(false);
      return [];
    }
    setLoadingSuggestions(true);

    // Run generation in a timeout to not block UI
    const suggestions = generateBundleSuggestions(cardsInPlannerCurrency, target);
    setTimeout(() => setLoadingSuggestions(false), 100);
    return suggestions;
  }, [debouncedTargetValue, cardsInPlannerCurrency]);

  // Calculate total for manually selected cards in planner currency
  const manualSelectionTotal = useMemo(() => {
    return cardsInPlannerCurrency
      .filter(c => selectedCards.has(c.id))
      .reduce((sum, c) => sum + c.currentValue, 0);
  }, [selectedCards, cardsInPlannerCurrency]);

  // Reset target value when currency changes
  useEffect(() => {
    if (targetValue) {
      const currentValue = parseFloat(targetValue);
      if (!isNaN(currentValue)) {
        // Convert the target value to new currency
        const newValue = convertCurrency(currentValue, displayCurrency, plannerCurrency);
        setTargetValue(newValue.toString());
      }
    }
  }, [plannerCurrency]);

  const handleSaveFromBundle = (bundleCards: Card[], cashAmount?: number) => {
    // Open SavePlanModal with the edited bundle
    // Don't clear target card info when coming from bundle view
    setSavePlanCards(bundleCards);
    setSavePlanCashAmount(cashAmount || 0);
    setViewingBundle(null);
    setShowSavePlanModal(true);
  };

  // Create a suggestion with original cards (not currency-converted) for the modal
  const viewingBundleWithOriginalCards = useMemo(() => {
    if (!viewingBundle) return null;

    // Map converted card IDs back to original cards
    const originalCards = viewingBundle.cards.map(convertedCard => {
      return availableCards.find(c => c.id === convertedCard.id) || convertedCard;
    });

    return {
      ...viewingBundle,
      cards: originalCards
    };
  }, [viewingBundle, availableCards]);

  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    setSelectedCards(newSelection);
    setSelectedSuggestion(null);
  };

  const handleSelectWatchlistCard = (card: Card) => {
    // Auto-fill target card details from watchlist card
    setTargetCardPlayer(card.player);
    setTargetCardYear(card.year.toString());
    setTargetCardSet(card.series);
    setTargetCardParallel(card.parallel || '');
    setTargetCardGrade(card.gradeValue || '');
    // Use currentValue (market price) as the target price for the trade bundle
    const marketPrice = card.currentValue > 0 ? card.currentValue : card.purchasePrice;
    setTargetCardPrice(marketPrice.toString());
    setTargetValue(convertCurrency(marketPrice, card.currency, plannerCurrency).toString());

    // Show the target card input form with filled data
    setShowTargetCardInput(true);
    setShowWatchlistSelector(false);
  };

  const handleSelectSuggestion = (suggestion: BundleSuggestion) => {
    setSelectedSuggestion(suggestion);
    const newSelection = new Set(suggestion.cards.map(c => c.id));
    setSelectedCards(newSelection);
  };

  const handleSavePlan = async (
    cards: Card[],
    cashAmount: number,
    planName: string,
    notes: string,
    targetCard?: { player: string; year: string; set: string; parallel?: string; grade?: string; imageUrl?: string }
  ) => {
    console.log('[TradePlanner] handleSavePlan called', {
      cardsCount: cards.length,
      cashAmount,
      plannerCurrency,
      hasTargetCard: !!targetCard
    });

    if (cards.length === 0) {
      console.error('[TradePlanner] No cards provided, aborting save');
      return;
    }

    // Convert cards to bundled cards format (values in planner currency)
    const bundleCards: BundledCard[] = cards.map(card => ({
      cardId: card.id,
      currentValueAtPlanTime: convertCurrency(card.currentValue, card.currency, plannerCurrency), // Convert to planner currency
      cardSnapshot: {
        player: card.player,
        year: card.year.toString(),
        set: card.series,
        parallel: card.parallel,
        grade: card.gradeValue,
        imageUrl: card.imageUrl
      }
    }));

    console.log('[TradePlanner] Bundle cards prepared:', bundleCards.length);

    // Calculate total value (cards already in their original currencies, cash in planner currency)
    const cardsValueInPlannerCurrency = cards.reduce((sum, card) => {
      return sum + convertCurrency(card.currentValue, card.currency, plannerCurrency);
    }, 0);
    const totalValue = cardsValueInPlannerCurrency + cashAmount;
    const defaultName = `Trade Plan - ${new Date().toLocaleDateString()}`;

    const planData = {
      planName: planName.trim() || defaultName,
      targetValue: mode === 'target' && targetValue ? parseFloat(targetValue) : undefined,
      targetCard: targetCard || undefined,
      bundleCards,
      cashAmount: cashAmount > 0 ? cashAmount : undefined,
      cashCurrency: cashAmount > 0 ? plannerCurrency : undefined,
      totalBundleValue: totalValue,
      notes: notes.trim() || undefined
    };

    console.log('[TradePlanner] Saving trade plan:', planData);

    try {
      setSaving(true);
      await dataService.createTradePlan(planData, getIdToken);

      console.log('[TradePlanner] Trade plan saved successfully');
      onPlanCreated();
      onClose();
    } catch (error) {
      console.error('[TradePlanner] Failed to create trade plan:', error);
      alert('Failed to create trade plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSavePlanModal = () => {
    // For manual mode, get the selected cards
    const selectedCardsList = availableCards.filter((c: Card) => selectedCards.has(c.id));
    setSavePlanCards(selectedCardsList);
    setSavePlanCashAmount(0);
    setShowSavePlanModal(true);
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
            <div className="flex items-center gap-4">
              <CurrencySelector
                selected={plannerCurrency}
                onChange={setPlannerCurrency}
              />
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="text-slate-400" size={24} />
              </button>
            </div>
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
            <>
              {/* Target Card Input Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300">
                    {showTargetCardInput ? 'Target Card Details' : 'Target Card Value'} ({plannerCurrency})
                  </label>
                  <button
                    onClick={() => setShowTargetCardInput(!showTargetCardInput)}
                    className="text-xs text-crypto-lime hover:text-crypto-lime/80 transition-colors font-medium"
                  >
                    {showTargetCardInput ? 'Enter Value Only' : '+ Add Card Details'}
                  </button>
                </div>

                {showTargetCardInput ? (
                  <div className="glass-card p-4 bg-slate-800/50 border border-crypto-lime/20 space-y-3">
                    {/* Quick Select from Watchlist */}
                    {watchlistCards.length > 0 && (
                      <div className="mb-3">
                        <button
                          onClick={() => setShowWatchlistSelector(!showWatchlistSelector)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1"
                        >
                          <Target size={14} />
                          {showWatchlistSelector ? 'Hide Watchlist' : 'Select from Watchlist'}
                        </button>
                      </div>
                    )}

                    {/* Watchlist Card Selector */}
                    {showWatchlistSelector && (
                      <div className="mb-3 max-h-48 overflow-y-auto space-y-2 p-2 bg-slate-900/50 rounded-lg border border-blue-500/20">
                        {watchlistCards.map(card => (
                          <button
                            key={card.id}
                            onClick={() => handleSelectWatchlistCard(card)}
                            className="w-full p-2 rounded-lg bg-slate-800/50 hover:bg-blue-500/10 border border-slate-700/50 hover:border-blue-500/30 transition-all text-left"
                          >
                            <div className="flex items-center gap-2">
                              {card.imageUrl && (
                                <img
                                  src={card.imageUrl}
                                  alt={card.player}
                                  className="w-10 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <div className="text-sm font-medium text-white">{card.player}</div>
                                <div className="text-xs text-slate-400">
                                  {card.year} {card.series}
                                  {card.parallel && ` • ${card.parallel}`}
                                  {card.gradeValue && ` • ${card.gradeValue}`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-blue-400">
                                  {formatCurrency(convertCurrency(card.purchasePrice, card.currency, plannerCurrency), plannerCurrency)}
                                </div>
                                <div className="text-xs text-slate-500">Target</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

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

                      <div>
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

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Target Price * ({plannerCurrency})
                        </label>
                        <input
                          type="number"
                          value={targetCardPrice}
                          onChange={(e) => {
                            setTargetCardPrice(e.target.value);
                            setTargetValue(e.target.value);
                          }}
                          placeholder="e.g., 5000"
                          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none text-sm"
                        />
                      </div>
                    </div>

                    {targetCardPlayer && targetCardYear && targetCardSet && targetCardPrice && (
                      <div className="mt-3 p-3 bg-crypto-lime/10 border border-crypto-lime/30 rounded-lg">
                        <div className="text-sm text-crypto-lime font-medium">
                          {targetCardPlayer} • {targetCardYear} {targetCardSet}
                          {targetCardParallel && ` • ${targetCardParallel}`}
                          {targetCardGrade && ` • ${targetCardGrade}`}
                          {' • '}{formatCurrency(parseFloat(targetCardPrice), plannerCurrency)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="e.g., 5000"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                    />
                    {targetValue && parseFloat(targetValue) > 0 && (
                      <div className="mt-2 text-sm text-slate-400">
                        Generating bundles valued at {formatCurrency(parseFloat(targetValue) * 1.10, plannerCurrency)} - {formatCurrency(parseFloat(targetValue) * 1.20, plannerCurrency)} (10-20% negotiation room)
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Bundle Suggestions (Target Mode) */}
          {mode === 'target' && targetValue && parseFloat(targetValue) > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Bundle Suggestions</h3>
                {loadingSuggestions && (
                  <div className="flex items-center gap-2 text-crypto-lime text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </div>
                )}
              </div>
              {loadingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="text-crypto-lime animate-spin" size={48} />
                  <p className="text-slate-400 text-sm">Generating bundle suggestions...</p>
                </div>
              ) : bundleSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bundleSuggestions.map((suggestion, idx) => (
                    <BundleSuggestionCard
                      key={idx}
                      suggestion={suggestion}
                      targetValue={parseFloat(debouncedTargetValue)}
                      displayCurrency={plannerCurrency}
                      convertPrice={(amount) => formatCurrency(amount, plannerCurrency)}
                      onSelect={() => handleSelectSuggestion(suggestion)}
                      onViewDetails={() => setViewingBundle(suggestion)}
                      selected={selectedSuggestion === suggestion}
                    />
                  ))}
                </div>
              ) : debouncedTargetValue && parseFloat(debouncedTargetValue) > 0 && (
                <div className="text-center py-8 text-slate-400">
                  No suitable bundles found for this target value
                </div>
              )}
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
                  <span className="text-crypto-lime font-bold">{formatCurrency(manualSelectionTotal, plannerCurrency)}</span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {cardsInPlannerCurrency.map(card => (
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
                        <div className="font-bold text-white">{formatCurrency(card.currentValue, plannerCurrency)}</div>
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
                onClick={handleOpenSavePlanModal}
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
        </div>
      </div>

      {/* Bundle Detail Modal */}
      {viewingBundleWithOriginalCards && (
        <BundleDetailModal
          suggestion={viewingBundleWithOriginalCards}
          targetValue={debouncedTargetValue ? parseFloat(debouncedTargetValue) : undefined}
          allCards={availableCards}
          plannerCurrency={plannerCurrency}
          convertPrice={convertCurrency}
          formatPrice={formatCurrency}
          onClose={() => setViewingBundle(null)}
          onSaveAsBundle={handleSaveFromBundle}
        />
      )}

      {/* Save Plan Modal */}
      {showSavePlanModal && (
        <SavePlanModal
          initialCards={savePlanCards}
          initialCashAmount={savePlanCashAmount}
          targetValue={debouncedTargetValue ? parseFloat(debouncedTargetValue) : undefined}
          initialTargetCard={
            showTargetCardInput && targetCardPlayer && targetCardYear && targetCardSet
              ? {
                  player: targetCardPlayer,
                  year: targetCardYear,
                  set: targetCardSet,
                  parallel: targetCardParallel || undefined,
                  grade: targetCardGrade || undefined,
                  price: targetCardPrice || undefined
                }
              : undefined
          }
          allCards={availableCards}
          plannerCurrency={plannerCurrency}
          convertPrice={convertCurrency}
          formatPrice={formatCurrency}
          onSave={handleSavePlan}
          onClose={() => setShowSavePlanModal(false)}
        />
      )}
    </div>
  );
};
