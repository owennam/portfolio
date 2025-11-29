import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const journalsFile = path.join(dataDir, 'journals.json');

async function ensureDataDir() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function getJournals() {
    await ensureDataDir();
    try {
        const data = await fs.readFile(journalsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveJournals(journals) {
    await ensureDataDir();
    await fs.writeFile(journalsFile, JSON.stringify(journals, null, 2));
}

export async function GET() {
    const journals = await getJournals();
    // Sort by date descending
    journals.sort((a, b) => new Date(b.date) - new Date(a.date));
    return Response.json(journals);
}

export async function POST(request) {
    try {
        const { date, content } = await request.json();

        if (!date || !content) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const journals = await getJournals();

        // Check if entry for this date already exists
        const existingIndex = journals.findIndex(j => j.date === date);

        if (existingIndex >= 0) {
            // Update existing entry
            journals[existingIndex] = { ...journals[existingIndex], content, updatedAt: new Date().toISOString() };
        } else {
            // Add new entry
            journals.push({ date, content, createdAt: new Date().toISOString() });
        }

        await saveJournals(journals);

        return Response.json({ success: true });
    } catch (error) {
        console.error('Failed to save journal', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
