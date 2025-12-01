import React, { useEffect, useState } from 'react';
import { Card } from '../types';
import { getMarketInsight } from '../services/geminiService';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InsightModalProps {
  card: Card;
  onClose: () => void;
}

export const InsightModal: React.FC<InsightModalProps> = ({ card, onClose }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      const text = await getMarketInsight(card);
      setInsight(text);
      setLoading(false);
    };
    fetchInsight();
  }, [card]);

  // Format price history for chart
  const chartData = card.priceHistory.map(p => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: p.value
  }));

  // Add current if not in history
  if (chartData.length === 0 || chartData[chartData.length - 1].value !== card.currentValue) {
      chartData.push({
          date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: card.currentValue
      });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-900/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Market Analysis</h2>
              <p className="text-slate-400 text-sm">{card.year} {card.brand} {card.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: AI Text */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Gemini Insight</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[200px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                  <Loader2 className="animate-spin" size={32} />
                  <p>Analyzing market data...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-line">
                  {insight}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chart */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-400 mb-2">Price History</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    tick={{fontSize: 12}}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{fontSize: 12}}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value: number) => [`$${value}`, 'Value']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Cost Basis</p>
                <p className="text-lg font-mono text-white">${card.purchasePrice.toFixed(2)}</p>
              </div>
               <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Current Value</p>
                <p className="text-lg font-mono text-white">${card.currentValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};