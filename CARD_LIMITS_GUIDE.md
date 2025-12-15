# Card Limits & Monetization System

## Overview

This system allows you to:
- Set a default card limit for new users (default: 30 cards)
- Generate unlock keys that users can redeem for unlimited access
- Whitelist specific email addresses for automatic unlimited access
- Manage everything through an admin panel

## Quick Start

### 1. Make Yourself an Admin

Add your email to the admin list in MongoDB:

```javascript
// Connect to your MongoDB and run:
db.systemconfigs.updateOne(
  { configKey: 'main' },
  {
    $set: {
      adminEmails: ['your-email@example.com'],
      defaultCardLimit: 30,
      emailWhitelist: []
    }
  },
  { upsert: true }
)
```

Or use MongoDB Compass to create a document in the `systemconfigs` collection:
```json
{
  "configKey": "main",
  "defaultCardLimit": 30,
  "adminEmails": ["your-email@example.com"],
  "emailWhitelist": []
}
```

### 2. Access the Admin Panel

1. Log in with your admin email
2. Click your profile picture (top right)
3. Click "Admin Panel" (only visible to admins)

### 3. Configure Card Limits

**In the Config Tab:**
- Adjust the "Default Card Limit for New Users" (e.g., 30, 50, 100)
- This applies to all new users who sign up

### 4. Create Unlock Keys

**In the Unlock Keys Tab:**
- Set **Card Limit**: `-1` for unlimited, or a specific number (e.g., 100)
- Set **Max Uses**: `-1` for unlimited uses, or limit how many users can redeem
- Click "Generate Unlock Key"
- Copy the generated key (format: `PRISM-XXXX-XXXX-XXXX`)
- Share this key with users who should get unlimited access

### 5. Whitelist VIP Users

**In the Whitelist Tab:**
- Enter an email address
- Click "Add"
- That user will automatically get unlimited cards (no key needed)
- Useful for:
  - Your own testing accounts
  - Beta testers
  - VIP customers
  - Team members

## User Experience

### For Free Users (Default)

1. **New users** are limited to 30 cards (or your configured limit)
2. **Warning banner** appears when they reach 80% of their limit
3. **Can't add cards** once they hit the limit
4. **"Unlock Unlimited" button** prompts them to enter a key

### For Unlimited Users

Users can get unlimited access by:
- **Redeeming an unlock key** you created
- **Being on the whitelist** (automatic)
- No banner or restrictions

## How Users Redeem Keys

1. User tries to add a card past their limit
2. Banner appears with "Unlock Unlimited" button
3. They enter the unlock key: `PRISM-XXXX-XXXX-XXXX`
4. Instantly upgraded to unlimited cards

## Monetization Strategy Examples

### Option 1: Free Trial → Paid
```
Default limit: 10 cards
After 10 cards: "Upgrade for $4.99/month for unlimited cards"
Generate keys for paying customers
```

### Option 2: Freemium with Tiers
```
Free: 30 cards
Pro ($9.99): 100 cards (key with cardLimit: 100)
Unlimited ($19.99): Unlimited (key with cardLimit: -1)
```

### Option 3: One-Time Purchase
```
Free: 50 cards
One-time unlock: $14.99 for lifetime unlimited
Generate single-use keys (maxUses: 1)
```

### Option 4: Promotional Keys
```
Default: 30 cards
Giveaway: Create 100 keys with unlimited uses
Social media promotion: "First 50 people to use code PRISM-XXXX"
```

## Key Management

### Create Different Key Types

**Promotional Keys (Limited Uses)**
```
Card Limit: -1 (unlimited)
Max Uses: 50 (first 50 people)
```

**Single Purchase Keys**
```
Card Limit: -1 (unlimited)
Max Uses: 1 (one-time use)
```

**Tier Keys**
```
Card Limit: 100 (premium tier)
Max Uses: -1 (reusable)
```

### Deactivate Keys

