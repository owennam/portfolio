import yahooFinance from 'yahoo-finance2';

const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

async function testIndices() {
    const tickers = ['^TNX', '^RUT'];
    for (const ticker of tickers) {
        try {
            const quote = await yf.quote(ticker);
            console.log(`${ticker} Quote:`, quote.shortName, quote.regularMarketPrice);
        } catch (error) {
            console.error(`Error fetching ${ticker}:`, error.message);
        }
    }
}

testIndices();
