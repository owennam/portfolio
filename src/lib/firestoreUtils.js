
import { db } from './firebaseAdmin.js';

export const COLLECTIONS = {
    TRADES: 'trades',
};

export async function addTradeToFirestore(trade) {
    try {
        const docRef = db.collection(COLLECTIONS.TRADES).doc(trade.id);
        await docRef.set(trade);
        console.log(`Trade ${trade.id} added to Firestore`);
        return true;
    } catch (error) {
        console.error('Error adding trade to Firestore:', error);
        return false;
    }
}
