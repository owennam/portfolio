import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { db, verifyAuth } from '@/lib/firebaseAdmin';
import { logError, logDebug } from '@/lib/logger';

const COLLECTION_NAME = 'journals';
const JOURNALS_FILE = path.join(process.cwd(), 'data', 'journals.json');

// Helper: Read journals from local JSON
async function getLocalJournals() {
    try {
        const data = await fs.readFile(JOURNALS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // File doesn't exist or is invalid - return empty array
        return [];
    }
}

// Helper: Write journals to local JSON
async function saveLocalJournals(journals) {
    // Ensure data directory exists
    const dataDir = path.dirname(JOURNALS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
    await fs.writeFile(JOURNALS_FILE, JSON.stringify(journals, null, 2));
}

// Helper: Sync to Firebase (Fire and Forget)
async function syncToFirebase(entry) {
    try {
        const firestore = db();
        if (!firestore) {
            logDebug('Firebase not initialized, skipping sync');
            return;
        }
        // Use date as document ID for easy lookup
        await firestore.collection(COLLECTION_NAME).doc(entry.date).set(entry);
        logDebug(`[Sync] Journal ${entry.date} synced to Firestore`);
    } catch (error) {
        logError(`[Sync] Failed to sync journal ${entry.date}`, error);
        // Don't throw - this is background sync
    }
}

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

        // 1. Read from Local JSON
        const journals = await getLocalJournals();

        // 2. Upsert logic
        const index = journals.findIndex(j => j.date === date);
        let newEntry;

        if (index >= 0) {
            // Update existing
            newEntry = {
                ...journals[index],
                content,
                updatedAt: new Date().toISOString()
            };
            journals[index] = newEntry;
        } else {
            // Create new
            const id = Date.now().toString();
            newEntry = {
                id,
                date,
                content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            journals.push(newEntry);
        }

        // Sort by date descending (newest first)
        journals.sort((a, b) => b.date.localeCompare(a.date));

        // 3. Write to Local JSON
        await saveLocalJournals(journals);

        // 4. Sync to Firebase (Fire and Forget)
        syncToFirebase(newEntry).catch(err => logError('Firebase Sync Error', err));

        return NextResponse.json({ success: true, journal: newEntry });

    } catch (error) {
        logError('Failed to save journal', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Read from Local JSON (fast, always available)
        const journals = await getLocalJournals();
        return NextResponse.json({ journals });
    } catch (error) {
        logError('Failed to fetch journals', error);
        return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 });
    }
}
