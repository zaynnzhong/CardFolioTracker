import React, { useState, useEffect } from 'react';
import { TradePlan, Currency, Card, BundledCard, ReceivedCardInput } from '../types';
import { ArrowLeft, FileText, Calendar, DollarSign, Package, CheckCircle, PlayCircle, Edit2, XCircle, Save, Target, RefreshCw, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { dataService } from '../services/dataService';
import { EditTradePlanModal } from './EditTradePlanModal';
import { EditExecutedTradeModal } from './EditExecutedTradeModal';

interface TradePlanDetailProps {
  planId: string;
  displayCurrency: Currency;
  convertPrice: (amount: number) => string;
  convertCurrency: (amount: number, from: Currency, to: Currency) => number;
  formatCurrency: (amount: number, currency: Currency) => string;
  allCards: Card[];
  getIdToken: () => Promise<string | null>;
  onBack: () => void;
  onExecuteTrade: (plan: TradePlan) => void;
  onReExecuteTrade?: (plan: TradePlan, tradeData: {
    receivedValue: number;
    cashBoot: number;
    tradeDate: string;
    receivedCards: ReceivedCardInput[];
  }) => Promise<void>;
}

export const TradePlanDetail: React.FC<TradePlanDetailProps> = ({
  planId,
  displayCurrency,
  convertPrice,
  convertCurrency,
  formatCurrency,
  allCards,
  getIdToken,
  onBack,
  onExecuteTrade,
  onReExecuteTrade
}) => {
  const [plan, setPlan] = useState<TradePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditExecutedModal, setShowEditExecutedModal] = useState(false);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await dataService.getTradePlan(planId, getIdToken);
      if (data) {
        setPlan(data);
        setNotes(data.notes || '');
      }
    } catch (error) {
      console.error('Failed to load trade plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!plan) return;

    try {
      setSavingNotes(true);
      const updated = await dataService.updateTradePlan(
        plan._id,
        { notes: notes.trim() || undefined },
        getIdToken
      );
      setPlan(updated);
      setEditingNotes(false);
    } catch (error) {
      console.error('Failed to update notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCancelPlan = async () => {
    if (!plan) return;

    if (!confirm('Are you sure you want to cancel this trade plan?')) {
      return;
    }

    try {
      const updated = await dataService.updateTradePlan(
        plan._id,
        { status: 'cancelled' },
        getIdToken
      );
      setPlan(updated);
    } catch (error) {
      console.error('Failed to cancel plan:', error);
      alert('Failed to cancel plan. Please try again.');
    }
  };

  const handleSaveEdit = async (updates: {
    planName: string;
    bundleCards: BundledCard[];
    cashAmount?: number;
    cashCurrency?: 'USD' | 'CNY';
    totalBundleValue: number;
    notes?: string;
    targetValue?: number;
  }) => {
    if (!plan) return;

    try {
      const updated = await dataService.updateTradePlan(
        plan._id,
        updates,
        getIdToken
      );
      setPlan(updated);
      setNotes(updated.notes || '');
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update trade plan:', error);
      alert('Failed to update trade plan. Please try again.');
    }
  };

  const handleReExecute = async (tradeData: {
    receivedValue: number;
    cashBoot: number;
    tradeDate: string;
    receivedCards: ReceivedCardInput[];
    bundleCards: BundledCard[];
  }) => {
    if (!plan || !onReExecuteTrade) return;

    try {
      // First update the plan with new bundle cards
      const updatedPlan = await dataService.updateTradePlan(
        plan._id,
        { bundleCards: tradeData.bundleCards },
        getIdToken
      );
      setPlan(updatedPlan);

      // Then re-execute with new data
      await onReExecuteTrade(updatedPlan, {
        receivedValue: tradeData.receivedValue,
        cashBoot: tradeData.cashBoot,
        tradeDate: tradeData.tradeDate,
        receivedCards: tradeData.receivedCards
      });

      // Reload the plan to get updated execution details
      await loadPlan();
      setShowEditExecutedModal(false);
    } catch (error) {
      console.error('Failed to re-execute trade:', error);
      alert('Failed to update trade. Please try again.');
    }
  };

  const getStatusBadge = (status: TradePlan['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-sm font-medium text-yellow-400">Pending</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-sm font-medium text-green-400">Completed</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg">
            <XCircle size={16} className="text-red-400" />
            <span className="text-sm font-medium text-red-400">Cancelled</span>
          </div>
        );
    }
  };

  if (loading || !plan) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading trade plan...</div>
      </div>
    );
  }

  // Calculate current total value (using live card values)
  const currentCardsTotal = plan.bundleCards.reduce((sum, bundledCard) => {
    const currentCard = allCards.find(c => c.id === bundledCard.cardId);
    const cardValue = currentCard
      ? convertCurrency(currentCard.currentValue, currentCard.currency, plan.cashCurrency || displayCurrency)
      : bundledCard.currentValueAtPlanTime;
    return sum + cardValue;
  }, 0);

  const currentTotalValue = currentCardsTotal + (plan.cashAmount || 0);

  const percentOverTarget = plan.targetValue
    ? ((currentTotalValue - plan.targetValue) / plan.targetValue) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Trade Plans</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{plan.planName}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                Created: {new Date(plan.createdAt).toLocaleDateString()}
              </div>
              {plan.updatedAt !== plan.createdAt && (
                <div className="flex items-center gap-1">
                  Updated: {new Date(plan.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          {getStatusBadge(plan.status)}
        </div>
      </div>

      {/* Target Card Display */}
      {plan.targetCard && (
        <div className="glass-card p-4 bg-gradient-to-br from-crypto-lime/10 to-green-500/5 border-crypto-lime/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-crypto-lime/20 rounded-lg">
              <Target size={20} className="text-crypto-lime" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-400 mb-1">Trading For</div>
              <div className="text-lg font-bold text-white">
                {plan.targetCard.player}
              </div>
              <div className="text-sm text-slate-300">
                {plan.targetCard.year} {plan.targetCard.set}
                {plan.targetCard.parallel && ` • ${plan.targetCard.parallel}`}
                {plan.targetCard.grade && ` • ${plan.targetCard.grade}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Target Value */}
        {plan.targetValue && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <DollarSign size={18} />
              <span className="text-sm">Target Value</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(plan.targetValue, plan.cashCurrency || displayCurrency)}
            </div>
          </div>
        )}

        {/* Bundle Total */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Package size={18} />
            <span className="text-sm">Bundle Total</span>
          </div>
          <div className="text-2xl font-bold text-crypto-lime">
            {formatCurrency(currentTotalValue, plan.cashCurrency || displayCurrency)}
          </div>
          {plan.targetValue && (
            <div className="text-xs text-slate-500 mt-1">
              {percentOverTarget > 0 ? '+' : ''}{percentOverTarget.toFixed(1)}% {percentOverTarget >= 0 ? 'over' : 'under'} target
            </div>
          )}
        </div>

        {/* Card Count */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <FileText size={18} />
            <span className="text-sm">Cards in Bundle</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {plan.bundleCards.length}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Notes</h2>
          {plan.status === 'pending' && !editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-crypto-lime hover:text-crypto-lime/80 transition-colors"
            >
              <Edit2 size={18} />
            </button>
          )}
        </div>

        {editingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this trade plan..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-crypto-lime focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-2 bg-crypto-lime text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                {savingNotes ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingNotes(false);
                  setNotes(plan.notes || '');
                }}
                className="px-4 py-2 bg-slate-700/50 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-slate-300">
            {plan.notes || <span className="text-slate-500 italic">No notes added</span>}
          </div>
        )}
      </div>

      {/* Bundled Cards */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Bundled Cards</h2>

        <div className="space-y-3">
          {plan.bundleCards.map((bundledCard, idx) => {
            // Try to find current card value
            const currentCard = allCards.find(c => c.id === bundledCard.cardId);
            const currentValue = currentCard
              ? convertCurrency(currentCard.currentValue, currentCard.currency, plan.cashCurrency || displayCurrency)
              : bundledCard.currentValueAtPlanTime;

            return (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
              >
                {bundledCard.cardSnapshot.imageUrl && (
                  <img
                    src={bundledCard.cardSnapshot.imageUrl}
                    alt={bundledCard.cardSnapshot.player}
                    className="w-16 h-20 object-cover rounded"
                  />
                )}

                <div className="flex-1">
                  <div className="font-medium text-white mb-1">
                    {bundledCard.cardSnapshot.player}
                  </div>
                  <div className="text-sm text-slate-400">
                    {bundledCard.cardSnapshot.year} {bundledCard.cardSnapshot.set}
                    {bundledCard.cardSnapshot.parallel && ` • ${bundledCard.cardSnapshot.parallel}`}
                    {bundledCard.cardSnapshot.grade && ` • ${bundledCard.cardSnapshot.grade}`}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-white">
                    {formatCurrency(currentValue, plan.cashCurrency || displayCurrency)}
                  </div>
                  {currentCard && (
                    <div className="text-xs text-slate-500">current value</div>
                  )}
                  {!currentCard && (
                    <div className="text-xs text-slate-500">at plan time</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50">
          {plan.cashAmount && plan.cashAmount > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 font-medium">Cash Amount</span>
              <span className="text-lg font-bold text-yellow-400">
                {formatCurrency(plan.cashAmount, plan.cashCurrency || displayCurrency)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Total Bundle Value</span>
            <span className="text-xl font-bold text-crypto-lime">
              {formatCurrency(currentTotalValue, plan.cashCurrency || displayCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Received Cards (for completed trades) */}
      {plan.status === 'completed' && plan.executedReceivedCards && plan.executedReceivedCards.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowDownRight className="text-green-400" size={20} />
            Cards Received
          </h2>

          <div className="space-y-3">
            {plan.executedReceivedCards.map((card, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20"
              >
                {card.imageUrl && (
                  <img
                    src={card.imageUrl}
                    alt={card.player}
                    className="w-16 h-20 object-cover rounded"
                  />
                )}

                <div className="flex-1">
                  <div className="font-medium text-white mb-1">
                    {card.player}
                  </div>
                  <div className="text-sm text-slate-400">
                    {card.year} {card.series}
                    {card.parallel && ` • ${card.parallel}`}
                    {card.gradeValue && ` • ${card.gradeValue}`}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-green-400">
                    {formatCurrency(card.currentValue, card.currency)}
                  </div>
                  <div className="text-xs text-slate-500">received value</div>
                </div>
              </div>
            ))}
          </div>

          {plan.executedCashBoot && plan.executedCashBoot > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Cash Boot Received</span>
                <span className="text-lg font-bold text-yellow-400">
                  {formatCurrency(plan.executedCashBoot, plan.cashCurrency || displayCurrency)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trade Summary (for completed trades) */}
      {plan.status === 'completed' && plan.executedDate && (
        <div className="glass-card p-4 bg-slate-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Trade Executed:</span>
            <span className="text-white font-medium">{new Date(plan.executedDate).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {plan.status === 'pending' && (
          <>
            {/* Edit button - for pending trades */}
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Edit2 size={20} />
              Edit Plan
            </button>
            <button
              onClick={() => onExecuteTrade(plan)}
              className="flex-1 bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <PlayCircle size={20} />
              Execute Trade
            </button>
            <button
              onClick={handleCancelPlan}
              className="px-6 py-4 bg-red-500/20 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/30 transition-colors"
            >
              Cancel Plan
            </button>
          </>
        )}

        {plan.status === 'completed' && onReExecuteTrade && (
          <button
            onClick={() => setShowEditExecutedModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Update Trade
          </button>
        )}
      </div>

      {plan.status === 'completed' && (
        <div className="glass-card p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={20} />
            <span className="font-medium">
              This trade has been executed. You can update the trade details above.
            </span>
          </div>
        </div>
      )}

      {plan.status === 'cancelled' && (
        <div className="glass-card p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <XCircle size={20} />
            <span className="font-medium">
              This trade plan has been cancelled.
            </span>
          </div>
        </div>
      )}

      {/* Edit Modal (for pending plans) */}
      {showEditModal && (
        <EditTradePlanModal
          plan={plan}
          allCards={allCards}
          plannerCurrency={plan.cashCurrency || displayCurrency}
          convertPrice={convertCurrency}
          formatPrice={formatCurrency}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Edit Executed Trade Modal (for completed trades) */}
      {showEditExecutedModal && plan.status === 'completed' && (
        <EditExecutedTradeModal
          plan={plan}
          allCards={allCards}
          plannerCurrency={plan.cashCurrency || displayCurrency}
          convertPrice={convertCurrency}
          formatPrice={formatCurrency}
          onSave={handleReExecute}
          onClose={() => setShowEditExecutedModal(false)}
        />
      )}
    </div>
  );
};
