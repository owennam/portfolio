import { promises as fs } from 'fs';
import path from 'path';
import yahooFinance from 'yahoo-finance2';

const dataFilePath = path.join(process.cwd(), 'data', 'analysis.json');
const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

async function getAnalysisData() {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        return {};
    }
}

export async function GET() {
    try {
        const analysisData = await getAnalysisData();
        const tickers = Object.keys(analysisData);

        if (tickers.length === 0) {
            return Response.json({ overheated: [], undervalued: [], neutral: [] });
        }

        // Fetch current prices
        const pricePromises = tickers.map(async (ticker) => {
            try {
                const quote = await yf.quote(ticker);
                return {
                    ticker,
                    price: quote.regularMarketPrice
                };
            } catch (e) {
                // Try Korean suffixes
                if (/^\d{6}$/.test(ticker)) {
                    try {
                        const quote = await yf.quote(ticker + '.KS');
                        return { ticker, price: quote.regularMarketPrice };
                    } catch (e2) {
                        try {
                            const quote = await yf.quote(ticker + '.KQ');
                            return { ticker, price: quote.regularMarketPrice };
                        } catch (e3) { return null; }
                    }
                }
                return null;
            }
        });

        const prices = (await Promise.all(pricePromises)).filter(p => p !== null);

        const alerts = {
            overheated: [],
            undervalued: [],
            neutral: [],
            pending: []
        };

        tickers.forEach(ticker => {
            const analysis = analysisData[ticker];
            const priceObj = prices.find(p => p.ticker === ticker);

            if (priceObj) {
                const currentPrice = priceObj.price;

                // Check if analyzed
                if (analysis.intrinsicValue && analysis.intrinsicValue.midpoint) {
                    const intrinsicValue = analysis.intrinsicValue.midpoint;

                    // Margin of Safety = (Intrinsic Value - Current Price) / Intrinsic Value * 100
                    // Positive = Undervalued, Negative = Overvalued
                    const marginOfSafety = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;

                    const result = {
                        ticker,
                        name: analysis.name,
                        currentPrice,
                        intrinsicValue,
                        marginOfSafety: parseFloat(marginOfSafety.toFixed(2)),
                        recommendation: analysis.recommendation?.action || 'HOLD'
                    };

                    if (marginOfSafety <= -10) { // Overvalued by 10% or more
                        alerts.overheated.push(result);
                    } else if (marginOfSafety >= 20) { // Undervalued by 20% or more (Safety Margin)
                        alerts.undervalued.push(result);
                    } else {
                        alerts.neutral.push(result);
                    }
                } else {
                    // Pending Analysis
                    alerts.pending.push({
                        ticker,
                        name: analysis.name,
                        currentPrice,
                        recommendation: 'ANALYZE'
                    });
                }
            }
        });

        // Sorting Logic
        const getPriority = (action, type) => {
            const act = (action || '').toUpperCase();
            if (type === 'overheated') {
                // Order: SELL, HOLD, BUY
                if (act.includes('SELL')) return 1; // Covers SELL, STRONG SELL
                if (act === 'HOLD') return 2;
                if (act.includes('BUY')) return 3; // Covers BUY, STRONG BUY
                return 4;
            } else {
                // Order: STRONG BUY, BUY, HOLD, SELL
                if (act === 'STRONG BUY') return 1;
                if (act === 'BUY') return 2;
                if (act === 'HOLD') return 3;
                if (act.includes('SELL')) return 4;
                return 5;
            }
        };

        alerts.overheated.sort((a, b) => getPriority(a.recommendation, 'overheated') - getPriority(b.recommendation, 'overheated'));
        alerts.undervalued.sort((a, b) => getPriority(a.recommendation, 'normal') - getPriority(b.recommendation, 'normal'));
        alerts.neutral.sort((a, b) => getPriority(a.recommendation, 'normal') - getPriority(b.recommendation, 'normal'));

        return Response.json(alerts);

    } catch (error) {
        console.error('Value Alerts API Error:', error);
        return Response.json({ error: 'Failed to generate value alerts' }, { status: 500 });
    }
}
