import { promises as fs } from 'fs';
import path from 'path';

const tradesPath = path.join(process.cwd(), 'data', 'trades.json');
const analysisPath = path.join(process.cwd(), 'data', 'analysis.json');

async function populateAnalysis() {
    try {
        // 1. Read Trades
        const tradesRaw = await fs.readFile(tradesPath, 'utf8');
        const trades = JSON.parse(tradesRaw);

        // 2. Identify US Stocks
        const usStocks = {};
        trades.forEach(trade => {
            if (trade.assetClass === 'US Stock') {
                const ticker = trade.ticker.toUpperCase();
                if (!usStocks[ticker]) {
                    usStocks[ticker] = trade.name || ticker;
                }
            }
        });

        console.log('Found US Stocks:', Object.keys(usStocks));

        // 3. Read Existing Analysis
        let analysis = {};
        try {
            const analysisRaw = await fs.readFile(analysisPath, 'utf8');
            analysis = JSON.parse(analysisRaw);
        } catch (e) {
            console.log('No existing analysis file, creating new.');
        }

        // 4. Add Missing Entries
        let addedCount = 0;
        for (const [ticker, name] of Object.entries(usStocks)) {
            if (!analysis[ticker]) {
                console.log(`Adding template for ${ticker}...`);
                analysis[ticker] = {
                    ticker: ticker,
                    name: name,
                    intrinsicValue: {
                        midpoint: null, // Pending
                        range: { low: null, high: null },
                        method: "Pending",
                        lastUpdated: null,
                        history: []
                    },
                    moat: {
                        score: null,
                        rating: "Unrated",
                        breakdown: {
                            networkEffect: 0,
                            switchingCosts: 0,
                            intangibleAssets: 0,
                            costAdvantage: 0,
                            efficientScale: 0
                        },
                        lastUpdated: null
                    },
                    capitalAllocation: {
                        overallGrade: "Unrated",
                        roe: { current: null, grade: "-" },
                        roic: { current: null, grade: "-" },
                        debtEquity: { current: null, grade: "-" },
                        lastUpdated: null
                    },
                    investmentThesis: {
                        hypotheses: [],
                        lastUpdated: null
                    },
                    sellCriteria: [],
                    recommendation: {
                        action: "ANALYZE",
                        reason: "Initial template created. Analysis required.",
                        targetPrice: null
                    },
                    alerts: {
                        marginOfSafety: { threshold: -20, triggered: false },
                        moatWeakening: { threshold: 15, triggered: false }
                    },
                    nextActions: [],
                    priceHistory: []
                };
                addedCount++;
            } else {
                // Ensure new fields exist for existing entries
                if (!analysis[ticker].alerts) {
                    analysis[ticker].alerts = {
                        marginOfSafety: { threshold: -20, triggered: false },
                        moatWeakening: { threshold: 15, triggered: false }
                    };
                }
                if (!analysis[ticker].nextActions) analysis[ticker].nextActions = [];
                if (!analysis[ticker].priceHistory) analysis[ticker].priceHistory = [];
            }
        }

        // 5. Save
        if (addedCount > 0) {
            await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
            console.log(`Successfully added ${addedCount} new analysis templates.`);
        } else {
            console.log('No new stocks to add.');
        }

    } catch (error) {
        console.error('Error populating analysis:', error);
    }
}

populateAnalysis();
