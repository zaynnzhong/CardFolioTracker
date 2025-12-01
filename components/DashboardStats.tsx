import React from 'react';
import { Stats } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Layers, CheckCircle2 } from 'lucide-react';

interface DashboardStatsProps {
  stats: Stats;
}

const CurrencyValue: React.FC<{ usd: number; cny: number; highlight?: boolean }> = ({ usd, cny, highlight }) => {
  return (
    <div className="flex flex-col">
      {usd !== 0 && (
        <span className={highlight ? 'text-white' : 'text-slate-200'}>
          ${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )}
      {cny !== 0 && (
        <span className={`text-sm ${highlight ? 'text-white/80' : 'text-slate-400'}`}>
          ¥{cny.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )}
      {usd === 0 && cny === 0 && <span className="text-slate-400">$0.00</span>}
    </div>
  );
};

const StatCard: React.FC<{ 
  title: string; 
  usdValue: number; 
  cnyValue: number; 
  icon: React.ReactNode; 
  trend?: 'up' | 'down' | 'neutral';
  subText?: string;
}> = ({ title, usdValue, cnyValue, icon, trend, subText }) => {
  const trendColor = trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : trend === 'down' ? 'text-rose-400 bg-rose-400/10' : 'text-slate-400 bg-slate-700/50';
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-3">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
          <div className={`p-2 rounded-lg ${trendColor}`}>
            {icon}
          </div>
        </div>
        <div className="font-bold text-2xl font-mono">
          <CurrencyValue usd={usdValue} cny={cnyValue} highlight />
        </div>
      </div>
      {subText && (
        <p className="text-xs text-slate-500 mt-2 border-t border-slate-700/50 pt-2">
          {subText}
        </p>
      )}
    </div>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const isUnrealizedProfit = stats.unrealizedProfit.USD >= 0 && stats.unrealizedProfit.CNY >= 0;
  const isRealizedProfit = stats.realizedProfit.USD >= 0 && stats.realizedProfit.CNY >= 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Active Portfolio Value */}
      <StatCard 
        title="Portfolio Value (Unsold)" 
        usdValue={stats.currentPortfolioValue.USD}
        cnyValue={stats.currentPortfolioValue.CNY}
        icon={<DollarSign size={20} />}
        trend="neutral"
        subText={`Across ${stats.cardCount} items`}
      />

      {/* 2. Paper Profit */}
      <StatCard 
        title="Unrealized Profit" 
        usdValue={stats.unrealizedProfit.USD}
        cnyValue={stats.unrealizedProfit.CNY}
        icon={isUnrealizedProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        trend={isUnrealizedProfit ? 'up' : 'down'}
        subText="Potential gain if sold today"
      />

      {/* 3. Realized Profit (Cash in hand) */}
      <StatCard 
        title="Realized Profit (Sold)" 
        usdValue={stats.realizedProfit.USD}
        cnyValue={stats.realizedProfit.CNY}
        icon={<CheckCircle2 size={20} />}
        trend={isRealizedProfit ? 'up' : 'down'}
        subText="Locked in gains from sales"
      />

      {/* 4. Total Invested (Active) */}
      <StatCard 
        title="Active Investment" 
        usdValue={stats.totalInvested.USD}
        cnyValue={stats.totalInvested.CNY}
        icon={<Layers size={20} />}
        trend="neutral"
        subText="Cost basis of current holdings"
      />
    </div>
  );
};