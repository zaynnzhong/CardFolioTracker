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
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-fadeIn">
      <span className="text-slate-500 text-sm font-medium tracking-wide mb-1 uppercase">Total Portfolio Equity</span>
      
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl sm:text-5xl font-bold text-white tracking-tighter">
          ${stats.currentPortfolioValue.USD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className={`flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
        {isPositive ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
        <span className={`text-sm font-bold font-mono ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? '+' : ''}{totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({totalGainPercent.toFixed(2)}%)
        </span>
        <span className="text-slate-500 text-xs ml-1">All Time</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Unrealized</span>
            <div className={`text-lg font-bold font-mono ${stats.unrealizedProfit.USD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {stats.unrealizedProfit.USD >= 0 ? '+' : ''}{stats.unrealizedProfit.USD.toLocaleString()}
            </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Realized</span>
            <div className={`text-lg font-bold font-mono ${stats.realizedProfit.USD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {stats.realizedProfit.USD >= 0 ? '+' : ''}{stats.realizedProfit.USD.toLocaleString()}
            </div>
        </div>
      </div>
    </div>
  );
};