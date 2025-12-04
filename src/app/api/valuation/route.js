import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fetchFinancialData } from '@/lib/valuation/fetchData';
import { runValuationModels } from '@/lib/valuation/models';

const ANALYSIS_FILE = path.join(process.cwd(), 'data', 'analysis.json');

export async function POST(request) {
    try {
        const { ticker } = await request.json();

        if (!ticker) {
            return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
        }

        // 1. Fetch Data
        console.log(`Fetching data for ${ticker}...`);
        const financialData = await fetchFinancialData(ticker);
        console.log('Financial Data:', JSON.stringify(financialData, null, 2));

        if (!financialData) {
            return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 });
        }

        // 2. Run Models
        console.log('Running valuation models...');
        const valuationResult = runValuationModels(financialData);
        console.log('Valuation Result:', JSON.stringify(valuationResult, null, 2));

        // 3. Update analysis.json
        const fileData = fs.readFileSync(ANALYSIS_FILE, 'utf8');
        const analysis = JSON.parse(fileData);

        if (!analysis[ticker]) {
            // Create basic entry if not exists (though populate-analysis should have handled this)
            analysis[ticker] = { ticker };
        }

        analysis[ticker].aiAnalysis = {
            ...valuationResult,
            lastUpdated: new Date().toISOString().split('T')[0]
        };

        fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(analysis, null, 2));

        return NextResponse.json({
            success: true,
            data: analysis[ticker].aiAnalysis
        });

    } catch (error) {
        console.error('Valuation API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
