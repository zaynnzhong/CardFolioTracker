import React from 'react';
import { Stats } from '../types';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardStatsProps {
  stats: Stats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  // We prioritize USD for the mobile view main display
  const totalValue = stats.currentPortfolioValue.USD + stats.realizedProfit.USD; // Simplified view: Assets + Cash realized
  const totalInvested = stats.totalInvested.USD;
  const totalGain = totalValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const isPositive = totalGain >= 0;

  return (
    <div className="relative overflow-hidden px-5 py-8">
      <div className="flex flex-col animate-fadeIn">
        <span className="text-slate-500 text-xs font-medium tracking-wide mb-2">PORTFOLIO VALUE</span>

        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-6xl font-bold text-white tracking-tight">
            ${stats.currentPortfolioValue.USD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {isPositive ? <TrendingUp size={20} className="text-emerald-400" /> : <TrendingDown size={20} className="text-rose-400" />}
          <span className={`text-lg font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}${Math.abs(totalGain).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          <span className={`text-base font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            ({totalGainPercent > 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%)
          </span>
          <span className="text-slate-500 text-sm font-medium ml-auto">All Time</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium mb-1.5">UNREALIZED P/L</span>
              <div className={`text-2xl font-bold ${stats.unrealizedProfit.USD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.unrealizedProfit.USD >= 0 ? '+' : ''}${Math.abs(stats.unrealizedProfit.USD).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium mb-1.5">REALIZED P/L</span>
              <div className={`text-2xl font-bold ${stats.realizedProfit.USD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.realizedProfit.USD >= 0 ? '+' : ''}${Math.abs(stats.realizedProfit.USD).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};