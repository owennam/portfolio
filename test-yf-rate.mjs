import yahooFinance from 'yahoo-finance2';
const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

async function test() {
    try {
        const ticker = 'KRW=X';
        console.log(`Fetching quote for ${ticker}...`);
        const quote = await yf.quote(ticker);
        console.log("Price:", quote.regularMarketPrice);
        console.log("Currency:", quote.currency);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
