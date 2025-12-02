# Authentication Setup Guide

This guide will walk you through setting up Google Authentication for the Prism Card Portfolio app.

## Overview

The app now uses **Firebase Authentication** with Google sign-in to separate user data. Each user has their own portfolio and watchlist stored securely in MongoDB.

## Prerequisites

- Google Account
- Firebase Account
- MongoDB Atlas Account (or MongoDB instance)

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the wizard to create your project

## Step 2: Enable Google Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Toggle **Enable**
4. Select a support email
5. Click **Save**

## Step 3: Register Your Web App

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web icon** (`</>`)
4. Register your app with a nickname (e.g., "Prism Portfolio")
5. Copy the Firebase configuration object

## Step 4: Set Up Firebase Admin SDK (for Backend)

### Option A: Service Account Key (Recommended for Production)

1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. **IMPORTANT**: Keep this file secure and never commit it to git!
5. Convert the JSON to a single-line string for the environment variable

### Option B: Application Default Credentials (for Local Development)

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run: `firebase login`
3. Your local environment will use your credentials automatically

## Step 5: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your values:

```env
# MongoDB (keep your existing value)
MONGODB_URI=your_mongodb_uri_here

# Gemini API (keep your existing value)
GEMINI_API_KEY=your_gemini_key_here

# Firebase Frontend Config (from Step 3)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:...

# Firebase Backend (from Step 4)
# For production, use the service account JSON as a single-line string:
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# For local development with firebase login, leave empty or omit
```

## Step 6: Install Dependencies

```bash
# Install frontend Firebase SDK
npm install firebase

# Install backend Firebase Admin SDK
cd server
npm install firebase-admin
cd ..
```

## Step 7: Update MongoDB (Optional - for existing data)

If you have existing card data without a `userId` field, you can either:

### Option A: Start Fresh
- Keep existing data in a backup collection
- New users will create new cards

### Option B: Migrate Existing Data
Run this MongoDB script to add a default userId to existing cards:

```javascript
// In MongoDB shell or Compass
db.cards.updateMany(
  { userId: { $exists: false } },
  { $set: { userId: "your-firebase-user-id-here" } }
)
```

To get your Firebase user ID:
1. Sign in to the app
2. Check browser console for "Authenticated user: [user-id]"

## Step 8: Run the Application

### Local Development

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
npm run server
```

Visit: http://localhost:5173

### Production Deployment (Vercel)

1. Push your code to GitHub (ensure .env.local is in .gitignore!)
2. In Vercel Dashboard → Your Project → Settings → Environment Variables
3. Add all the environment variables from your .env.local file
4. Redeploy

---

## How It Works

### Frontend Flow
1. User lands on the app
2. If not authenticated, shows **Login screen**
3. User clicks "Continue with Google"
4. Firebase handles Google OAuth flow
5. Upon success, user is redirected to the app
6. All API requests include Firebase ID token in Authorization header

### Backend Flow
1. API receives request with `Authorization: Bearer [token]` header
2. Firebase Admin SDK verifies the token
3. Extracts `userId` from verified token
4. All database operations filter by `userId`
5. Users can only see/modify their own cards

### Security Features
- ✅ Token-based authentication
- ✅ User data isolation
- ✅ Server-side token verification
- ✅ Automatic token refresh
- ✅ Secure sign-out

---

## Troubleshooting

### "Unauthorized: No token provided"
- Check that Firebase is properly initialized in [firebase.ts](firebase.ts)
- Verify environment variables are loaded (check browser console)
- Clear browser cache and sign in again

### "Unauthorized: Invalid token"
- Firebase Admin SDK may not be initialized properly
- Check `FIREBASE_SERVICE_ACCOUNT_KEY` in server environment
- Or ensure `firebase login` was successful for local development

### "Failed to fetch cards"
- Check browser console for detailed errors
- Verify backend server is running (port 3001)
- Check MongoDB connection

### Firebase errors during build
- Ensure all `VITE_FIREBASE_*` variables are set
- For Vercel, add them in project settings, not just .env.local

---

## File Structure

```
CardFolioTracker/
├── firebase.ts                      # Firebase client initialization
├── contexts/
│   └── AuthContext.tsx             # Authentication context & hooks
├── components/
│   └── Login.tsx                   # Login screen component
├── services/
│   ├── dataService.ts              # Updated with auth headers
│   └── geminiService.ts            # Updated with auth headers
├── server/
│   └── src/
│       ├── firebaseAdmin.ts        # Firebase Admin SDK setup
│       ├── db.ts                   # Updated with userId filtering
│       └── routes.ts               # Updated with auth middleware
├── api/
│   └── index.ts                    # Vercel serverless with auth
└── App.tsx                         # Updated with auth flow
```

---

## Next Steps

- [ ] Test Google sign-in flow
- [ ] Add multiple cards and verify data isolation
- [ ] Test on different browsers
- [ ] Deploy to production
- [ ] Optional: Add email/password authentication
- [ ] Optional: Add profile photo upload
- [ ] Optional: Add account deletion flow

---

## Support

For issues or questions:
1. Check Firebase Console → Authentication for logged errors
2. Check browser developer console
3. Check server logs for backend errors
4. Verify all environment variables are set correctly
