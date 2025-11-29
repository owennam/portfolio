import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'targets.json');

export async function GET() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        return Response.json(JSON.parse(data));
    } catch (error) {
        // If file doesn't exist, return empty object
        if (error.code === 'ENOENT') {
            return Response.json({});
        }
        return Response.json({ error: 'Failed to read targets' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const newTargets = await request.json();
        await fs.writeFile(dataFilePath, JSON.stringify(newTargets, null, 2));
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: 'Failed to save targets' }, { status: 500 });
    }
}
