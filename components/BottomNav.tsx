import React from 'react';
import { Home, PieChart, Plus, Search } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'portfolio' | 'analytics';
  onTabChange: (tab: 'portfolio' | 'analytics') => void;
  onAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onAdd }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-2xl border-t border-emerald-500/10 pb-safe pt-3 px-6 pb-7 z-40 flex items-center justify-between shadow-2xl shadow-emerald-500/5">

      <button
        onClick={() => onTabChange('portfolio')}
        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 ${currentTab === 'portfolio'
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
      >
        <Home size={24} strokeWidth={currentTab === 'portfolio' ? 2.5 : 2} />
        <span className="text-[10px] font-semibold tracking-wide">Portfolio</span>
      </button>

      {/* Floating Action Button for Add */}
      <div className="-mt-10">
        <button
          onClick={onAdd}
          className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-110 transition-all duration-300 active:scale-95 border-4 border-black group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full animate-pulse" />
          <Plus size={32} strokeWidth={2.5} className="relative z-10" />
        </button>
      </div>

      <button
        onClick={() => onTabChange('analytics')}
        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 ${currentTab === 'analytics'
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
      >
        <PieChart size={24} strokeWidth={currentTab === 'analytics' ? 2.5 : 2} />
        <span className="text-[10px] font-semibold tracking-wide">Analytics</span>
      </button>
    </div>
  );
};