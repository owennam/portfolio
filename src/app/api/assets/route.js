import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { logError } from '@/lib/logger';

const DATA_FILE = path.join(process.cwd(), 'data', 'assets.json');

// Helper to read JSON file
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        logError('Failed to read assets file', error);
        return [];
    }
}

// Helper to write JSON file
async function writeData(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        logError('Failed to write assets file', error);
        throw error;
    }
}

export async function GET() {
    try {
        const data = await readData();
        return Response.json(data);
    } catch (error) {
        logError('Failed to fetch assets', error);
        return Response.json({ error: 'Failed to read assets' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const item = await request.json();
        const data = await readData();

        const newItem = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            ...item, // category, name, value, memo
        };

        data.push(newItem);
        await writeData(data);

        return Response.json(newItem);
    } catch (error) {
        logError('Failed to save asset', error);
        return Response.json({ error: 'Failed to save asset' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

        const data = await readData();
        const filtered = data.filter(item => item.id !== id);
        await writeData(filtered);

        return Response.json({ success: true });
    } catch (error) {
        logError('Failed to delete asset', error);
        return Response.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

        const updates = await request.json();
        const data = await readData();

        const index = data.findIndex(item => item.id === id);
        if (index === -1) {
            return Response.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Update the item, preserving id and createdAt
        data[index] = {
            ...data[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await writeData(data);

        return Response.json(data[index]);
    } catch (error) {
        logError('Failed to update asset', error);
        return Response.json({ error: 'Failed to update asset' }, { status: 500 });
    }
}

