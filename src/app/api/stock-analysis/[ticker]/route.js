import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'analysis.json');

async function getAnalysisData() {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        // If file doesn't exist, return empty object
        return {};
    }
}

async function saveAnalysisData(data) {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
}

export async function GET(request, { params }) {
    const { ticker } = await params;
    const data = await getAnalysisData();

    const analysis = data[ticker.toUpperCase()];

    if (!analysis) {
        return Response.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return Response.json(analysis);
}

export async function POST(request, { params }) {
    try {
        const { ticker } = await params;
        const updateData = await request.json();
        const tickerKey = ticker.toUpperCase();

        const data = await getAnalysisData();
        const currentAnalysis = data[tickerKey] || {
            ticker: tickerKey,
            intrinsicValue: { history: [] },
            moat: {},
            capitalAllocation: {},
            investmentThesis: {},
            sellCriteria: [],
            recommendation: {}
        };

        // Handle History Archiving for Intrinsic Value
        if (updateData.intrinsicValue && currentAnalysis.intrinsicValue.midpoint) {
            // If midpoint changed, add to history
            if (updateData.intrinsicValue.midpoint !== currentAnalysis.intrinsicValue.midpoint) {
                const today = new Date().toISOString().split('T')[0];
                const historyEntry = {
                    date: currentAnalysis.intrinsicValue.lastUpdated || today,
                    value: currentAnalysis.intrinsicValue.midpoint
                };

                // Initialize history if missing
                if (!currentAnalysis.intrinsicValue.history) {
                    currentAnalysis.intrinsicValue.history = [];
                }

                currentAnalysis.intrinsicValue.history.push(historyEntry);
            }
        }

        // Merge updates
        const updatedAnalysis = {
            ...currentAnalysis,
            ...updateData,
            intrinsicValue: {
                ...currentAnalysis.intrinsicValue,
                ...updateData.intrinsicValue,
                history: currentAnalysis.intrinsicValue.history || [] // Preserve history
            },
            moat: { ...currentAnalysis.moat, ...updateData.moat },
            capitalAllocation: { ...currentAnalysis.capitalAllocation, ...updateData.capitalAllocation },
            investmentThesis: { ...currentAnalysis.investmentThesis, ...updateData.investmentThesis },
            sellCriteria: updateData.sellCriteria || currentAnalysis.sellCriteria,
            recommendation: { ...currentAnalysis.recommendation, ...updateData.recommendation }
        };

        // Update timestamps
        const today = new Date().toISOString().split('T')[0];
        if (updateData.intrinsicValue) updatedAnalysis.intrinsicValue.lastUpdated = today;
        if (updateData.moat) updatedAnalysis.moat.lastUpdated = today;
        if (updateData.capitalAllocation) updatedAnalysis.capitalAllocation.lastUpdated = today;
        if (updateData.investmentThesis) updatedAnalysis.investmentThesis.lastUpdated = today;

        data[tickerKey] = updatedAnalysis;
        await saveAnalysisData(data);

        return Response.json(updatedAnalysis);
    } catch (error) {
        console.error('Stock Analysis POST Error:', error);
        return Response.json({ error: 'Failed to update analysis', details: error.message }, { status: 500 });
    }
}
