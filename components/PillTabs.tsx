import React from 'react';

interface PillTabsProps {
  activeTab: 'holdings' | 'sold';
  onChange: (tab: 'holdings' | 'sold') => void;
}

export const PillTabs: React.FC<PillTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="relative inline-flex items-center bg-slate-900/40 backdrop-blur-sm rounded-full p-1 border border-slate-800/50">
      {/* Background slider */}
      <div
        className="absolute h-[calc(100%-0.5rem)] rounded-full transition-all duration-300 ease-out"
        style={{
          width: 'calc(50% - 0.25rem)',
          left: activeTab === 'holdings' ? '0.25rem' : 'calc(50% + 0.25rem)',
          background: 'linear-gradient(135deg, #d4ff00 0%, #7873f5 100%)',
          boxShadow: '0 0 20px rgba(212, 255, 0, 0.3)',
        }}
      />

      {/* Holdings Tab */}
      <button
        onClick={() => onChange('holdings')}
        className={`relative z-10 px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center min-w-[100px] ${
          activeTab === 'holdings'
            ? 'text-black'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        Holdings
      </button>

      {/* Sold Tab */}
      <button
        onClick={() => onChange('sold')}
        className={`relative z-10 px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center min-w-[100px] ${
          activeTab === 'sold'
            ? 'text-black'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        Sold
      </button>
    </div>
  );
};
