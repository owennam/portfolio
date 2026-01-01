import { NextResponse } from 'next/server';
import { db, verifyAuth } from '@/lib/firebaseAdmin';
import { logError } from '@/lib/logger';

const COLLECTION_NAME = 'journals';

export async function POST(request) {
    const auth = await verifyAuth(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { date, content } = body;

        if (!date || !content) {
            return NextResponse.json({ error: 'Date and content are required' }, { status: 400 });
        }

        // Check if entry for date exists
        const snapshot = await db().collection(COLLECTION_NAME).where('date', '==', date).limit(1).get();

        let docRef;
        let newEntry;

        if (!snapshot.empty) {
            // Update existing
            const doc = snapshot.docs[0];
            docRef = doc.ref;
            newEntry = {
                ...doc.data(),
                content,
                updatedAt: new Date().toISOString()
            };
            await docRef.update(newEntry);
        } else {
            // Create new
            const id = Date.now().toString();
            newEntry = {
                id,
                date,
                content,
                updatedAt: new Date().toISOString()
            };
            await db().collection(COLLECTION_NAME).doc(id).set(newEntry);
        }

        return NextResponse.json({ success: true, journal: newEntry });

    } catch (error) {
        logError('Failed to save journal', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const snapshot = await db().collection(COLLECTION_NAME).orderBy('date', 'desc').get();
        const journals = snapshot.docs.map(doc => doc.data());

        return NextResponse.json({ journals });
    } catch (error) {
        logError('Failed to fetch journals', error);
        return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 });
    }
}
