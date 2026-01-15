import React, { useState, useEffect } from 'react';
import { TradePlan, Currency } from '../types';
import { Folder, Clock, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react';
import { dataService } from '../services/dataService';

interface TradePlansListProps {
  displayCurrency: Currency;
  convertPrice: (amount: number) => string;
  formatCurrency: (amount: number, currency: Currency) => string;
  getIdToken: () => Promise<string | null>;
  onViewPlan: (planId: string) => void;
  onRefresh?: () => void;
  statusFilter?: 'pending' | 'completed' | 'cancelled';
}

export const TradePlansList: React.FC<TradePlansListProps> = ({
  displayCurrency,
  convertPrice,
  formatCurrency,
  getIdToken,
  onViewPlan,
  onRefresh,
  statusFilter
}) => {
  const [plans, setPlans] = useState<TradePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, [statusFilter]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await dataService.getTradePlans(getIdToken, statusFilter);
      setPlans(data);
    } catch (error) {
      console.error('Failed to load trade plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this trade plan?')) {
      return;
    }

    try {
      setDeletingId(planId);
      await dataService.deleteTradePlan(planId, getIdToken);
      setPlans(plans.filter(p => p._id !== planId));
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to delete trade plan:', error);
      alert('Failed to delete trade plan. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: TradePlan['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <Clock size={14} className="text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Pending</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-xs font-medium text-green-400">Completed</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
            <XCircle size={14} className="text-red-400" />
            <span className="text-xs font-medium text-red-400">Cancelled</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading trade plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Folder className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Trade Plans</h3>
          <p className="text-slate-400">
            {statusFilter === 'pending'
              ? "You haven't created any trade plans yet."
              : statusFilter === 'completed'
              ? "No executed trades yet."
              : "No trade plans found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <button
              key={plan._id}
              onClick={() => onViewPlan(plan._id)}
              className="glass-card p-4 text-left hover:border-crypto-lime transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate mb-1">
                    {plan.planName}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {getStatusBadge(plan.status)}
              </div>

              {/* Target Value (if set) */}
              {plan.targetValue && (
                <div className="mb-3 pb-3 border-b border-slate-700/50">
                  <div className="text-xs text-slate-400">Target Value</div>
                  <div className="text-lg font-bold text-slate-300">
                    {formatCurrency(plan.targetValue, plan.cashCurrency || displayCurrency)}
                  </div>
                </div>
              )}

              {/* Bundle Info */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-400">Bundle Total</div>
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(plan.totalBundleValue, plan.cashCurrency || displayCurrency)}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {plan.bundleCards.length} card{plan.bundleCards.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Card Thumbnails */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {plan.bundleCards.slice(0, 4).map((bundledCard, idx) => (
                  <div key={idx} className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden bg-slate-800/50">
                    {bundledCard.cardSnapshot.imageUrl ? (
                      <img
                        src={bundledCard.cardSnapshot.imageUrl}
                        alt={bundledCard.cardSnapshot.player}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-slate-500 text-center p-1">
                          {bundledCard.cardSnapshot.player}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {plan.bundleCards.length > 4 && (
                  <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      +{plan.bundleCards.length - 4}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                <div className="flex-1 flex items-center gap-1 text-xs text-crypto-lime group-hover:text-crypto-lime transition-colors">
                  <Eye size={14} />
                  <span>View Details</span>
                </div>
                {plan.status === 'pending' && (
                  <button
                    onClick={(e) => handleDelete(plan._id, e)}
                    disabled={deletingId === plan._id}
                    className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
