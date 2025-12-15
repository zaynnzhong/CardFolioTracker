import { UserProfile, UnlockKey, SystemConfig, UserTier } from '../types';
import { auth } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get authorization header with current user's token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export const tierService = {
  /**
   * Get current user's profile and tier information
   */
  async getUserProfile(): Promise<UserProfile> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/tier/profile`, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return response.json();
  },

  /**
   * Check if user can add more cards
   */
  async canAddCard(): Promise<{ allowed: boolean; limit: number; current: number; message?: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/tier/can-add-card`, { headers });
    if (!response.ok) {
      throw new Error('Failed to check card limit');
    }
    return response.json();
  },

  /**
   * Redeem an unlock key
   */
  async redeemUnlockKey(key: string): Promise<{ success: boolean; message: string; profile?: UserProfile }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/tier/redeem-key`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ key })
    });

    const data = await response.json();
    return data;
  },

  /**
   * Get public system config
   */
  async getSystemConfig(): Promise<{ defaultCardLimit: number }> {
    const response = await fetch(`${API_URL}/api/tier/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch system config');
    }
    return response.json();
  },

  // ===== Admin API =====

  /**
   * Get full system config (admin only)
   */
  async getAdminConfig(): Promise<SystemConfig> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/config`, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch admin config');
    }
    return response.json();
  },

  /**
   * Update system config (admin only)
   */
  async updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/config`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(config)
    });
    if (!response.ok) {
      throw new Error('Failed to update system config');
    }
    return response.json();
  },

  /**
   * Add email to whitelist (admin only)
   */
  async addToWhitelist(email: string): Promise<SystemConfig> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/whitelist/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      throw new Error('Failed to add to whitelist');
    }
    return response.json();
  },

  /**
   * Remove email from whitelist (admin only)
   */
  async removeFromWhitelist(email: string): Promise<SystemConfig> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/whitelist/remove`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      throw new Error('Failed to remove from whitelist');
    }
    return response.json();
  },

  /**
   * Create unlock key (admin only)
   */
  async createUnlockKey(params: {
    tier: UserTier;
    cardLimit: number;
    maxUses?: number;
    expiresAt?: string;
  }): Promise<UnlockKey> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/unlock-keys/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      throw new Error('Failed to create unlock key');
    }
    return response.json();
  },

  /**
   * List all unlock keys (admin only)
   */
  async listUnlockKeys(): Promise<UnlockKey[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/unlock-keys`, { headers });
    if (!response.ok) {
      throw new Error('Failed to list unlock keys');
    }
    return response.json();
  },

  /**
   * Deactivate an unlock key (admin only)
   */
  async deactivateUnlockKey(key: string): Promise<UnlockKey> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/unlock-keys/deactivate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ key })
    });
    if (!response.ok) {
      throw new Error('Failed to deactivate key');
    }
    return response.json();
  }
};
