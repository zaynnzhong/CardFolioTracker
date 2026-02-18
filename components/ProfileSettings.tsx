import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { DollarSign, User, Mail, Settings as SettingsIcon, ArrowLeft, Crown, Sparkles, RefreshCw, Globe, AlertTriangle, Trash2 } from 'lucide-react';
import { tierService } from '../services/tierService';
import { revenueCatService } from '../services/revenueCatService';
import { dataService } from '../services/dataService';
import { UserProfile, UserTier } from '../types';

type Currency = 'USD' | 'CNY';

export const ProfileSettings: React.FC = () => {
  const { user, signOut, deleteAccount, getIdToken } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [saved, setSaved] = useState(false);
  const [languageSaved, setLanguageSaved] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleLanguageChange = (newLanguage: 'en' | 'zh') => {
    console.log('[ProfileSettings] Changing language to:', newLanguage);
    setLanguage(newLanguage);

    // Show saved feedback
    setLanguageSaved(true);
    setTimeout(() => setLanguageSaved(false), 2000);
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount();
      // User will be signed out automatically after deletion
    } catch (error: any) {
      console.error('Delete account error:', error);
      setDeleteError(error.message || t('profile.deleteError'));
      setDeleting(false);
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
          <span>{t('profile.back')}</span>
        </button>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="text-crypto-lime" size={32} />
          {t('profile.title')}
        </h1>
        <p className="text-slate-400">{t('profile.subtitle')}</p>
      </div>

      {/* Profile Information */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <User size={20} className="text-crypto-lime" />
          {t('profile.accountInfo')}
        </h2>

        <div className="space-y-4">
          {isGuest ? (
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full">
                  <span className="text-white text-xs font-bold">{t('profile.guest')}</span>
                </div>
                <span className="text-slate-300">{t('profile.guestUser')}</span>
              </div>
              <p className="text-slate-400 text-sm">
                {t('profile.guestDesc')}
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
                                {t('profile.proMember')}
                              </span>
                              <Sparkles size={16} className="text-prism" />
                            </div>
                            <p className="text-sm text-slate-400">
                              {userProfile.whitelisted ? t('profile.whitelisted') :
                               userProfile.unlockKey ? t('profile.unlockKey') :
                               t('profile.subscriptionActive')}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-slate-700/50 rounded-lg">
                            <User size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <span className="text-lg font-bold text-white">{t('profile.freeTier')}</span>
                            <p className="text-sm text-slate-400">
                              {userProfile.cardLimit} {t('profile.cardLimit')}
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
                        {t('profile.upgrade')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">{t('profile.displayName')}</p>
                  <p className="text-white font-medium">{user?.displayName || t('profile.notSet')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">{t('profile.email')}</p>
                  <p className="text-white font-medium">{user?.email || t('profile.notSet')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Language Settings */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Globe size={20} className="text-crypto-lime" />
          {t('profile.language')}
        </h2>

        <p className="text-slate-400 text-sm mb-4">
          {t('profile.languageDesc')}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`p-4 rounded-xl border-2 transition-all ${
              language === 'en'
                ? 'border-crypto-lime bg-crypto-lime/10 shadow-lg'
                : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">🇺🇸</div>
              <div className={`font-bold ${language === 'en' ? 'text-crypto-lime' : 'text-white'}`}>
                English
              </div>
              <div className="text-xs text-slate-400 mt-1">{t('profile.english')}</div>
            </div>
          </button>

          <button
            onClick={() => handleLanguageChange('zh')}
            className={`p-4 rounded-xl border-2 transition-all ${
              language === 'zh'
                ? 'border-crypto-lime bg-crypto-lime/10 shadow-lg'
                : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">🇨🇳</div>
              <div className={`font-bold ${language === 'zh' ? 'text-crypto-lime' : 'text-white'}`}>
                中文
              </div>
              <div className="text-xs text-slate-400 mt-1">{t('profile.chinese')}</div>
            </div>
          </button>
        </div>

        {languageSaved && (
          <div className="mt-4 p-3 bg-crypto-lime/10 border border-crypto-lime/30 rounded-xl">
            <p className="text-crypto-lime text-sm text-center font-medium">
              ✓ {language === 'en' ? 'Language preference saved' : '语言设置已保存'}
            </p>
          </div>
        )}
      </div>

      {/* Currency Settings */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-crypto-lime" />
          {t('profile.currency')}
        </h2>

        <p className="text-slate-400 text-sm mb-4">
          {t('profile.currencyDesc')}
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
              <div className="text-xs text-slate-400 mt-1">{t('profile.usd')}</div>
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
              <div className="text-xs text-slate-400 mt-1">{t('profile.cny')}</div>
            </div>
          </button>
        </div>

        {saved && (
          <div className="mt-4 p-3 bg-crypto-lime/10 border border-crypto-lime/30 rounded-xl">
            <p className="text-crypto-lime text-sm text-center font-medium">
              ✓ {language === 'en' ? 'Currency preference saved' : '货币设置已保存'}
            </p>
          </div>
        )}
      </div>

      {/* Data Migration */}
      {!isGuest && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RefreshCw size={20} className="text-crypto-lime" />
            {t('profile.dataMigration')}
          </h2>

          <p className="text-slate-400 text-sm mb-4">
            {t('profile.migrationDesc')}
          </p>

          <button
            onClick={handleMigrateTradePlans}
            disabled={migrating}
            className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {migrating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                {t('profile.migrating')}
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                {t('profile.migratePlans')}
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
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">{t('profile.accountActions')}</h2>
        <button
          onClick={handleSignOut}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 px-6 rounded-xl transition-all duration-200"
        >
          {t('profile.signOut')}
        </button>
      </div>

      {/* Danger Zone - Delete Account */}
      {!isGuest && (
        <div className="glass-card p-6 border border-red-500/20">
          <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle size={20} />
            {t('profile.dangerZone')}
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            {t('profile.deleteAccountDesc')}
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              {t('profile.deleteAccount')}
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium mb-3">
                {t('profile.deleteConfirmMsg')}
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t('profile.typeDelete')}
                className="w-full px-4 py-2.5 mb-3 bg-slate-800/50 border border-red-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono"
                disabled={deleting}
              />

              {deleteError && (
                <p className="text-red-400 text-xs mb-3">{deleteError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== 'DELETE'}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {deleting ? t('profile.deleting') : t('profile.confirmDelete')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
