import yahooFinance from 'yahoo-finance2';
const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

async function test() {
    try {
        const tickers = ['BTC', 'BTC-USD', 'ETH-USD'];
        for (const ticker of tickers) {
            console.log(`Fetching quote for ${ticker}...`);
            try {
                const quote = await yf.quote(ticker);
                console.log(`[${ticker}] Name: ${quote.shortName} | ${quote.longName} | Price: ${quote.regularMarketPrice}`);
            } catch (e) {
                console.log(`[${ticker}] Failed: ${e.message}`);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
