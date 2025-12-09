import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, User, Mail, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';

type Currency = 'USD' | 'CNY';

export const ProfileSettings: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [saved, setSaved] = useState(false);

  // Load currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('displayCurrency') as Currency;
    if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'CNY')) {
      setCurrency(savedCurrency);
    } else {
      // Set default to USD if nothing is saved
      localStorage.setItem('displayCurrency', 'USD');
    }
  }, []);

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('displayCurrency', newCurrency);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: newCurrency }));

    // Show saved feedback
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isGuest = user?.isAnonymous;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="text-crypto-lime" size={32} />
          Profile Settings
        </h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Profile Information */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <User size={20} className="text-crypto-lime" />
          Account Information
        </h2>

        <div className="space-y-4">
          {isGuest ? (
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full">
                  <span className="text-white text-xs font-bold">GUEST</span>
                </div>
                <span className="text-slate-300">Guest User</span>
              </div>
              <p className="text-slate-400 text-sm">
                You're using a guest account. Sign in with Google or email to unlock unlimited cards and save your data permanently.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Display Name</p>
                  <p className="text-white font-medium">{user?.displayName || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white font-medium">{user?.email || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Currency Settings */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-crypto-lime" />
          Display Currency
        </h2>

        <p className="text-slate-400 text-sm mb-4">
          Choose your preferred currency for displaying prices and values throughout the app.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleCurrencyChange('USD')}
            className={`p-4 rounded-xl border-2 transition-all ${
              currency === 'USD'
                ? 'border-crypto-lime bg-crypto-lime/10 shadow-lg'
                : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">$</div>
              <div className={`font-bold ${currency === 'USD' ? 'text-crypto-lime' : 'text-white'}`}>
                USD
              </div>
              <div className="text-xs text-slate-400 mt-1">US Dollar</div>
            </div>
          </button>

          <button
            onClick={() => handleCurrencyChange('CNY')}
            className={`p-4 rounded-xl border-2 transition-all ${
              currency === 'CNY'
                ? 'border-crypto-lime bg-crypto-lime/10 shadow-lg'
                : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">¥</div>
              <div className={`font-bold ${currency === 'CNY' ? 'text-crypto-lime' : 'text-white'}`}>
                CNY
              </div>
              <div className="text-xs text-slate-400 mt-1">Chinese Yuan</div>
            </div>
          </button>
        </div>

        {saved && (
          <div className="mt-4 p-3 bg-crypto-lime/10 border border-crypto-lime/30 rounded-xl">
            <p className="text-crypto-lime text-sm text-center font-medium">
              ✓ Currency preference saved
            </p>
          </div>
        )}
      </div>

      {/* Sign Out Button */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Account Actions</h2>
        <button
          onClick={handleSignOut}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 px-6 rounded-xl transition-all duration-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
