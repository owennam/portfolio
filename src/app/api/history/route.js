import { db, verifyAuth } from '@/lib/firebaseAdmin';

const COLLECTION_NAME = 'history';

export async function GET() {
    try {
        const snapshot = await db().collection(COLLECTION_NAME).orderBy('date', 'asc').get();
        const history = snapshot.docs.map(doc => doc.data());
        return Response.json(history);
    } catch (error) {
        console.error('Failed to fetch history:', error);
        return Response.json([]);
    }
}

export async function POST(request) {
    const auth = await verifyAuth(request);
    if (!auth) {
        // Warning: Local auto-save uses this endpoint blindly.
        // For now, allow unauthenticated history save IF it is from localhost/server context?
        // Actually, history is auto-saved by client useEffect. We need client token there too.
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { date, totalValue, investedAmount, netWorth, totalAssets, liabilities } = await request.json();

        if (!date || totalValue === undefined) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newEntry = {
            date,
            totalValue,
            investedAmount,
            netWorth: netWorth || 0,
            totalAssets: totalAssets || 0,
            liabilities: liabilities || 0
        };

        // Use date as Document ID for easy upsert and uniqueness
        await db().collection(COLLECTION_NAME).doc(date).set(newEntry, { merge: true });

        // Retrieve full sorted history to return (legacy behavior expected by frontend)
        const snapshot = await db().collection(COLLECTION_NAME).orderBy('date', 'asc').get();
        const history = snapshot.docs.map(doc => doc.data());

        return Response.json({ success: true, history });
    } catch (error) {
        console.error('Failed to save history', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
