import React, { useState } from 'react';
import { Stats, Currency } from '../types';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface DashboardStatsProps {
  stats: Stats;
  displayCurrency: Currency;
  convertPrice: (price: number, from: Currency, to: Currency) => number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, displayCurrency, convertPrice }) => {
  const [showCashTooltip, setShowCashTooltip] = useState(false);

  // Convert all values to display currency
  const convertAndSum = (usd: number, cny: number): number => {
    return convertPrice(usd, 'USD', displayCurrency) + convertPrice(cny, 'CNY', displayCurrency);
  };

  const totalValue = convertAndSum(stats.currentPortfolioValue.USD, stats.currentPortfolioValue.CNY) + convertAndSum(stats.realizedProfit.USD, stats.realizedProfit.CNY);
  const totalInvested = convertAndSum(stats.totalInvested.USD, stats.totalInvested.CNY);
  const totalGain = totalValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const currentPortfolioValue = convertAndSum(stats.currentPortfolioValue.USD, stats.currentPortfolioValue.CNY);
  const unrealizedProfit = convertAndSum(stats.unrealizedProfit.USD, stats.unrealizedProfit.CNY);
  const realizedProfit = convertAndSum(stats.realizedProfit.USD, stats.realizedProfit.CNY);
  const cash = convertAndSum(stats.cash.USD, stats.cash.CNY);

  const isPositive = totalGain >= 0;
  const symbol = displayCurrency === 'USD' ? '$' : '¥';

  return (
    <div className="relative overflow-hidden glass-card rounded-2xl p-6 lg:p-8 glow-purple">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 animate-fadeIn">
        {/* Left: Main Value */}
        <div className="flex-1">
          <span className="text-slate-400 text-xs font-bold tracking-wider mb-2 block uppercase">PORTFOLIO VALUE</span>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-white to-crypto-lime bg-clip-text text-transparent tracking-tight">
              {symbol}{currentPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-slate-400 text-xl font-semibold">{displayCurrency}</span>
          </div>

          <div className="flex items-center gap-3">
            {isPositive ? <TrendingUp size={20} className="text-crypto-lime" /> : <TrendingDown size={20} className="text-rose-400" />}
            <span className={`text-xl font-extrabold ${isPositive ? 'text-crypto-lime' : 'text-rose-400'}`}>
              {isPositive ? '+' : ''}{symbol}{Math.abs(totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-lg font-bold ${isPositive ? 'text-crypto-lime' : 'text-rose-400'}`}>
              ({totalGainPercent > 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%)
            </span>
            <span className="text-slate-400 text-sm font-semibold">All Time</span>
          </div>
        </div>

        {/* Right: Quick Stats Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <div className="glass-card backdrop-blur-sm border border-white/10 rounded-2xl p-4 relative">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Cash in the Game</span>
                <div
                  className="relative"
                  onMouseEnter={() => setShowCashTooltip(true)}
                  onMouseLeave={() => setShowCashTooltip(false)}
                >
                  <Info size={12} className="text-slate-500 cursor-help" />
                  {showCashTooltip && (
                    <div className="absolute left-0 top-full mt-1 w-56 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 z-50 shadow-xl">
                      How much of your own money is currently in cards (negative) or ready to spend (positive).
                    </div>
                  )}
                </div>
              </div>
              <div className={`text-xl lg:text-2xl font-extrabold ${
                cash > 0 ? 'text-crypto-lime' : cash === 0 ? 'text-white' : 'text-slate-300'
              }`}>
                {cash > 0 && '+'}{cash === 0 ? '' : (cash < 0 ? '–' : '')}{symbol}{Math.abs(cash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {cash > 0 && (
                <span className="text-xs text-emerald-400 mt-1 font-medium">ready to hunt</span>
              )}
            </div>
          </div>

          <div className="glass-card backdrop-blur-sm border border-white/10 rounded-2xl p-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wide">Assets</span>
              <div className="text-xl lg:text-2xl font-extrabold text-white">
                {stats.cardCount}
              </div>
            </div>
          </div>

          <div className="glass-card backdrop-blur-sm border border-white/10 rounded-2xl p-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wide">Unrealized P/L</span>
              <div className={`text-xl lg:text-2xl font-extrabold ${unrealizedProfit >= 0 ? 'text-crypto-lime' : 'text-rose-400'}`}>
                {unrealizedProfit >= 0 ? '+' : ''}{symbol}{Math.abs(unrealizedProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="glass-card backdrop-blur-sm border border-white/10 rounded-2xl p-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wide">Realized P/L</span>
              <div className={`text-xl lg:text-2xl font-extrabold ${realizedProfit >= 0 ? 'text-crypto-lime' : 'text-rose-400'}`}>
                {realizedProfit >= 0 ? '+' : ''}{symbol}{Math.abs(realizedProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
