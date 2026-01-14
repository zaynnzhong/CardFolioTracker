import React, { useState } from 'react';
import { TradePlan, Currency, ReceivedCardInput, Sport } from '../types';
import { X, DollarSign, Save, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface TradePlanExecutionModalProps {
  plan: TradePlan;
  displayCurrency: Currency;
  convertPrice: (amount: number) => string;
  onExecute: (data: {
    receivedValue: number;
    cashBoot: number;
    tradeDate: string;
    receivedCards: ReceivedCardInput[];
  }) => Promise<void>;
  onCancel: () => void;
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

export const TradePlanExecutionModal: React.FC<TradePlanExecutionModalProps> = ({
  plan,
  displayCurrency,
  convertPrice,
  onExecute,
  onCancel
}) => {
  const [tradeDate, setTradeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cashBoot, setCashBoot] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [receivedCards, setReceivedCards] = useState<ReceivedCardInput[]>([emptyCard(displayCurrency)]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));

  const cashAmount = parseFloat(cashBoot) || 0;

  // Calculate total received value from cards
  const totalReceivedValue = receivedCards.reduce((sum, card) => sum + (card.currentValue || 0), 0);

  const handleAddCard = () => {
    setReceivedCards([...receivedCards, emptyCard(displayCurrency)]);
    setExpandedCards(new Set([...expandedCards, receivedCards.length]));
  };

  const handleRemoveCard = (index: number) => {
    if (receivedCards.length > 1) {
      const newCards = receivedCards.filter((_, i) => i !== index);
      setReceivedCards(newCards);
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

  const isCardValid = (card: ReceivedCardInput) => {
    return card.player.trim() !== '' && card.currentValue > 0;
  };

  const allCardsValid = receivedCards.every(isCardValid);

  const handleSubmit = async () => {
    if (!allCardsValid) {
      alert('Please fill in player name and value for all received cards');
      return;
    }

    try {
      setLoading(true);
      await onExecute({
        receivedValue: totalReceivedValue,
        cashBoot: cashAmount,
        tradeDate,
        receivedCards
      });
    } catch (error) {
      console.error('Failed to execute trade:', error);
      alert('Failed to execute trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center pt-8 pb-20">
        <div className="glass-card max-w-3xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Execute Trade</h2>
              <p className="text-slate-400 text-sm mt-1">{plan.planName}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="text-slate-400" size={24} />
            </button>
          </div>

          {/* Cards Given Summary */}
          <div className="glass-card p-4 mb-6 bg-red-500/10 border border-red-500/30">
            <div className="text-sm text-red-400 mb-2 font-medium">Cards You're Giving</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-white">
                  {plan.bundleCards.length} card{plan.bundleCards.length !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-slate-400">
                  {plan.bundleCards.map(c => c.cardSnapshot.player).slice(0, 3).join(', ')}
                  {plan.bundleCards.length > 3 && ` +${plan.bundleCards.length - 3} more`}
                </div>
              </div>
              <div className="text-xl font-bold text-red-400">
                -{convertPrice(plan.totalBundleValue)}
              </div>
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
                      {receivedCards.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveCard(index); }}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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
                            <option value="CNY">CNY (¥)</option>
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
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-green-400 font-medium">Total Cards Received:</span>
                <span className="text-green-400 font-bold text-lg">
                  +{convertPrice(totalReceivedValue)} ({receivedCards.length} card{receivedCards.length !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
          </div>

          {/* Cash Boot */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cash Boot ({displayCurrency})
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
                <span className="text-red-400 font-medium">-{convertPrice(plan.totalBundleValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">You received (cards):</span>
                <span className="text-green-400 font-medium">+{convertPrice(totalReceivedValue)}</span>
              </div>
              {cashAmount !== 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Cash boot:</span>
                  <span className={`font-medium ${cashAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {cashAmount > 0 ? '+' : ''}{convertPrice(Math.abs(cashAmount))}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-700/50 flex justify-between">
                <span className="text-slate-300 font-medium">Net result:</span>
                <span className={`font-bold ${totalReceivedValue + cashAmount >= plan.totalBundleValue ? 'text-green-400' : 'text-red-400'}`}>
                  {totalReceivedValue + cashAmount >= plan.totalBundleValue ? '+' : ''}
                  {convertPrice(totalReceivedValue + cashAmount - plan.totalBundleValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading || !allCardsValid}
              className="flex-1 bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Executing...' : 'Execute Trade'}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-slate-700/50 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Important Note */}
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="text-xs text-yellow-400">
              <strong>Note:</strong> This will mark all bundled cards as sold via trade and add the received cards to your portfolio with "Trade" as acquisition source.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
