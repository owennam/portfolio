import { v4 as uuidv4 } from 'uuid';
import { db, verifyAuth } from '@/lib/firebaseAdmin';

const COLLECTION_NAME = 'liabilities';

export async function GET() {
    try {
        const snapshot = await db().collection(COLLECTION_NAME).get();
        const data = snapshot.docs.map(doc => doc.data());
        return Response.json(data);
    } catch (error) {
        console.error('Failed to fetch liabilities:', error);
        return Response.json({ error: 'Failed to read liabilities' }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await verifyAuth(request);
    if (!auth) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const item = await request.json();

        const newItem = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            ...item, // name, amount, interestRate, maturityDate
        };

        await db().collection(COLLECTION_NAME).doc(newItem.id).set(newItem);

        return Response.json(newItem);
    } catch (error) {
        console.error('Failed to save liability:', error);
        return Response.json({ error: 'Failed to save liability' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const auth = await verifyAuth(request);
    if (!auth) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

        await db().collection(COLLECTION_NAME).doc(id).delete();

        return Response.json({ success: true });
    } catch (error) {
        console.error('Failed to delete liability:', error);
        return Response.json({ error: 'Failed to delete liability' }, { status: 500 });
    }
}
