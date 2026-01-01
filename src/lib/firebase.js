import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Lazy initialization to prevent build-time errors
function initializeFirebaseApp() {
    if (getApps().length === 0 && firebaseConfig.apiKey) {
        return initializeApp(firebaseConfig);
    }
    return getApps()[0];
}

// Export getter instances
let _app, _auth, _db;

export const app = () => {
    if (!_app) _app = initializeFirebaseApp();
    return _app;
};

export const auth = () => {
    if (!_auth && app()) _auth = getAuth(app());
    return _auth;
};

export const db = () => {
    if (!_db && app()) _db = getFirestore(app());
    return _db;
};
