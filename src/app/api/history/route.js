import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const historyFile = path.join(dataDir, 'history.json');

async function ensureDataDir() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function getHistory() {
    await ensureDataDir();
    try {
        const data = await fs.readFile(historyFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveHistory(history) {
    await ensureDataDir();
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
}

export async function GET() {
    const history = await getHistory();
    return Response.json(history);
}

export async function POST(request) {
    try {
        const { date, totalValue, investedAmount } = await request.json();

        if (!date || totalValue === undefined) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const history = await getHistory();

        // Check if entry for this date already exists
        const existingIndex = history.findIndex(h => h.date === date);

        if (existingIndex >= 0) {
            // Update existing entry
            history[existingIndex] = { ...history[existingIndex], totalValue, investedAmount };
        } else {
            // Add new entry
            history.push({ date, totalValue, investedAmount });
        }

        // Sort by date
        history.sort((a, b) => new Date(a.date) - new Date(b.date));

        await saveHistory(history);

        return Response.json({ success: true, history });
    } catch (error) {
        console.error('Failed to save history', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
