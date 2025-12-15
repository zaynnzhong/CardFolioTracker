import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Key, Shield, Settings } from 'lucide-react';
import { tierService } from '../services/tierService';
import { SystemConfig, UnlockKey, UserTier } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [unlockKeys, setUnlockKeys] = useState<UnlockKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'whitelist' | 'keys'>('config');

  // Config form
  const [newCardLimit, setNewCardLimit] = useState('30');

  // Whitelist form
  const [newEmail, setNewEmail] = useState('');

  // Unlock key form
  const [newKeyCardLimit, setNewKeyCardLimit] = useState('-1');
  const [newKeyMaxUses, setNewKeyMaxUses] = useState('-1');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, keysData] = await Promise.all([
        tierService.getAdminConfig(),
        tierService.listUnlockKeys()
      ]);
      setConfig(configData);
      setUnlockKeys(keysData);
      setNewCardLimit(configData.defaultCardLimit.toString());
    } catch (error: any) {
      alert('Failed to load admin data. Make sure you have admin access.');
      console.error('Admin panel error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCardLimit = async () => {
    try {
      const limit = parseInt(newCardLimit);
      if (isNaN(limit) || limit < 1) {
        alert('Please enter a valid card limit (minimum 1)');
        return;
      }
      await tierService.updateSystemConfig({ defaultCardLimit: limit });
      await loadData();
      alert(`Default card limit updated to ${limit}`);
    } catch (error: any) {
      alert('Failed to update card limit: ' + error.message);
    }
  };

  const handleAddToWhitelist = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    try {
      await tierService.addToWhitelist(newEmail.trim());
      await loadData();
      setNewEmail('');
      alert(`Added ${newEmail} to whitelist`);
    } catch (error: any) {
      alert('Failed to add to whitelist: ' + error.message);
    }
  };

  const handleRemoveFromWhitelist = async (email: string) => {
    if (!confirm(`Remove ${email} from whitelist?`)) return;
    try {
      await tierService.removeFromWhitelist(email);
      await loadData();
      alert(`Removed ${email} from whitelist`);
    } catch (error: any) {
      alert('Failed to remove from whitelist: ' + error.message);
    }
  };

  const handleCreateUnlockKey = async () => {
    try {
      const cardLimit = parseInt(newKeyCardLimit);
      const maxUses = parseInt(newKeyMaxUses);

      if (isNaN(cardLimit)) {
        alert('Please enter a valid card limit (-1 for unlimited)');
        return;
      }

      const key = await tierService.createUnlockKey({
        tier: cardLimit === -1 ? UserTier.UNLIMITED : UserTier.FREE,
        cardLimit,
        maxUses
      });

      await loadData();
      alert(`Unlock key created: ${key.key}\n\nCopy this key and share it with users.`);
    } catch (error: any) {
      alert('Failed to create unlock key: ' + error.message);
    }
  };

  const handleDeactivateKey = async (key: string) => {
    if (!confirm(`Deactivate key ${key}?`)) return;
    try {
      await tierService.deactivateUnlockKey(key);
      await loadData();
      alert('Unlock key deactivated');
    } catch (error: any) {
      alert('Failed to deactivate key: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
        <div className="bg-gray-900 rounded-lg p-8">
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-prism" />
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'config'
                ? 'text-prism border-b-2 border-prism'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 inline mr-2" />
            Config
          </button>
          <button
            onClick={() => setActiveTab('whitelist')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'whitelist'
                ? 'text-prism border-b-2 border-prism'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-5 h-5 inline mr-2" />
            Whitelist ({config.emailWhitelist.length})
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'keys'
                ? 'text-prism border-b-2 border-prism'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-5 h-5 inline mr-2" />
            Unlock Keys ({unlockKeys.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">System Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default Card Limit for New Users
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={newCardLimit}
                        onChange={(e) => setNewCardLimit(e.target.value)}
                        min="1"
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-prism"
                      />
                      <button
                        onClick={handleUpdateCardLimit}
                        className="px-6 py-2 rounded-lg bg-prism text-black font-medium hover:opacity-90 transition-opacity"
                      >
                        Update
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      Current: {config.defaultCardLimit} cards
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whitelist' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Email Whitelist</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Whitelisted emails automatically get unlimited card access.
                </p>
                <div className="flex gap-3 mb-6">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-prism"
                  />
                  <button
                    onClick={handleAddToWhitelist}
                    className="px-6 py-2 rounded-lg bg-prism text-black font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                <div className="space-y-2">
                  {config.emailWhitelist.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No whitelisted emails</p>
                  ) : (
                    config.emailWhitelist.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <span className="text-white">{email}</span>
                        <button
                          onClick={() => handleRemoveFromWhitelist(email)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Create Unlock Key</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Card Limit (-1 = unlimited)
                    </label>
                    <input
                      type="number"
                      value={newKeyCardLimit}
                      onChange={(e) => setNewKeyCardLimit(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-prism"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Uses (-1 = unlimited)
                    </label>
                    <input
                      type="number"
                      value={newKeyMaxUses}
                      onChange={(e) => setNewKeyMaxUses(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-prism"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateUnlockKey}
                  className="w-full px-6 py-3 rounded-lg bg-prism text-black font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Generate Unlock Key
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Existing Keys</h3>
                <div className="space-y-2">
                  {unlockKeys.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No unlock keys created</p>
                  ) : (
                    unlockKeys.map((key) => (
                      <div
                        key={key.key}
                        className={`p-4 rounded-lg ${
                          key.active ? 'bg-gray-800' : 'bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <code className="text-prism font-mono text-sm">{key.key}</code>
                          {key.active && (
                            <button
                              onClick={() => handleDeactivateKey(key.key)}
                              className="text-red-400 hover:text-red-300 transition-colors text-sm"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Limit:</span>{' '}
                            <span className="text-white">
                              {key.cardLimit === -1 ? 'Unlimited' : key.cardLimit}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Uses:</span>{' '}
                            <span className="text-white">
                              {key.usedCount}/{key.maxUses === -1 ? '∞' : key.maxUses}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>{' '}
                            <span className={key.active ? 'text-green-400' : 'text-red-400'}>
                              {key.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
