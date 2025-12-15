import React, { useState } from 'react';
import { TradePlan, Currency } from '../types';
import { X, DollarSign, Save } from 'lucide-react';

interface TradePlanExecutionModalProps {
  plan: TradePlan;
  displayCurrency: Currency;
  convertPrice: (amount: number) => string;
  onExecute: (data: {
    receivedValue: number;
    cashBoot: number;
    tradeDate: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export const TradePlanExecutionModal: React.FC<TradePlanExecutionModalProps> = ({
  plan,
  displayCurrency,
  convertPrice,
  onExecute,
  onCancel
}) => {
  const [tradeDate, setTradeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivedValue, setReceivedValue] = useState<string>(plan.targetValue?.toString() || '');
  const [cashBoot, setCashBoot] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  const receivedFMV = parseFloat(receivedValue) || 0;
  const cashAmount = parseFloat(cashBoot) || 0;

  const handleSubmit = async () => {
    if (!receivedValue || receivedFMV <= 0) {
      alert('Please enter the fair market value of what you received');
      return;
    }

    try {
      setLoading(true);
      await onExecute({
        receivedValue: receivedFMV,
        cashBoot: cashAmount,
        tradeDate
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
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="glass-card max-w-2xl w-full p-6">
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

          {/* Bundle Summary */}
          <div className="glass-card p-4 mb-6 bg-slate-800/50">
            <div className="text-sm text-slate-400 mb-2">Cards Given</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-white">
                  {plan.bundleCards.length} card{plan.bundleCards.length !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-slate-500">
                  {plan.bundleCards.map(c => c.cardSnapshot.player).slice(0, 3).join(', ')}
                  {plan.bundleCards.length > 3 && ` +${plan.bundleCards.length - 3} more`}
                </div>
              </div>
              <div className="text-xl font-bold text-crypto-lime">
                {convertPrice(plan.totalBundleValue)}
              </div>
            </div>
          </div>

          {/* Trade Details Form */}
          <div className="space-y-4">
            {/* Trade Date */}
            <div>
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

            {/* Received Value (FMV) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fair Market Value Received ({displayCurrency})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  value={receivedValue}
                  onChange={(e) => setReceivedValue(e.target.value)}
                  placeholder={plan.targetValue ? plan.targetValue.toString() : "Enter FMV"}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none"
                />
              </div>
              {plan.targetValue && (
                <div className="text-xs text-slate-400 mt-1">
                  Target value was {convertPrice(plan.targetValue)}
                </div>
              )}
            </div>

            {/* Cash Boot */}
            <div>
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
            <div className="glass-card p-4 bg-slate-800/30">
              <div className="text-sm font-medium text-slate-300 mb-3">Trade Summary</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">You gave:</span>
                  <span className="text-white font-medium">{convertPrice(plan.totalBundleValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">You received (FMV):</span>
                  <span className="text-white font-medium">{convertPrice(receivedFMV)}</span>
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
                  <span className="text-slate-300 font-medium">Net value received:</span>
                  <span className={`font-bold ${receivedFMV + cashAmount >= plan.totalBundleValue ? 'text-green-400' : 'text-red-400'}`}>
                    {convertPrice(receivedFMV + cashAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSubmit}
              disabled={loading || !receivedValue || receivedFMV <= 0}
              className="flex-1 bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Executing...' : 'Execute Trade & Log Transaction'}
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
              <strong>Note:</strong> This will mark all bundled cards as sold via trade and create transaction records for realized gains/losses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
