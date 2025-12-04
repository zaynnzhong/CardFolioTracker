import React from 'react';
import { Home, PieChart, Plus, Receipt } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'portfolio' | 'analytics' | 'transactions';
  onTabChange: (tab: 'portfolio' | 'analytics' | 'transactions') => void;
  onAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onAdd }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-slate-800/50 pb-safe pt-2 px-4 pb-6 z-40 flex items-center justify-around">

      <button
        onClick={() => onTabChange('portfolio')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${currentTab === 'portfolio'
            ? 'text-emerald-400'
            : 'text-slate-500 hover:text-slate-300'
          }`}
      >
        <Home size={24} strokeWidth={currentTab === 'portfolio' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Portfolio</span>
      </button>

      <button
        onClick={() => onTabChange('analytics')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${currentTab === 'analytics'
            ? 'text-emerald-400'
            : 'text-slate-500 hover:text-slate-300'
          }`}
      >
        <PieChart size={24} strokeWidth={currentTab === 'analytics' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Analytics</span>
      </button>

      {/* Floating Action Button for Add */}
      <div className="-mt-8">
        <button
          onClick={onAdd}
          className="relative w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all duration-200 active:scale-95 border-4 border-black"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>

      <button
        onClick={() => onTabChange('transactions')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${currentTab === 'transactions'
            ? 'text-emerald-400'
            : 'text-slate-500 hover:text-slate-300'
          }`}
      >
        <Receipt size={24} strokeWidth={currentTab === 'transactions' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Transactions</span>
      </button>
    </div>
  );
};