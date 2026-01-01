import yahooFinance from 'yahoo-finance2';

// yahoo-finance2 is used directly as a module

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers')?.split(',');

    if (!tickers || tickers.length === 0) {
        return Response.json({ error: 'No tickers provided' }, { status: 400 });
    }

    const errors = []; // Collect errors for debugging

    // Process all tickers in parallel to stay within Vercel's 10s timeout
    const results = await Promise.all(
        tickers.map(async (ticker) => {
            try {
                const quote = await yahooFinance.quote(ticker);
                return {
                    ticker,
                    price: quote.regularMarketPrice,
                    changePercent: quote.regularMarketChangePercent,
                    currency: quote.currency,
                    shortName: quote.shortName,
                    quoteType: quote.quoteType,
                };
            } catch (e) {
                // Failover logic for Korean stocks (6-digit codes)
                if (/^[0-9A-Z]{6}$/.test(ticker)) {
                    try {
                        const quote = await yahooFinance.quote(ticker + '.KS');
                        return {
                            ticker,
                            price: quote.regularMarketPrice,
                            changePercent: quote.regularMarketChangePercent,
                            currency: quote.currency,
                            shortName: quote.shortName,
                            quoteType: quote.quoteType,
                        };
                    } catch (e2) {
                        try {
                            const quote = await yahooFinance.quote(ticker + '.KQ');
                            return {
                                ticker,
                                price: quote.regularMarketPrice,
                                changePercent: quote.regularMarketChangePercent,
                                currency: quote.currency,
                                shortName: quote.shortName,
                                quoteType: quote.quoteType,
                            };
                        } catch (e3) {
                            errors.push({ ticker, error: e3.message });
                        }
                    }
                } else {
                    // Log the actual error for debugging
                    errors.push({ ticker, error: e.message || String(e) });
                }
                return { ticker, error: 'Failed to fetch' };
            }
        })
    );

    const validResults = results.filter(r => r && !r.error && typeof r.price === 'number' && r.price > 0);

    // Return errors in debug mode for troubleshooting
    if (validResults.length === 0 && errors.length > 0) {
        return Response.json({
            data: [],
            debug: errors.slice(0, 5) // Return first 5 errors for diagnosis
        });
    }

    return Response.json(validResults);
}