- In Admin Panel → Unlock Keys tab
- Click "Deactivate" on any key
- Key can no longer be redeemed
- Useful for:
  - Stopping promotional campaigns
  - Revoking compromised keys
  - Ending time-limited offers

## Testing Locally

### Test the Free User Experience

1. **Sign up with a new email** (not in whitelist)
2. **Add cards** until you hit the limit (30 by default)
3. **Try to add one more** - should be blocked
4. **See the banner** warning you're at the limit

### Test Unlock Keys

1. **Generate a key** in Admin Panel
2. **Sign in as a non-admin user**
3. **Click "Unlock Unlimited"** from the banner
4. **Enter the key** you generated
5. **Verify** you can now add unlimited cards

### Test Whitelisting

1. **Add an email** to whitelist in Admin Panel
2. **Sign in with that email**
3. **No limit** - can add cards immediately
4. **No banner** appears

## Database Schema

### Collections Created

**`userprofiles`** - Tracks each user's tier and limits
```javascript
{
  userId: "firebase-uid",
  email: "user@example.com",
  tier: "free" | "unlimited",
  cardLimit: 30,  // -1 for unlimited
  unlockKey: "PRISM-XXXX-XXXX-XXXX",  // if they used a key
  whitelisted: false,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}
```

**`unlockkeys`** - Stores all generated keys
```javascript
{
  key: "PRISM-XXXX-XXXX-XXXX",
  tier: "unlimited",
  cardLimit: -1,
  maxUses: -1,
  usedCount: 5,
  active: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  expiresAt: null  // optional expiration
}
```

**`systemconfigs`** - Global configuration
```javascript
{
  configKey: "main",
  defaultCardLimit: 30,
  emailWhitelist: ["vip@example.com"],
  adminEmails: ["admin@example.com"]
}
```

## Security

- ✅ **Server-side validation** - Card limits checked on backend
- ✅ **Admin-only endpoints** - Protected by middleware
- ✅ **Email-based admin access** - Only configured emails see admin panel
- ✅ **Key deactivation** - Revoke keys anytime
- ✅ **Usage tracking** - See how many times each key was used

## Future Enhancements

You can easily add:
- **Expiring keys** (set `expiresAt` date when creating keys)
- **Payment integration** (Stripe, PayPal) to generate keys on purchase
- **Analytics dashboard** showing tier distribution
- **Email notifications** when users hit their limit
- **Referral system** (give users keys to share)
- **Seasonal promotions** (temporary higher limits)

## Troubleshooting

**"Admin Panel" doesn't appear in menu**
- Check your email is in `systemconfigs.adminEmails`
- Refresh the page after updating MongoDB
- Check browser console for errors

**Users can still add cards past limit**
- Server must be running (check terminal)
- Check MongoDB connection
- Verify API endpoints are working

**Key redemption fails**
- Check key is active in database
- Verify key hasn't exceeded maxUses
- Check for typos (format: PRISM-XXXX-XXXX-XXXX)

## API Endpoints

### Public Endpoints
- `GET /tier/config` - Get default card limit
- `POST /tier/redeem-key` - Redeem unlock key (authenticated)
- `GET /tier/profile` - Get user's profile (authenticated)
- `GET /tier/can-add-card` - Check if can add more cards (authenticated)

### Admin Endpoints (require admin email)
- `GET /admin/config` - Get full system config
- `PUT /admin/config` - Update default card limit
- `POST /admin/whitelist/add` - Add email to whitelist
- `POST /admin/whitelist/remove` - Remove from whitelist
- `POST /admin/unlock-keys/create` - Generate new key
- `GET /admin/unlock-keys` - List all keys
- `POST /admin/unlock-keys/deactivate` - Deactivate a key

## Next Steps

1. **Set yourself as admin** in MongoDB
2. **Test the flow** with a new account
3. **Generate promotional keys** for beta testers
4. **Decide on pricing** (free tier limit, unlock price)
5. **Integrate payment** (optional - Stripe/PayPal)
6. **Market your app** with the freemium model

Happy monetizing! 💰
