import { v4 as uuidv4 } from 'uuid';
import { db, verifyAuth } from '@/lib/firebaseAdmin';
import { appendTradeToSheet } from '@/lib/googleSheets';
import { logError } from '@/lib/logger';

const COLLECTION_NAME = 'trades';

export async function GET() {
  // GET is public (read-only)
  try {
    const snapshot = await db().collection(COLLECTION_NAME).orderBy('createdAt', 'desc').get();
    const trades = snapshot.docs.map(doc => doc.data());
    return Response.json(trades);
  } catch (error) {
    logError('Failed to fetch trades from Firestore', error);
    return Response.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const trade = await request.json();

    const newTrade = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...trade, // date, type, assetClass, ticker, price, quantity
    };

    // Save to Firestore
    await db().collection(COLLECTION_NAME).doc(newTrade.id).set(newTrade);

    // Append to Google Sheet (fire and forget)
    appendTradeToSheet(newTrade).catch(err => logError('Sheet upload failed', err));

    return Response.json(newTrade);
  } catch (error) {
    logError('Failed to save trade', error);
    return Response.json({ error: 'Failed to save trade' }, { status: 500 });
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

    if (!id) {
      return Response.json({ error: 'Trade ID is required' }, { status: 400 });
    }

    await db().collection(COLLECTION_NAME).doc(id).delete();

    return Response.json({ success: true });
  } catch (error) {
    logError('Failed to delete trade', error);
    return Response.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updateData = await request.json();
    const { id, ...updates } = updateData;

    if (!id) {
      return Response.json({ error: 'Trade ID is required' }, { status: 400 });
    }

    const docRef = db().collection(COLLECTION_NAME).doc(id);
    await docRef.update(updates);

    // Fetch updated doc to return
    const updatedDoc = await docRef.get();

    return Response.json(updatedDoc.data());
  } catch (error) {
    logError('Failed to update trade', error);
    return Response.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}
