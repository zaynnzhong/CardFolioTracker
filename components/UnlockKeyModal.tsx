import React, { useState } from 'react';
import { X, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { tierService } from '../services/tierService';
import { UserProfile } from '../types';

interface UnlockKeyModalProps {
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
}

export function UnlockKeyModal({ onClose, onSuccess }: UnlockKeyModalProps) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Please enter an unlock key');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await tierService.redeemUnlockKey(key.trim());

      if (result.success && result.profile) {
        setSuccess(result.message);
        setTimeout(() => {
          onSuccess(result.profile!);
          onClose();
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to redeem unlock key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-prism" />
            <h2 className="text-xl font-bold text-white">Unlock Unlimited Cards</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter your unlock key
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="PRISM-XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-prism transition-colors font-mono"
              disabled={loading}
              autoFocus
            />
            <p className="mt-2 text-sm text-gray-400">
              Format: PRISM-XXXX-XXXX-XXXX
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-500 text-sm">{success}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg bg-prism text-black font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !key.trim()}
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="p-6 pt-0 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Need an unlock key? Contact support or check your email for promotional codes.
          </p>
        </div>
      </div>
    </div>
  );
}
