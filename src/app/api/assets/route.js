
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataFilePath = path.join(process.cwd(), 'data', 'assets.json');

async function ensureDataFile() {
    try {
        await fs.access(dataFilePath);
    } catch {
        await fs.writeFile(dataFilePath, '[]');
    }
}

export async function GET() {
    await ensureDataFile();
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf8');
        const data = JSON.parse(fileContent);
        return Response.json(data);
    } catch (error) {
        return Response.json({ error: 'Failed to read assets' }, { status: 500 });
    }
}

export async function POST(request) {
    await ensureDataFile();
    try {
        const item = await request.json();
        const fileContent = await fs.readFile(dataFilePath, 'utf8');
        const data = JSON.parse(fileContent);

        const newItem = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            ...item, // category, name, value, memo
        };

        data.push(newItem);
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

        return Response.json(newItem);
    } catch (error) {
        return Response.json({ error: 'Failed to save asset' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

        const fileContent = await fs.readFile(dataFilePath, 'utf8');
        let data = JSON.parse(fileContent);

        data = data.filter(item => item.id !== id);

        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}
