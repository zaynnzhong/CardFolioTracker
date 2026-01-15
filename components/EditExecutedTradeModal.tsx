import React, { useState, useMemo } from 'react';
import { TradePlan, Currency, ReceivedCardInput, Card, BundledCard } from '../types';
import { X, DollarSign, Save, Plus, Trash2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';

interface EditExecutedTradeModalProps {
  plan: TradePlan;
  allCards: Card[];
  plannerCurrency: Currency;
  convertPrice: (amount: number, from: Currency, to: Currency) => number;
  formatPrice: (amount: number, currency: Currency) => string;
  onSave: (data: {
    receivedValue: number;
    cashBoot: number;
    tradeDate: string;
    receivedCards: ReceivedCardInput[];
    bundleCards: BundledCard[];
  }) => Promise<void>;
  onClose: () => void;
}

const emptyCard = (currency: Currency): ReceivedCardInput => ({
  player: '',
  year: new Date().getFullYear(),
  brand: '',
  series: '',
  insert: 'Base',
  parallel: '',
  serialNumber: '',
  graded: false,
  gradeCompany: '',
  gradeValue: '',
  currentValue: 0,
  currency,
  notes: ''
});

export const EditExecutedTradeModal: React.FC<EditExecutedTradeModalProps> = ({
  plan,
  allCards,
  plannerCurrency,
  convertPrice,
  formatPrice,
  onSave,
  onClose
}) => {
  // Initialize with existing data
  const [tradeDate, setTradeDate] = useState<string>(
    plan.executedDate ? new Date(plan.executedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [cashBoot, setCashBoot] = useState<string>((plan.executedCashBoot || 0).toString());
  const [loading, setLoading] = useState(false);
  const [receivedCards, setReceivedCards] = useState<ReceivedCardInput[]>(
    plan.executedReceivedCards && plan.executedReceivedCards.length > 0
      ? plan.executedReceivedCards
      : [emptyCard(plannerCurrency)]
  );
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));

  // Bundle cards management
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(
    new Set(plan.bundleCards.map(bc => bc.cardId))
  );

  const cashAmount = parseFloat(cashBoot) || 0;

  // Get available cards for bundle selection (not sold, not watchlist, or already in this trade)
  const availableCards = useMemo(() => {
    return allCards.filter(c =>
      (!c.sold && !c.watchlist && c.currentValue > 0) ||
      (c.tradePlanId === plan._id) // Include cards that were part of this trade
    );
  }, [allCards, plan._id]);

  // Calculate bundle total
  const bundleTotal = useMemo(() => {
    return Array.from(selectedCardIds).reduce((sum, cardId) => {
      const card = availableCards.find(c => c.id === cardId);
      if (card) {
        return sum + convertPrice(card.currentValue, card.currency, plannerCurrency);
      }
      // Fallback to plan data if card not found
      const bundledCard = plan.bundleCards.find(bc => bc.cardId === cardId);
      return sum + (bundledCard?.currentValueAtPlanTime || 0);
    }, 0);
  }, [selectedCardIds, availableCards, plan.bundleCards, plannerCurrency, convertPrice]);

  // Calculate total received value from cards
  const totalReceivedValue = receivedCards.reduce((sum, card) => sum + (card.currentValue || 0), 0);

  const handleAddCard = () => {
    setReceivedCards([...receivedCards, emptyCard(plannerCurrency)]);
    setExpandedCards(new Set([...expandedCards, receivedCards.length]));
  };

  const handleRemoveCard = (index: number) => {
    if (receivedCards.length > 0) {
      const newCards = receivedCards.filter((_, i) => i !== index);
      setReceivedCards(newCards.length > 0 ? newCards : [emptyCard(plannerCurrency)]);
      const newExpanded = new Set(expandedCards);
      newExpanded.delete(index);
      setExpandedCards(newExpanded);
    }
  };

  const handleCardChange = (index: number, field: keyof ReceivedCardInput, value: any) => {
    const newCards = [...receivedCards];
    newCards[index] = { ...newCards[index], [field]: value };
    setReceivedCards(newCards);
  };

  const toggleCardExpanded = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const toggleBundleCard = (cardId: string) => {
    const newSelected = new Set(selectedCardIds);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCardIds(newSelected);
  };

  const isCardValid = (card: ReceivedCardInput) => {
    return card.player.trim() !== '' && card.currentValue > 0;
  };

  const allCardsValid = receivedCards.length === 0 || receivedCards.every(c => !c.player || isCardValid(c));
  const hasValidReceivedCards = receivedCards.some(c => c.player && isCardValid(c));

  const handleSubmit = async () => {
    if (!allCardsValid) {
      alert('Please fill in player name and value for all received cards');
      return;
    }

    if (selectedCardIds.size === 0) {
      alert('Please select at least one card to give in the trade');
      return;
    }

    try {
      setLoading(true);

      // Build bundle cards from selection
      const bundleCards: BundledCard[] = Array.from(selectedCardIds).map(cardId => {
        const card = availableCards.find(c => c.id === cardId);
        if (card) {
          return {
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
          };
        }
        // Fallback to existing plan data
        const existing = plan.bundleCards.find(bc => bc.cardId === cardId);
        return existing!;
      }).filter(Boolean);

      // Filter out empty received cards
      const validReceivedCards = receivedCards.filter(c => c.player && isCardValid(c));

      await onSave({
        receivedValue: totalReceivedValue,
        cashBoot: cashAmount,
        tradeDate,
        receivedCards: validReceivedCards,
        bundleCards
      });
    } catch (error) {
      console.error('Failed to update trade:', error);
      alert('Failed to update trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center pt-8 pb-20">
        <div className="glass-card max-w-4xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Update Trade</h2>
              <p className="text-slate-400 text-sm mt-1">{plan.planName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="text-slate-400" size={24} />
            </button>
          </div>

          {/* Cards Given Section */}
          <div className="mb-6">
            <div className="text-sm font-medium text-red-400 mb-3">Cards You're Giving</div>
            <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
              {availableCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => toggleBundleCard(card.id)}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    selectedCardIds.has(card.id)
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 ${selectedCardIds.has(card.id) ? 'text-red-400' : 'text-slate-400'}`}>
                      {selectedCardIds.has(card.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>

                    {card.imageUrl && (
                      <img
                        src={card.imageUrl}
                        alt={card.player}
                        className="w-10 h-12 object-cover rounded"
                      />
                    )}

                    <div className="flex-1 text-left">
                      <div className="font-medium text-white text-sm">{card.player}</div>
                      <div className="text-xs text-slate-400">
                        {card.year} {card.series} {card.parallel && `- ${card.parallel}`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-white text-sm">
                        {formatPrice(convertPrice(card.currentValue, card.currency, plannerCurrency), plannerCurrency)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Selected: {selectedCardIds.size} cards - {formatPrice(bundleTotal, plannerCurrency)}
            </div>
          </div>

          {/* Trade Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Trade Date
            </label>
            <input
              type="date"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-crypto-lime focus:outline-none"
            />
          </div>

          {/* Cards Received Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-green-400">Cards You're Receiving</div>
              <button
                onClick={handleAddCard}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
              >
                <Plus size={16} />
                Add Card
              </button>
            </div>

            <div className="space-y-3">
              {receivedCards.map((card, index) => (
                <div key={index} className="glass-card bg-green-500/5 border border-green-500/20 rounded-xl overflow-hidden">
                  {/* Card Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-green-500/10 transition-colors"
                    onClick={() => toggleCardExpanded(index)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-medium">Card {index + 1}</span>
                      {card.player && (
                        <span className="text-slate-300 text-sm">
                          {card.player} {card.year && `- ${card.year}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {card.currentValue > 0 && (
                        <span className="text-green-400 font-medium text-sm">
                          +{card.currency === 'CNY' ? '¥' : '$'}{card.currentValue.toLocaleString()}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveCard(index); }}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                      {expandedCards.has(index) ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Card Details Form */}
                  {expandedCards.has(index) && (
                    <div className="p-4 pt-0 space-y-3 border-t border-green-500/20">
                      {/* Row 1: Player & Year */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Player Name *</label>
                          <input
                            type="text"
                            value={card.player}
                            onChange={(e) => handleCardChange(index, 'player', e.target.value)}
                            placeholder="e.g., LeBron James"
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Year</label>
                          <input
                            type="number"
                            value={card.year}
                            onChange={(e) => handleCardChange(index, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-crypto-lime focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Row 2: Brand & Series */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Brand</label>
                          <input
                            type="text"
                            value={card.brand}
                            onChange={(e) => handleCardChange(index, 'brand', e.target.value)}
                            placeholder="e.g., Panini Prizm"
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Series</label>
                          <input
                            type="text"
                            value={card.series}
                            onChange={(e) => handleCardChange(index, 'series', e.target.value)}
                            placeholder="e.g., National Treasures"
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Row 3: Insert & Parallel */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Insert</label>
                          <input
                            type="text"
                            value={card.insert}
                            onChange={(e) => handleCardChange(index, 'insert', e.target.value)}
                            placeholder="e.g., RPA, Base"
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Parallel</label>
                          <input
                            type="text"
                            value={card.parallel || ''}
                            onChange={(e) => handleCardChange(index, 'parallel', e.target.value)}
                            placeholder="e.g., Silver, Gold"
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Row 4: Serial & Grading */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Serial Number</label>
                          <input
                            type="text"
                            value={card.serialNumber || ''}
                            onChange={(e) => handleCardChange(index, 'serialNumber', e.target.value)}
                            placeholder="e.g., 15/99"
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={card.graded}
                              onChange={(e) => handleCardChange(index, 'graded', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-crypto-lime focus:ring-crypto-lime"
                            />
                            <span className="text-sm text-slate-300">Graded</span>
                          </label>
                        </div>
                      </div>

                      {/* Grading Details (if graded) */}
                      {card.graded && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Grade Company</label>
                            <select
                              value={card.gradeCompany || ''}
                              onChange={(e) => handleCardChange(index, 'gradeCompany', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-crypto-lime focus:outline-none"
                            >
                              <option value="">Select...</option>
                              <option value="PSA">PSA</option>
                              <option value="BGS">BGS</option>
                              <option value="SGC">SGC</option>
                              <option value="CGC">CGC</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Grade</label>
                            <input
                              type="text"
                              value={card.gradeValue || ''}
                              onChange={(e) => handleCardChange(index, 'gradeValue', e.target.value)}
                              placeholder="e.g., 10, 9.5"
                              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Row 5: Value & Currency */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">FMV (Cost Basis) *</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                              type="number"
                              value={card.currentValue || ''}
                              onChange={(e) => handleCardChange(index, 'currentValue', parseFloat(e.target.value) || 0)}
                              placeholder="Enter value"
                              className="w-full pl-8 pr-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Currency</label>
                          <select
                            value={card.currency}
                            onChange={(e) => handleCardChange(index, 'currency', e.target.value as Currency)}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-crypto-lime focus:outline-none"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="CNY">CNY (yuan)</option>
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
                        <input
                          type="text"
                          value={card.notes || ''}
                          onChange={(e) => handleCardChange(index, 'notes', e.target.value)}
                          placeholder="Any additional notes"
                          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total Received Summary */}
            {hasValidReceivedCards && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-medium">Total Cards Received:</span>
                  <span className="text-green-400 font-bold text-lg">
                    +{formatPrice(totalReceivedValue, plannerCurrency)} ({receivedCards.filter(c => c.player && isCardValid(c)).length} card{receivedCards.filter(c => c.player && isCardValid(c)).length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cash Boot */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cash Boot ({plannerCurrency})
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="number"
                value={cashBoot}
                onChange={(e) => setCashBoot(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Positive if you received cash, negative if you paid cash
            </div>
          </div>

          {/* Trade Summary */}
          <div className="glass-card p-4 bg-slate-800/30 mb-6">
            <div className="text-sm font-medium text-slate-300 mb-3">Trade Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-red-400">You gave:</span>
                <span className="text-red-400 font-medium">-{formatPrice(bundleTotal, plannerCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">You received (cards):</span>
                <span className="text-green-400 font-medium">+{formatPrice(totalReceivedValue, plannerCurrency)}</span>
              </div>
              {cashAmount !== 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Cash boot:</span>
                  <span className={`font-medium ${cashAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {cashAmount > 0 ? '+' : ''}{formatPrice(Math.abs(cashAmount), plannerCurrency)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-700/50 flex justify-between">
                <span className="text-slate-300 font-medium">Net result:</span>
                <span className={`font-bold ${totalReceivedValue + cashAmount >= bundleTotal ? 'text-green-400' : 'text-red-400'}`}>
                  {totalReceivedValue + cashAmount >= bundleTotal ? '+' : ''}
                  {formatPrice(totalReceivedValue + cashAmount - bundleTotal, plannerCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading || !allCardsValid || selectedCardIds.size === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Updating...' : 'Update Trade'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700/50 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Important Note */}
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="text-xs text-yellow-400">
              <strong>Note:</strong> This will revert the previous trade and re-execute with the updated cards. Previously received cards will be removed and new ones created.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
