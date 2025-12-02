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
    <div className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center py-10 px-4 animate-fadeIn">
        <span className="text-slate-400 text-xs font-semibold tracking-widest mb-3 uppercase">Portfolio Value</span>

        <div className="flex items-baseline justify-center gap-2 mb-4">
          <span className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tracking-tight">
            ${stats.currentPortfolioValue.USD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-sm border ${isPositive
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-rose-500/10 border-rose-500/20'
          }`}>
          {isPositive ? <ArrowUpRight size={18} className="text-emerald-400" /> : <ArrowDownRight size={18} className="text-rose-400" />}
          <span className={`text-base font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}{totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            ({totalGainPercent > 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%)
          </span>
          <span className="text-slate-500 text-xs font-medium">All Time</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-md">
          <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent rounded-2xl transition-all duration-300" />
            <div className="relative flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Unrealized P/L</span>
              <div className={`text-xl font-bold font-mono ${stats.unrealizedProfit.USD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.unrealizedProfit.USD >= 0 ? '+' : ''}{stats.unrealizedProfit.USD.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent rounded-2xl transition-all duration-300" />
            <div className="relative flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Realized P/L</span>
              <div className={`text-xl font-bold font-mono ${stats.realizedProfit.USD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.realizedProfit.USD >= 0 ? '+' : ''}{stats.realizedProfit.USD.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};