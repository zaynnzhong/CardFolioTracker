import React from 'react';
import { Stats, Currency } from '../types';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardStatsProps {
  stats: Stats;
  displayCurrency: Currency;
  convertPrice: (price: number, from: Currency, to: Currency) => number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, displayCurrency, convertPrice }) => {
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
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-900/30 border border-slate-800/50 rounded-2xl p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 animate-fadeIn">
        {/* Left: Main Value */}
        <div className="flex-1">
          <span className="text-slate-500 text-xs font-medium tracking-wide mb-2 block">PORTFOLIO VALUE</span>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl lg:text-6xl font-bold text-white tracking-tight">
              {symbol}{currentPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-slate-500 text-xl">{displayCurrency}</span>
          </div>

          <div className="flex items-center gap-3">
            {isPositive ? <TrendingUp size={20} className="text-emerald-400" /> : <TrendingDown size={20} className="text-rose-400" />}
            <span className={`text-xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : ''}{symbol}{Math.abs(totalGain).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className={`text-lg font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({totalGainPercent > 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%)
            </span>
            <span className="text-slate-500 text-sm font-medium">All Time</span>
          </div>
        </div>

        {/* Right: Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium mb-1.5 uppercase tracking-wide">Cash</span>
              <div className={`text-xl lg:text-2xl font-bold ${cash >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {symbol}{cash.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium mb-1.5 uppercase tracking-wide">Assets</span>
              <div className="text-xl lg:text-2xl font-bold text-white">
                {stats.cardCount}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium mb-1.5 uppercase tracking-wide">Unrealized P/L</span>
              <div className={`text-xl lg:text-2xl font-bold ${unrealizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {unrealizedProfit >= 0 ? '+' : ''}{symbol}{Math.abs(unrealizedProfit).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium mb-1.5 uppercase tracking-wide">Realized P/L</span>
              <div className={`text-xl lg:text-2xl font-bold ${realizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {realizedProfit >= 0 ? '+' : ''}{symbol}{Math.abs(realizedProfit).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};