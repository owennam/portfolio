import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logError } from '@/lib/logger';

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Handle newline characters in private key for Vercel
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

// Lazy initialization to prevent build-time errors when env vars are missing
function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        // Only initialize if we have credentials
        if (serviceAccount.clientEmail && serviceAccount.privateKey) {
            initializeApp({
                credential: cert(serviceAccount)
            });
        }
    }
}

// Export getter functions instead of direct instances
export const db = (() => {
    let instance;
    return () => {
        if (!instance) {
            initializeFirebaseAdmin();
            if (getApps().length > 0) {
                instance = getFirestore();
            }
        }
        return instance;
    };
})();

export const auth = (() => {
    let instance;
    return () => {
        if (!instance) {
            initializeFirebaseAdmin();
            if (getApps().length > 0) {
                instance = getAuth();
            }
        }
        return instance;
    };
})();

// Helper to verify ID token
export async function verifyAuth(request) {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
        return null;
    }

    try {
        const authInstance = auth();
        if (!authInstance) return null;
        const decodedToken = await authInstance.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        logError('Verify Auth Error', error);
        return null;
    }
}
