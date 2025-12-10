import React from 'react';
import { Home, PieChart, Plus } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'portfolio' | 'analytics' | 'transactions';
  onTabChange: (tab: 'portfolio' | 'analytics' | 'transactions') => void;
  onAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onAdd }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-card backdrop-blur-xl border-t border-white/10 ios-bottom-safe z-40">
      <div className="flex items-center justify-around px-6 pt-3">
        <button
          onClick={() => onTabChange('portfolio')}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
            currentTab === 'portfolio'
              ? 'text-crypto-lime'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Home size={26} strokeWidth={currentTab === 'portfolio' ? 2.5 : 2} />
          <span className="text-[11px] font-bold tracking-wide">Portfolio</span>
        </button>

        {/* Floating Action Button for Add */}
        <div className="-mt-10">
          <button
            onClick={onAdd}
            className="relative w-16 h-16 crypto-gradient rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 transition-all duration-200 active:scale-95 border-4 border-crypto-darker glow-lime"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>

        <button
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
            currentTab === 'analytics'
              ? 'text-crypto-lime'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <PieChart size={26} strokeWidth={currentTab === 'analytics' ? 2.5 : 2} />
          <span className="text-[11px] font-bold tracking-wide">Analytics</span>
        </button>
      </div>
    </div>
  );
};