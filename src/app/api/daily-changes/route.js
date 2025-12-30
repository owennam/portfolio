import yahooFinance from 'yahoo-finance2';
import { db } from '@/lib/firebaseAdmin';

const yf = new yahooFinance();

export async function GET() {
    try {
        // 1. Read Trades from Firestore
        const snapshot = await db.collection('trades').get();
        const trades = snapshot.docs.map(doc => doc.data());

        // 2. Calculate Holdings
        const holdings = {};
        trades.forEach(trade => {
            const { ticker, type, quantity } = trade;
            const qty = parseFloat(quantity);

            if (!holdings[ticker]) holdings[ticker] = 0;

            if (type === 'Buy') {
                holdings[ticker] += qty;
            } else if (type === 'Sell') {
                holdings[ticker] -= qty;
            }
        });

        // 3. Filter Active Tickers
        const activeTickers = Object.keys(holdings).filter(ticker => holdings[ticker] > 0.000001);

        if (activeTickers.length === 0) {
            return Response.json([]);
        }

        // 4. Fetch Daily Changes
        const results = await Promise.all(activeTickers.map(async (ticker) => {
            try {
                const quote = await yf.quote(ticker);
                return {
                    ticker,
                    price: quote.regularMarketPrice,
                    changePercent: quote.regularMarketChangePercent,
                    currency: quote.currency,
                    shortName: quote.shortName
                };
            } catch (e) {
                // Retry with suffixes for Korean stocks if needed
                if (/^\d{6}$/.test(ticker)) {
                    try {
                        const quote = await yf.quote(ticker + '.KS');
                        return {
                            ticker,
                            price: quote.regularMarketPrice,
                            changePercent: quote.regularMarketChangePercent,
                            currency: quote.currency,
                            shortName: quote.shortName
                        };
                    } catch (e2) {
                        try {
                            const quote = await yf.quote(ticker + '.KQ');
                            return {
                                ticker,
                                price: quote.regularMarketPrice,
                                changePercent: quote.regularMarketChangePercent,
                                currency: quote.currency,
                                shortName: quote.shortName
                            };
                        } catch (e3) {
                            // Failed
                        }
                    }
                }
                return { ticker, error: 'Failed to fetch' };
            }
        }));

        return Response.json(results);

    } catch (error) {
        console.error('Daily Changes API Error:', error);
        return Response.json({ error: 'Failed to fetch daily changes' }, { status: 500 });
    }
}
