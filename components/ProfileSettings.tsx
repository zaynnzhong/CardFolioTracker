import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, User, Mail, Settings as SettingsIcon, ArrowLeft, Crown, Sparkles, RefreshCw } from 'lucide-react';
import { tierService } from '../services/tierService';
import { revenueCatService } from '../services/revenueCatService';
import { dataService } from '../services/dataService';
import { UserProfile, UserTier } from '../types';

type Currency = 'USD' | 'CNY';

export const ProfileSettings: React.FC = () => {
  const { user, signOut, getIdToken } = useAuth();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [saved, setSaved] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

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

  // Load user profile and tier
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || user.isAnonymous) {
        console.log('[ProfileSettings] User is guest or not logged in');
        setLoadingProfile(false);
        return;
      }

      try {
        console.log('[ProfileSettings] Loading user profile...');
        const profile = await tierService.getUserProfile();
        console.log('[ProfileSettings] User profile loaded:', profile);
        setUserProfile(profile);
      } catch (error) {
        console.error('[ProfileSettings] Failed to load user profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

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

  const handleMigrateTradePlans = async () => {
    if (!getIdToken) return;

    setMigrating(true);
    setMigrationResult(null);

    try {
      const result = await dataService.migrateTradePlansCurrency(getIdToken);
      setMigrationResult(`✓ Migration completed: ${result.updated} trade plan(s) updated`);
      setTimeout(() => setMigrationResult(null), 5000);
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult('✗ Migration failed. Please try again.');
      setTimeout(() => setMigrationResult(null), 5000);
    } finally {
      setMigrating(false);
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
            <div className="space-y-4">
              {/* Subscription Tier Badge */}
              {!loadingProfile && userProfile && (
                <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {userProfile.tier === UserTier.UNLIMITED ? (
                        <>
                          <div className="p-2 bg-gradient-to-br from-prism to-purple-600 rounded-lg">
                            <Crown size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold bg-gradient-to-r from-prism to-purple-400 bg-clip-text text-transparent">
                                Pro Member
                              </span>
                              <Sparkles size={16} className="text-prism" />
                            </div>
                            <p className="text-sm text-slate-400">
                              {userProfile.whitelisted ? 'Whitelisted Access' :
                               userProfile.unlockKey ? 'Unlock Key Access' :
                               'Subscription Active'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-slate-700/50 rounded-lg">
                            <User size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <span className="text-lg font-bold text-white">Free Tier</span>
                            <p className="text-sm text-slate-400">
                              {userProfile.cardLimit} card limit
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {userProfile.tier === UserTier.FREE && (
                      <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 bg-gradient-to-r from-prism to-purple-600 text-black font-bold rounded-lg hover:opacity-90 transition-opacity text-sm"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              )}

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

      {/* Data Migration */}
      {!isGuest && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RefreshCw size={20} className="text-crypto-lime" />
            Data Migration
          </h2>

          <p className="text-slate-400 text-sm mb-4">
            If you have existing trade plans created before the currency update, click below to migrate them to use the default CNY currency.
          </p>

          <button
            onClick={handleMigrateTradePlans}
            disabled={migrating}
            className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {migrating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Migrating Trade Plans...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Migrate Trade Plans Currency
              </>
            )}
          </button>

          {migrationResult && (
            <div className={`mt-4 p-3 rounded-xl ${
              migrationResult.startsWith('✓')
                ? 'bg-crypto-lime/10 border border-crypto-lime/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <p className={`text-sm text-center font-medium ${
                migrationResult.startsWith('✓') ? 'text-crypto-lime' : 'text-red-400'
              }`}>
                {migrationResult}
              </p>
            </div>
          )}
        </div>
      )}

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
