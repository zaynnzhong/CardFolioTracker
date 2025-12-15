import React from 'react';
import { BundleSuggestion, Currency } from '../types';
import { Package, TrendingUp, Eye } from 'lucide-react';

interface BundleSuggestionCardProps {
  suggestion: BundleSuggestion;
  targetValue?: number;
  displayCurrency: Currency;
  convertPrice: (amount: number) => string;
  onSelect: () => void;
  onViewDetails: () => void;
  selected?: boolean;
}

export const BundleSuggestionCard: React.FC<BundleSuggestionCardProps> = ({
  suggestion,
  targetValue,
  displayCurrency,
  convertPrice,
  onSelect,
  onViewDetails,
  selected = false
}) => {
  const getPercentageColor = (percent: number) => {
    if (percent >= 10 && percent <= 15) return 'text-green-400';
    if (percent >= 15 && percent <= 20) return 'text-crypto-lime';
    return 'text-yellow-400';
  };

  const getPercentageBadgeColor = (percent: number) => {
    if (percent >= 10 && percent <= 15) return 'bg-green-500/20 border-green-500/30';
    if (percent >= 15 && percent <= 20) return 'bg-crypto-lime/20 border-crypto-lime/30';
    return 'bg-yellow-500/20 border-yellow-500/30';
  };

  return (
    <div
      className={`w-full text-left glass-card p-4 transition-all duration-200 ${
        selected
          ? 'ring-2 ring-crypto-lime border-crypto-lime/50'
          : 'hover:border-slate-600'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="text-crypto-lime" size={18} />
          <h3 className="font-semibold text-white">
            {suggestion.cardCount} Card{suggestion.cardCount !== 1 ? 's' : ''}
          </h3>
        </div>

        {targetValue && (
          <div className={`px-2 py-1 rounded-lg border ${getPercentageBadgeColor(suggestion.percentOverTarget)}`}>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className={getPercentageColor(suggestion.percentOverTarget)} />
              <span className={`text-xs font-bold ${getPercentageColor(suggestion.percentOverTarget)}`}>
                +{suggestion.percentOverTarget.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Total Value */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-white">
          {convertPrice(suggestion.totalValue)}
        </div>
        {suggestion.cashAmount && (
          <div className="text-xs text-yellow-400 font-medium">
            Includes {convertPrice(suggestion.cashAmount)} cash
          </div>
        )}
        {targetValue && (
          <div className="text-xs text-slate-400">
            Target: {convertPrice(targetValue)}
          </div>
        )}
      </div>

      {/* Card Thumbnails Grid */}
      <div className="grid grid-cols-4 gap-2">
        {suggestion.cards.slice(0, 8).map((card, idx) => (
          <div key={idx} className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden bg-slate-800/50">
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={`${card.player} ${card.year}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-slate-500 text-center p-1">
                  {card.player}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Show +N more if there are more cards */}
        {suggestion.cards.length > 8 && (
          <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              +{suggestion.cards.length - 8}
            </span>
          </div>
        )}
      </div>

      {/* Card Details Summary */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-slate-400">Avg Value</div>
            <div className="text-white font-medium">
              {convertPrice(suggestion.totalValue / suggestion.cardCount)}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Highest</div>
            <div className="text-white font-medium">
              {convertPrice(Math.max(...suggestion.cards.map(c => c.currentValue)))}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Lowest</div>
            <div className="text-white font-medium">
              {convertPrice(Math.min(...suggestion.cards.map(c => c.currentValue)))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          <Eye size={16} />
          <span className="text-sm font-medium">View & Edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            selected
              ? 'bg-crypto-lime text-black'
              : 'bg-crypto-lime/20 text-crypto-lime border border-crypto-lime/30 hover:bg-crypto-lime/30'
          }`}
        >
          {selected ? '✓ Selected' : 'Use Bundle'}
        </button>
      </div>
    </div>
  );
};
