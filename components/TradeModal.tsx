import React, { useState } from 'react';
import { Card, Currency, Sport, TradePlan } from '../types';
import { X, Plus, Trash2, ArrowRightLeft } from 'lucide-react';

interface TradeModalProps {
  card?: Card; // The card being traded away (optional if using tradePlan)
  allCards: Card[]; // All cards in portfolio (for selecting received cards)
  onSave: (tradeData: TradeData) => Promise<void>;
  onCancel: () => void;
  displayCurrency: Currency;
  convertPrice: (price: number, from: Currency, to: Currency) => number;
  tradePlan?: TradePlan; // Optional: pre-fill from trade plan
  onPlanCompleted?: (transactionId: string) => void; // Called after successful trade from plan
}

export interface ReceivedCardData {
  player: string;
  year: number;
  sport: Sport;
  brand: string;
  series: string;
  insert: string;
  parallel?: string;
  serialNumber?: string;
  graded: boolean;
  gradeCompany?: string;
  gradeValue?: string;
  fmv: number;
}

export interface TradeData {
  tradeDate: string;
  cardGivenId?: string; // Optional for single card trades
  cardGivenFMV?: number; // Optional for single card trades
  cardGivenCostBasis?: number; // Optional for single card trades
  cardsGiven?: Array<{ cardId: string; fmv: number; costBasis: number }>; // For multi-card trades (trade plans)
  cardsReceived: ReceivedCardData[];
  cashBoot: number; // positive if you received cash, negative if you paid cash
  tradeType: 'even' | 'received-cash' | 'paid-cash';
  tradePlanId?: string; // Link to trade plan if executed from plan
}

