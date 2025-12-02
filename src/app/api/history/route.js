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
        const { date, totalValue, investedAmount, netWorth, totalAssets, liabilities } = await request.json();

        if (!date || totalValue === undefined) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const history = await getHistory();

        // Check if entry for this date already exists
        const existingIndex = history.findIndex(h => h.date === date);

        const newEntry = {
            date,
            totalValue,
            investedAmount,
            netWorth: netWorth || 0,
            totalAssets: totalAssets || 0,
            liabilities: liabilities || 0
        };

        if (existingIndex >= 0) {
            // Update existing entry
            history[existingIndex] = { ...history[existingIndex], ...newEntry };
        } else {
            // Add new entry
            history.push(newEntry);
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
