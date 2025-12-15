import React from 'react';
import { Currency } from '../types';
import { DollarSign } from 'lucide-react';

interface CurrencySelectorProps {
  selected: Currency;
  onChange: (currency: Currency) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ selected, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <DollarSign size={18} className="text-slate-400" />
      <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
        <button
          onClick={() => onChange('USD')}
          className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
            selected === 'USD'
              ? 'bg-crypto-lime text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          USD
        </button>
        <button
          onClick={() => onChange('CNY')}
          className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
            selected === 'CNY'
              ? 'bg-crypto-lime text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          CNY
        </button>
      </div>
    </div>
  );
};
