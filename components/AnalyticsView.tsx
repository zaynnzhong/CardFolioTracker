
import React, { useMemo } from 'react';
import { Card, Sport } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Layers, Award } from 'lucide-react';

interface AnalyticsViewProps {
  cards: Card[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ cards }) => {
  // Filter for portfolio assets only (exclude watchlist)
  const portfolio = useMemo(() => cards.filter(c => !c.watchlist), [cards]);

  const stats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let highestValueCard = portfolio[0];
    let gradedCount = 0;
    
    const sportDistribution: Record<string, number> = {};
    const gradeDistribution: Record<string, number> = { Graded: 0, Raw: 0 };

    portfolio.forEach(card => {
      const val = card.sold ? (card.soldPrice || 0) : card.currentValue;
      totalValue += val;
      totalCost += card.purchasePrice;
      
      if (val > (highestValueCard?.currentValue || 0)) {
        highestValueCard = card;
      }

      // Sport Dist
      if (!sportDistribution[card.sport]) sportDistribution[card.sport] = 0;
      sportDistribution[card.sport] += val;

      // Grade Dist
      if (card.graded) {
        gradedCount++;
        gradeDistribution['Graded'] += val;
      } else {
        gradeDistribution['Raw'] += val;
      }
    });

    // Format for Pie Chart
    const sportData = Object.keys(sportDistribution).map(key => ({
      name: key,
      value: sportDistribution[key]
    })).sort((a, b) => b.value - a.value);

    // Top Movers
    const movers = [...portfolio].map(c => {
      const current = c.sold ? (c.soldPrice || 0) : c.currentValue;
      const profit = current - c.purchasePrice;
      const percent = c.purchasePrice > 0 ? (profit / c.purchasePrice) * 100 : 0;
      return { ...c, percent, profit };
    }).sort((a, b) => b.percent - a.percent);

    const winners = movers.filter(m => m.percent > 0).slice(0, 3);
    const losers = movers.filter(m => m.percent < 0).reverse().slice(0, 3);

    return {
      totalValue,
      totalCost,
      highestValueCard,
      sportData,
      gradeDistribution,
      gradedCount,
      winners,
      losers
    };
  }, [portfolio]);

  if (portfolio.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="bg-slate-900 p-4 rounded-full mb-4 border border-slate-800">
           <Layers className="text-slate-600" size={32} />
        </div>
        <h3 className="text-white font-bold text-lg">No Data to Analyze</h3>
        <p className="text-slate-500 mt-2">Add assets to your portfolio to unlock detailed analytics and insights.</p>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 space-y-6 animate-fadeIn">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Avg Card Cost</p>
          <p className="text-xl font-mono text-white">
            ${portfolio.length > 0 ? (stats.totalCost / portfolio.length).toFixed(0) : 0}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Highest Asset</p>
          <div className="truncate">
             <p className="text-xl font-mono text-white truncate">
                ${stats.highestValueCard ? stats.highestValueCard.currentValue.toLocaleString() : 0}
             </p>
             <p className="text-[10px] text-slate-500 truncate">
               {stats.highestValueCard?.player || '-'}
             </p>
          </div>
        </div>
      </div>

      {/* Sport Allocation Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Allocation by Sport</h3>
        <div className="h-64 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.sportData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {stats.sportData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                 itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
             <span className="text-3xl font-bold text-white">{portfolio.length}</span>
             <span className="text-[10px] text-slate-500 uppercase tracking-wider">Assets</span>
          </div>
        </div>
      </div>

      {/* Winners & Losers */}
      <div className="grid grid-cols-1 gap-4">
         {/* Top Performers */}
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-2">
               <TrendingUp size={16} /> Top Performers
            </h3>
            <div className="space-y-3">
               {stats.winners.length > 0 ? stats.winners.map(card => (
                 <div key={card.id} className="flex justify-between items-center border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                    <div>
                       <div className="text-sm font-bold text-slate-200">{card.player}</div>
                       <div className="text-[10px] text-slate-500">{card.year} {card.brand}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-emerald-400 font-bold font-mono">+{card.percent.toFixed(1)}%</div>
                       <div className="text-[10px] text-emerald-500/60">+${card.profit.toFixed(0)}</div>
                    </div>
                 </div>
               )) : <p className="text-slate-600 text-xs italic">No gains yet.</p>}
            </div>
         </div>

         {/* Underperformers */}
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-2">
               <TrendingDown size={16} /> Needs Improvement
            </h3>
            <div className="space-y-3">
               {stats.losers.length > 0 ? stats.losers.map(card => (
                 <div key={card.id} className="flex justify-between items-center border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                    <div>
                       <div className="text-sm font-bold text-slate-200">{card.player}</div>
                       <div className="text-[10px] text-slate-500">{card.year} {card.brand}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-rose-400 font-bold font-mono">{card.percent.toFixed(1)}%</div>
                       <div className="text-[10px] text-rose-500/60">-${Math.abs(card.profit).toFixed(0)}</div>
                    </div>
                 </div>
               )) : <p className="text-slate-600 text-xs italic">No losses yet.</p>}
            </div>
         </div>
      </div>

      {/* Grading Composition */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
               <Award size={16} /> Portfolio Composition
            </h3>
            <span className="text-xs text-slate-500 font-mono">
               {stats.gradedCount} / {portfolio.length} Graded
            </span>
         </div>
         
         <div className="relative pt-2">
            <div className="flex h-4 overflow-hidden rounded-full bg-slate-800">
               <div 
                 style={{ width: `${(stats.gradeDistribution['Graded'] / stats.totalValue) * 100}%` }} 
                 className="bg-indigo-500 transition-all duration-1000 ease-out"
               />
               <div 
                 style={{ width: `${(stats.gradeDistribution['Raw'] / stats.totalValue) * 100}%` }} 
                 className="bg-slate-600 transition-all duration-1000 ease-out"
               />
            </div>
            <div className="flex justify-between mt-2 text-xs">
               <span className="text-indigo-400 font-bold">
                  Graded ({((stats.gradeDistribution['Graded'] / stats.totalValue) * 100).toFixed(0)}%)
               </span>
               <span className="text-slate-400 font-bold">
                  Raw ({((stats.gradeDistribution['Raw'] / stats.totalValue) * 100).toFixed(0)}%)
               </span>
            </div>
         </div>
      </div>

    </div>
  );
};
