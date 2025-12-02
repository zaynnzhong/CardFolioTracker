import admin from 'firebase-admin';

// Initialize Firebase Admin
let app: admin.app.App;

export const initializeFirebaseAdmin = () => {
  if (!app) {
    try {
      // For production: use service account credentials
      // For development: you can use application default credentials or a service account file

      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccount) {
        // If service account is provided as JSON string in env
        app = admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount))
        });
      } else {
        // Fall back to application default credentials (works in local dev with firebase login)
        app = admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
      }

      console.log('[Firebase Admin] Initialized successfully');
    } catch (error) {
      console.error('[Firebase Admin] Initialization error:', error);
      throw error;
    }
  }
  return app;
};

// Middleware to verify Firebase ID token
export const verifyAuthToken = async (token: string): Promise<admin.auth.DecodedIdToken | null> => {
  if (!app) {
    initializeFirebaseAdmin();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('[Firebase Admin] Token verification error:', error);
    return null;
  }
};