export const TradeModal: React.FC<TradeModalProps> = ({
  card,
  allCards,
  onSave,
  onCancel,
  displayCurrency,
  convertPrice
}) => {
  const [tradeDate, setTradeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cardGivenFMV, setCardGivenFMV] = useState<string>(card.currentValue !== -1 ? card.currentValue.toString() : '');

  // Initialize with one empty card
  const [cardsReceived, setCardsReceived] = useState<ReceivedCardData[]>([{
    player: '',
    year: new Date().getFullYear(),
    sport: card.sport, // Default to same sport as traded card
    brand: '',
    series: '',
    insert: '',
    parallel: '',
    serialNumber: '',
    graded: false,
    gradeCompany: '',
    gradeValue: '',
    fmv: 0
  }]);

  const [cashBoot, setCashBoot] = useState<string>('0');
  const [tradeType, setTradeType] = useState<'even' | 'received-cash' | 'paid-cash'>('even');
  const [tradeCurrency, setTradeCurrency] = useState<Currency>(displayCurrency);
  const [loading, setLoading] = useState(false);

  const symbol = tradeCurrency === 'USD' ? '$' : '¥';

  // For cards from breaks or self-rips, use the earliest price history entry as cost basis
  const isFromBreakOrRip = (card.acquisitionSource === 'Break' || card.acquisitionSource === 'Self Rip (Case/Box)')
    && card.priceHistory && card.priceHistory.length > 0;
  const costBasisSource = isFromBreakOrRip ? card.priceHistory[0].value : card.purchasePrice;
  const cardCostBasis = convertPrice(costBasisSource, card.currency, tradeCurrency);

  console.log('[TRADE MODAL] Cost Basis Calculation:', {
    player: card.player,
    acquisitionSource: card.acquisitionSource,
    isFromBreakOrRip,
    costBasisSource,
    cardCurrency: card.currency,
    tradeCurrency,
    cardCostBasis,
    earliestPriceHistoryValue: card.priceHistory?.[0]?.value,
    purchasePrice: card.purchasePrice
  });

  // Auto-fill FMV from last comp if available
  const lastComp = card.priceHistory && card.priceHistory.length > 0
    ? convertPrice(card.priceHistory[card.priceHistory.length - 1].value, card.currency, tradeCurrency)
    : null;

  // Calculate totals
  const totalReceivedFMV = cardsReceived.reduce((sum, c) => sum + (c.fmv || 0), 0);
  const cashAmount = parseFloat(cashBoot) || 0;
  const givenFMV = parseFloat(cardGivenFMV) || 0;

  // Amount Realized (for tax purposes) = Total FMV received + cash received - cash paid
  const amountRealized = totalReceivedFMV + (tradeType === 'received-cash' ? cashAmount : 0) - (tradeType === 'paid-cash' ? cashAmount : 0);

  // Realized Gain/Loss = Amount Realized - Cost Basis of card given
  const realizedGain = amountRealized - cardCostBasis;

  const addReceivedCard = () => {
    setCardsReceived([...cardsReceived, {
      player: '',
      year: new Date().getFullYear(),
      sport: card.sport,
      brand: '',
      series: '',
      insert: '',
      parallel: '',
      serialNumber: '',
      graded: false,
      gradeCompany: '',
      gradeValue: '',
      fmv: 0
    }]);
  };

  const removeReceivedCard = (index: number) => {
    setCardsReceived(cardsReceived.filter((_, i) => i !== index));
  };

  const updateReceivedCard = (index: number, field: keyof ReceivedCardData, value: any) => {
    const updated = [...cardsReceived];
    updated[index] = { ...updated[index], [field]: value };
    setCardsReceived(updated);
  };

  const handleSubmit = async () => {
    // Validation
    if (!tradeDate) {
      alert('Please enter a trade date');
      return;
    }
    if (!givenFMV || givenFMV <= 0) {
      alert('Please enter the FMV of the card you gave away');
      return;
    }
    if (cardsReceived.some(c => !c.player || !c.brand || !c.series || !c.insert || !c.fmv || c.fmv <= 0)) {
      alert('Please fill in all required fields for received cards');
      return;
    }

    setLoading(true);
    try {
      const tradeData: TradeData = {
        tradeDate,
        cardGivenId: card.id,
        cardGivenFMV: givenFMV,
        cardGivenCostBasis: cardCostBasis,
        cardsReceived: cardsReceived.map(c => ({
          ...c,
          fmv: c.fmv
        })),
        cashBoot: cashAmount,
        tradeType
      };

      await onSave(tradeData);
    } catch (error) {
      console.error('Error saving trade:', error);
      alert('Failed to save trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onCancel}
      />

      <div className="relative bg-slate-900/98 backdrop-blur-xl w-full max-w-4xl rounded-2xl border border-slate-800/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/98 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <ArrowRightLeft size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Log Trade</h2>
              <p className="text-xs text-slate-500">Record a card-for-card trade</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Trade Date and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Date of Trade
              </label>
              <input
                type="date"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Currency
              </label>
              <select
                value={tradeCurrency}
                onChange={(e) => setTradeCurrency(e.target.value as Currency)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              >
                <option value="USD">USD ($)</option>
                <option value="CNY">CNY (¥)</option>
              </select>
            </div>
          </div>

          {/* Card Given Away */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-rose-400">You Gave Away</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
              <p className="text-white font-medium text-sm">
                {card.year} {card.brand} {card.series} {card.insert} {card.player}
                {card.parallel && ` (${card.parallel})`}
                {card.serialNumber && ` #${card.serialNumber}`}
              </p>
              {card.graded && (
                <p className="text-emerald-400 text-xs mt-1">
                  {card.gradeCompany} {card.gradeValue}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  FMV on Trade Date {lastComp && (
                    <button
                      onClick={() => setCardGivenFMV(lastComp.toString())}
                      className="ml-2 text-purple-400 hover:text-purple-300 text-[10px]"
                    >
                      (Use last comp: {symbol}{lastComp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </button>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{symbol}</span>
                  <input
                    type="number"
                    value={cardGivenFMV}
                    onChange={(e) => setCardGivenFMV(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Your Original Cost Basis</label>
                <div className="px-3 py-2 bg-slate-900/30 border border-slate-700/30 rounded-lg text-slate-400 text-sm">
                  {symbol}{cardCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {givenFMV > 0 && (
              <div className="mt-3 p-2 bg-slate-900/50 rounded-lg">
                <p className="text-xs text-slate-400">
                  Realized {realizedGain >= 0 ? 'Gain' : 'Loss'}:{' '}
                  <span className={realizedGain >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {realizedGain >= 0 ? '+' : ''}{symbol}{Math.abs(realizedGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Cards Received */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-emerald-400">You Received</span>
              <button
                onClick={addReceivedCard}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium transition-colors"
              >
                <Plus size={14} />
                Add Card
              </button>
            </div>

            <div className="space-y-4">
              {cardsReceived.map((receivedCard, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-slate-400 text-sm font-semibold">Card {index + 1}</span>
                    {cardsReceived.length > 1 && (
                      <button
                        onClick={() => removeReceivedCard(index)}
                        className="p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-rose-400" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Player */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Player *</label>
                      <input
                        type="text"
                        value={receivedCard.player}
                        onChange={(e) => updateReceivedCard(index, 'player', e.target.value)}
                        placeholder="e.g., Victor Wembanyama"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>

                    {/* Year */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Year *</label>
                      <input
                        type="number"
                        value={receivedCard.year}
                        onChange={(e) => updateReceivedCard(index, 'year', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>

                    {/* Sport */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Sport *</label>
                      <select
                        value={receivedCard.sport}
                        onChange={(e) => updateReceivedCard(index, 'sport', e.target.value as Sport)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="Basketball">Basketball</option>
                        <option value="Football">Football</option>
                        <option value="Baseball">Baseball</option>
                        <option value="Soccer">Soccer</option>
                        <option value="Hockey">Hockey</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Brand */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Brand *</label>
                      <input
                        type="text"
                        value={receivedCard.brand}
                        onChange={(e) => updateReceivedCard(index, 'brand', e.target.value)}
                        placeholder="e.g., Panini Prizm"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>

                    {/* Series */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Series *</label>
                      <input
                        type="text"
                        value={receivedCard.series}
                        onChange={(e) => updateReceivedCard(index, 'series', e.target.value)}
                        placeholder="e.g., Base"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>

                    {/* Insert */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Insert *</label>
                      <input
                        type="text"
                        value={receivedCard.insert}
                        onChange={(e) => updateReceivedCard(index, 'insert', e.target.value)}
                        placeholder="e.g., Rookie"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>

                    {/* Parallel */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Parallel</label>
                      <input
                        type="text"
                        value={receivedCard.parallel}
                        onChange={(e) => updateReceivedCard(index, 'parallel', e.target.value)}
                        placeholder="e.g., Silver"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>

                    {/* Serial Number */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Serial #</label>
                      <input
                        type="text"
                        value={receivedCard.serialNumber}
                        onChange={(e) => updateReceivedCard(index, 'serialNumber', e.target.value)}
                        placeholder="e.g., 20/25"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>

                  {/* Graded */}
                  <div className="mt-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={receivedCard.graded}
                        onChange={(e) => updateReceivedCard(index, 'graded', e.target.checked)}
                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500/50 rounded"
                      />
                      <span className="text-sm text-slate-300">Graded</span>
                    </label>
                  </div>

                  {receivedCard.graded && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Grade Company</label>
                        <input
                          type="text"
                          value={receivedCard.gradeCompany}
                          onChange={(e) => updateReceivedCard(index, 'gradeCompany', e.target.value)}
                          placeholder="e.g., PSA"
                          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Grade</label>
                        <input
                          type="text"
                          value={receivedCard.gradeValue}
                          onChange={(e) => updateReceivedCard(index, 'gradeValue', e.target.value)}
                          placeholder="e.g., 10"
                          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>
                  )}

                  {/* FMV */}
                  <div className="mt-3">
                    <label className="block text-xs text-slate-400 mb-1">FMV on Trade Date *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{symbol}</span>
                      <input
                        type="number"
                        value={receivedCard.fmv}
                        onChange={(e) => updateReceivedCard(index, 'fmv', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade Type & Cash Boot */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
            <label className="block text-sm font-semibold text-slate-300 mb-3">Trade Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/30 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="tradeType"
                  checked={tradeType === 'even'}
                  onChange={() => {
                    setTradeType('even');
                    setCashBoot('0');
                  }}
                  className="w-4 h-4 text-purple-500 focus:ring-purple-500/50"
                />
                <span className="text-sm text-slate-300">Even trade (no cash)</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/30 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="tradeType"
                  checked={tradeType === 'received-cash'}
                  onChange={() => setTradeType('received-cash')}
                  className="w-4 h-4 text-purple-500 focus:ring-purple-500/50"
                />
                <span className="text-sm text-slate-300">Card + cash (you received cash)</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/30 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="tradeType"
                  checked={tradeType === 'paid-cash'}
                  onChange={() => setTradeType('paid-cash')}
                  className="w-4 h-4 text-purple-500 focus:ring-purple-500/50"
                />
                <span className="text-sm text-slate-300">Card + cash (you paid cash)</span>
              </label>
            </div>

            {tradeType !== 'even' && (
              <div className="mt-3">
                <label className="block text-xs text-slate-400 mb-1">
                  Cash Amount {tradeType === 'received-cash' ? '(received)' : '(paid)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{symbol}</span>
                  <input
                    type="number"
                    value={cashBoot}
                    onChange={(e) => setCashBoot(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trade Summary */}
          {givenFMV > 0 && totalReceivedFMV > 0 && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-purple-400 mb-3">Trade Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cards Received FMV:</span>
                  <span className="text-white font-mono">{symbol}{totalReceivedFMV.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {tradeType === 'received-cash' && cashAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cash Received:</span>
                    <span className="text-emerald-400 font-mono">+{symbol}{cashAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {tradeType === 'paid-cash' && cashAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cash Paid:</span>
                    <span className="text-rose-400 font-mono">-{symbol}{cashAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="border-t border-slate-700/50 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Realized:</span>
                    <span className="text-white font-mono font-semibold">
                      {symbol}{amountRealized.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-slate-500">
                    <span>Cost Basis (Card Given):</span>
                    <span className="font-mono">
                      {symbol}{cardCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-slate-700/50">
                    <span className="text-slate-400">Realized {realizedGain >= 0 ? 'Gain' : 'Loss'}:</span>
                    <span className={`font-mono font-semibold ${realizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {realizedGain >= 0 ? '+' : ''}{symbol}{Math.abs(realizedGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800/50 px-6 py-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !givenFMV || cardsReceived.some(c => !c.player || !c.brand || !c.series || !c.insert || !c.fmv)}
            className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-white font-semibold transition-colors"
          >
            {loading ? 'Confirming Trade...' : 'Confirm Trade'}
          </button>
        </div>
      </div>
    </div>
  );
};
