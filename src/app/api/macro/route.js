import { NextResponse } from 'next/server';
import { fetchMacroData } from '@/lib/macroUtils';

export async function GET() {
    try {
        const data = await fetchMacroData();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Macro API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch macro data' }, { status: 500 });
    }
}
