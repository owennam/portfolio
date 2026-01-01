'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Set persistence to SESSION (clears on window close)
                const authInstance = auth();
                if (authInstance) {
                    await setPersistence(authInstance, browserSessionPersistence);
                }
            } catch (error) {
                console.error("Failed to set persistence:", error);
            }

            const authInstance = auth();
            if (!authInstance) {
                setLoading(false);
                return () => { };
            }

            const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            });
            return unsubscribe;
        };

        const cleanupPromise = initializeAuth();
        return () => {
            cleanupPromise.then(unsubscribe => unsubscribe && unsubscribe());
        };
    }, []);

    const signIn = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            await signInWithPopup(auth(), provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            alert(`로그인 실패: ${error.message}`);
        }
    };

    const signOut = () => firebaseSignOut(auth());

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
