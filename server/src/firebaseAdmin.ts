import admin from 'firebase-admin';

// Initialize Firebase Admin
let app: admin.app.App | null = null;

export const initializeFirebaseAdmin = () => {
  // Check if already initialized (Firebase Admin SDK will throw if initialized twice)
  if (admin.apps.length > 0) {
    console.log('[Firebase Admin] Already initialized');
    return admin.apps[0];
  }

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
      console.log('[Firebase Admin] Initializing with service account...');
      const parsed = JSON.parse(serviceAccount);
      app = admin.initializeApp({
        credential: admin.credential.cert(parsed)
      });
      console.log('[Firebase Admin] Initialized successfully with service account');
    } else {
      console.log('[Firebase Admin] Initializing with application default credentials...');
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('[Firebase Admin] Initialized successfully with default credentials');
    }
  } catch (error: any) {
    console.error('[Firebase Admin] Initialization error:', error.message);
    console.error('[Firebase Admin] Stack:', error.stack);
    throw error;
  }

  return app;
};

// Middleware to verify Firebase ID token
export const verifyAuthToken = async (token: string): Promise<admin.auth.DecodedIdToken | null> => {
  try {
    // Ensure Firebase Admin is initialized
    if (admin.apps.length === 0) {
      console.log('[Firebase Admin] Not initialized, initializing now...');
      initializeFirebaseAdmin();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error: any) {
    console.error('[Firebase Admin] Token verification error:', error.message);
    return null;
  }
};

// Send FCM notification to specific device tokens
export const sendNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> => {
  try {
    // Ensure Firebase Admin is initialized
    if (admin.apps.length === 0) {
      console.log('[Firebase Admin] Not initialized, initializing now...');
      initializeFirebaseAdmin();
    }

    if (tokens.length === 0) {
      console.log('[FCM] No tokens to send to');
      return { successCount: 0, failureCount: 0 };
    }

    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      tokens: tokens
    };

    console.log('[FCM] Sending notification to', tokens.length, 'devices');
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log('[FCM] Successfully sent:', response.successCount);
    console.log('[FCM] Failed:', response.failureCount);

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`[FCM] Failed to send to token ${idx}:`, resp.error);
        }
      });
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error: any) {
    console.error('[FCM] Error sending notification:', error.message);
    throw error;
  }
};
