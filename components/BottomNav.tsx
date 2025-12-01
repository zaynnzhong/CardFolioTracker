import React from 'react';
import { Home, PieChart, Plus, Search } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'portfolio' | 'analytics';
  onTabChange: (tab: 'portfolio' | 'analytics') => void;
  onAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onAdd }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 pb-safe pt-2 px-6 pb-6 z-40 flex items-center justify-between">
      
      <button 
        onClick={() => onTabChange('portfolio')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentTab === 'portfolio' ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <Home size={24} strokeWidth={currentTab === 'portfolio' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Portfolio</span>
      </button>

      {/* Floating Action Button for Add */}
      <div className="-mt-8">
        <button 
          onClick={onAdd}
          className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-transform active:scale-95 border-4 border-slate-950"
        >
          <Plus size={32} />
        </button>
      </div>

      <button 
        onClick={() => onTabChange('analytics')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentTab === 'analytics' ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <PieChart size={24} strokeWidth={currentTab === 'analytics' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Analytics</span>
      </button>
    </div>
  );
};