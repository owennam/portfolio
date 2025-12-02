import yahooFinance from 'yahoo-finance2';

const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

async function testDollarIndex() {
    const ticker = 'DX-Y.NYB';
    try {
        const quote = await yf.quote(ticker);
        console.log(`${ticker} Quote:`, quote.shortName, quote.regularMarketPrice);
    } catch (error) {
        console.error(`Error fetching ${ticker}:`, error.message);
    }
}

testDollarIndex();
