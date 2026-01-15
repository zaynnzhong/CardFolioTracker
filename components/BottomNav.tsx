import React from 'react';
import { Home, PieChart, Plus, Package, Receipt } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface BottomNavProps {
  currentTab: 'portfolio' | 'analytics' | 'transactions' | 'trade-plans';
  onTabChange: (tab: 'portfolio' | 'analytics' | 'transactions' | 'trade-plans') => void;
  onAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onAdd }) => {
  const { t } = useLanguage();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bottom-nav-glass z-40 bottom-nav-container">
      <div className="grid grid-cols-5 items-center pt-2 pb-1">
        <button
          onClick={() => onTabChange('portfolio')}
          className={`flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
            currentTab === 'portfolio'
              ? 'text-crypto-lime'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Home size={22} strokeWidth={currentTab === 'portfolio' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide">{t('bottomNav.portfolio')}</span>
        </button>

        <button
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
            currentTab === 'analytics'
              ? 'text-crypto-lime'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <PieChart size={22} strokeWidth={currentTab === 'analytics' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide">{t('bottomNav.analytics')}</span>
        </button>

        {/* Floating Action Button for Add */}
        <div className="flex justify-center -mt-10">
          <button
            onClick={onAdd}
            className="relative w-16 h-16 crypto-gradient rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 transition-all duration-200 active:scale-95 border-4 border-crypto-darker glow-lime"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>

        <button
          onClick={() => onTabChange('trade-plans')}
          className={`flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
            currentTab === 'trade-plans'
              ? 'text-crypto-lime'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Package size={22} strokeWidth={currentTab === 'trade-plans' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide">{t('bottomNav.plans')}</span>
        </button>

        <button
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
            currentTab === 'transactions'
              ? 'text-crypto-lime'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Receipt size={22} strokeWidth={currentTab === 'transactions' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide">{t('bottomNav.history')}</span>
        </button>
      </div>
    </div>
  );
};