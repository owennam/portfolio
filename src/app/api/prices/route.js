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

    // 429 Prevention: Fetch sequentially with small delay between groups
    // Batching (yf.quote(['A','B'])) is fragile and fails if ANY ticker is invalid.
    // So we fetch individually but with concurrency control.

    // Split into chunks of 3 to process in parallel, then wait.
    const chunkSize = 3;
    const chunks = [];
    for (let i = 0; i < tickers.length; i += chunkSize) {
        chunks.push(tickers.slice(i, i + chunkSize));
    }

    const results = [];

    for (const chunk of chunks) {
        const chunkResults = await Promise.all(
            chunk.map(async (ticker) => {
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
                    // Failover logic for Korean stocks
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
                    console.error(`Failed to fetch ${ticker}`, e.message);
                    return { ticker, error: 'Failed to fetch' };
                }
            })
        );
        results.push(...chunkResults);

        // Wait 200ms between chunks to be nice to Yahoo API
        if (chunks.indexOf(chunk) < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    const validResults = results.filter(r => r && !r.error && typeof r.price === 'number' && r.price > 0);
    return Response.json(validResults);
}
