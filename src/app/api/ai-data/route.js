
import { promises as fs } from 'fs';
import path from 'path';
import yahooFinance from 'yahoo-finance2';
import { calculatePortfolioStats } from '@/lib/portfolioUtils';
import { fetchMacroData } from '@/lib/macroUtils';

const yf = new yahooFinance();

export async function GET() {
    try {
        // 1. Load Data
        const tradesPath = path.join(process.cwd(), 'data', 'trades.json');
        const journalsPath = path.join(process.cwd(), 'data', 'journals.json');

        const [tradesData, journalsData] = await Promise.all([
            fs.readFile(tradesPath, 'utf8').catch(() => '[]'),
            fs.readFile(journalsPath, 'utf8').catch(() => '[]')
        ]);

        const trades = JSON.parse(tradesData);
        const journals = JSON.parse(journalsData);

        // 2. Get Unique Tickers for Price Fetching
        const tickers = [...new Set(trades.map(t => t.ticker))];

        // 3. Fetch Current Prices
        const pricePromises = tickers.map(async (ticker) => {
            try {
                const quote = await yf.quote(ticker);
                return {
                    ticker,
                    price: quote.regularMarketPrice,
                    changePercent: quote.regularMarketChangePercent, // Fetch daily change
                    quoteType: quote.quoteType
                };
            } catch (e) {
                // Fallback for Korean stocks if simple ticker fails
                if (/^\d{6}$/.test(ticker)) {
                    try {
                        const quote = await yf.quote(ticker + '.KS');
                        return {
                            ticker,
                            price: quote.regularMarketPrice,
                            changePercent: quote.regularMarketChangePercent,
                            quoteType: quote.quoteType
                        };
                    } catch (e2) {
                        try {
                            const quote = await yf.quote(ticker + '.KQ');
                            return {
                                ticker,
                                price: quote.regularMarketPrice,
                                changePercent: quote.regularMarketChangePercent,
                                quoteType: quote.quoteType
                            };
                        } catch (e3) { return null; }
                    }
                }
                return null;
            }
        });

        const prices = (await Promise.all(pricePromises)).filter(p => p !== null && typeof p.price === 'number' && p.price > 0);

        // 4. Fetch Exchange Rate
        let exchangeRate = 1400;
        try {
            const rateQuote = await yf.quote('KRW=X');
            exchangeRate = rateQuote.regularMarketPrice;
        } catch (e) {
            console.error('Failed to fetch exchange rate', e);
        }

        // Sanity Check for Exchange Rate
        if (!exchangeRate || exchangeRate < 100) {
            console.warn('Invalid exchange rate detected, using fallback (1400)');
            exchangeRate = 1400;
        }

        // 5. Calculate Stats
        const stats = calculatePortfolioStats(trades, prices, exchangeRate);

        // 6. Fetch Liquidity Data
        let liquidity = null;
        try {
            liquidity = await fetchMacroData();
        } catch (e) {
            console.error('Failed to fetch liquidity for AI data:', e);
        }

        // 7. Prepare Response Data
        const responseData = {
            summary: {
                totalValue: Math.round(stats.totalValue),
                netProfit: Math.round(stats.netProfit),
                roi: parseFloat(stats.roi.toFixed(2)),
                exchangeRate: exchangeRate
            },
            holdings: stats.assets.map(a => {
                // Find price object to get daily change
                const priceObj = prices.find(p => p.ticker === a.ticker);
                return {
                    ticker: a.ticker,
                    name: a.name,
                    assetClass: a.assetClass,
                    quantity: a.quantity,
                    avgPrice: Math.round(a.avgPrice),
                    currentPrice: Math.round(a.currentPrice),
                    dailyChange: priceObj ? parseFloat(priceObj.changePercent?.toFixed(2)) : 0, // Add dailyChange
                    totalValue: Math.round(a.currentValue),
                    profit: Math.round(a.profit),
                    roi: parseFloat(a.roi.toFixed(2))
                };
            }).sort((a, b) => b.totalValue - a.totalValue),
            recentTrades: trades.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20),
            latestJournal: journals.sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null,
            liquidity
        };

        return Response.json(responseData);

    } catch (error) {
        console.error('AI Data API Error:', error);
        return Response.json({ error: 'Failed to generate AI data' }, { status: 500 });
    }
}
