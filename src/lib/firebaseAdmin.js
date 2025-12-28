import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Handle newline characters in private key for Vercel
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

if (getApps().length === 0) {
    // Only initialize if we have credentials (prevents build errors if envs missing)
    if (serviceAccount.clientEmail && serviceAccount.privateKey) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    }
}

const db = getFirestore();
const auth = getAuth();

export { db, auth };

// Helper to verify ID token
export async function verifyAuth(request) {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
        return null;
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Verify Auth Error:', error);
        return null;
    }
}
