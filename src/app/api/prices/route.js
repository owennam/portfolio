import yahooFinance from 'yahoo-finance2';
const yf = new yahooFinance();

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers')?.split(',');

    if (!tickers || tickers.length === 0) {
        return Response.json({ error: 'No tickers provided' }, { status: 400 });
    }

    try {
        const results = await Promise.all(
            tickers.map(async (ticker) => {
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
                    // If failed and looks like 6 digits, try .KS then .KQ
                    // If failed and looks like 6 chars (digits or letters for some ETFs), try .KS then .KQ
                    if (/^[0-9A-Z]{6}$/.test(ticker)) {
                        try {
                            const quote = await yf.quote(ticker + '.KS');
                            return {
                                ticker, // Keep original ticker for matching
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
                            } catch (e3) {
                                // Failed all attempts
                            }
                        }
                    }
                    console.error(`Failed to fetch ${ticker}`, e);
                    return { ticker, error: 'Failed to fetch' };
                }
            })
        );

        const validResults = results.filter(r => r && !r.error && typeof r.price === 'number' && r.price > 0);
        return Response.json(validResults);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch prices' }, { status: 500 });
    }
}
