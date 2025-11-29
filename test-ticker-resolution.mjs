import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function test() {
    const tickers = ['462900', '462900.KS', '462900.KQ'];
    for (const ticker of tickers) {
        try {
            console.log(`Testing ${ticker}...`);
            const quote = await yahooFinance.quote(ticker);
            console.log(`Success ${ticker}:`, quote.shortName, quote.regularMarketPrice);
        } catch (e) {
            console.log(`Failed ${ticker}:`, e.message);
        }
    }
}

test();
