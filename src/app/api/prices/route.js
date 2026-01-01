import yahooFinance from 'yahoo-finance2';
// Suppress survey notice to keep logs clean
const yf = new yahooFinance({
    logger: { info: () => { }, warn: () => { }, error: (...args) => console.error(...args) }
});
// Alternatively, just ignore known notices if config allows, but custom logger is safer.

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers')?.split(',');

    if (!tickers || tickers.length === 0) {
        return Response.json({ error: 'No tickers provided' }, { status: 400 });
    }

    // Split into simple (batchable) and complex (retry-needed) tickers
    const simpleTickers = [];
    const complexTickers = []; // 6-digit codes that might need .KS/.KQ suffix

    tickers.forEach(t => {
        if (/^[0-9A-Z]{6}$/.test(t)) {
            complexTickers.push(t);
        } else {
            simpleTickers.push(t);
        }
    });

    const results = [];

    // 1. Batch Simple Tickers
    if (simpleTickers.length > 0) {
        try {
            const batchResults = await yf.quote(simpleTickers, { return: 'array' });
            batchResults.forEach(quote => {
                results.push({
                    ticker: quote.symbol,
                    price: quote.regularMarketPrice,
                    changePercent: quote.regularMarketChangePercent,
                    currency: quote.currency,
                    shortName: quote.shortName,
                    quoteType: quote.quoteType,
                });
            });
        } catch (e) {
            console.error('Batch fetch failed, falling back to individual', e);
            // Fallback: Add to complexTickers to try individually
            complexTickers.push(...simpleTickers);
        }
    }

    // 2. Process Complex Tickers (or fallback) Individually
    if (complexTickers.length > 0) {
        const individualResults = await Promise.all(
            complexTickers.map(async (ticker) => {
                try {
                    const quote = await yf.quote(ticker);
                    return {
                        ticker,
                        price: quote.regularMarketPrice,
                        changePercent: quote.regularMarketChangePercent,
                        currency: quote.currency,
                        shortName: quote.shortName,
                        quoteType: quote.quoteType,
                    };
                } catch (e) {
                    // Retry logic for 6-digit codes
                    if (/^[0-9A-Z]{6}$/.test(ticker)) {
                        try {
                            const quote = await yf.quote(ticker + '.KS');
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
                                const quote = await yf.quote(ticker + '.KQ');
                                return {
                                    ticker,
                                    price: quote.regularMarketPrice,
                                    changePercent: quote.regularMarketChangePercent,
                                    currency: quote.currency,
                                    shortName: quote.shortName,
                                    quoteType: quote.quoteType,
                                };
                            } catch (e3) { }
                        }
                    }
                    console.error(`Failed to fetch ${ticker}`, e);
                    return { ticker, error: 'Failed to fetch' };
                }
            })
        );
        results.push(...individualResults);
    }

    const validResults = results.filter(r => r && !r.error && typeof r.price === 'number' && r.price > 0);
    return Response.json(validResults);
}
