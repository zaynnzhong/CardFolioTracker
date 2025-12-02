# 🚀 Quick Start - Authentication Setup

## TL;DR - Get Running in 5 Minutes

### 1. Get Firebase Credentials (2 min)

1. Go to https://console.firebase.google.com
2. Create/select project
3. **Authentication** → Enable Google Sign-In
4. **Project Settings** → Add Web App
5. Copy the config object

### 2. Create .env.local (1 min)

```bash
cp .env.local.example .env.local
```

Add these lines (replace with your values):
```env
# Keep existing MongoDB and Gemini keys
MONGODB_URI=your_existing_mongodb_uri
GEMINI_API_KEY=your_existing_gemini_key

# Add Firebase (from step 1)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456
VITE_FIREBASE_APP_ID=1:123456:web:abc123

# For local dev, use firebase login (optional)
# firebase login
```

### 3. Install & Run (2 min)

```bash
# Install new dependencies
npm install

# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

### 4. Test 🎉

1. Visit http://localhost:5173
2. Click "Continue with Google"
3. Sign in
4. Add a card
5. Success! Your data is now user-specific

---

## What Changed?

| Before | After |
|--------|-------|
| No login required | Must sign in with Google |
| All users see same data | Each user has private data |
| No user profiles | Profile avatar in header |
| Open API access | Protected API routes |

---

## Key Files Modified

- ✅ `App.tsx` - Added auth flow
- ✅ `index.tsx` - Wrapped with AuthProvider
- ✅ `services/dataService.ts` - Added auth headers
- ✅ `server/src/db.ts` - Added userId filtering
- ✅ `server/src/routes.ts` - Added auth middleware

## New Files Added

- 🆕 `firebase.ts`
- 🆕 `contexts/AuthContext.tsx`
- 🆕 `components/Login.tsx`
- 🆕 `server/src/firebaseAdmin.ts`

---

## Deployment Checklist

### Vercel (Production)

1. ✅ Push code to GitHub
2. ✅ In Vercel Dashboard → Settings → Environment Variables
3. ✅ Add ALL variables from .env.local
4. ✅ For `FIREBASE_SERVICE_ACCOUNT_KEY`:
   - Get from Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Convert JSON to single-line string
5. ✅ Redeploy

### Environment Variables for Vercel
```
MONGODB_URI
GEMINI_API_KEY
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT_KEY
```

---

## Testing Different Users

```bash
# Browser 1 - Sign in as user1@gmail.com
# Add some cards

# Browser 2 (Incognito) - Sign in as user2@gmail.com
# Add different cards

# Verify: Each user only sees their own cards ✓
```

---

## Troubleshooting One-Liners

```bash
# Issue: "Unauthorized"
# Fix: Check .env.local has all VITE_FIREBASE_* variables

# Issue: Cards not showing
# Fix: Sign out, clear browser cache, sign in again

# Issue: Backend auth errors
# Fix: Run 'firebase login' in terminal

# Issue: Build errors
# Fix: Delete node_modules, run 'npm install' again
```

---

## Important Notes

⚠️ **Existing Data**: Old cards without `userId` won't be visible. Either:
- Start fresh (recommended for testing)
- Or add `userId` field to existing cards in MongoDB

⚠️ **Never Commit**: `.env.local` is in `.gitignore` - never commit it!

⚠️ **Service Account**: Keep Firebase service account JSON secure!

---

## Need Help?

1. 📖 Read [SETUP_AUTH.md](SETUP_AUTH.md) for detailed instructions
2. 📋 Check [AUTH_SUMMARY.md](AUTH_SUMMARY.md) for overview
3. 🔍 Look at browser console for error details
4. 🔧 Check server logs for backend errors

---

## Success Indicators

✅ Login screen appears on first visit
✅ Google OAuth popup works
✅ Profile picture shows in top-right
✅ Can add/edit/delete cards
✅ Can sign out
✅ Different users see different data

**All working? Congratulations! 🎉 You have secure multi-user authentication!**
