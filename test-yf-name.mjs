import yahooFinance from 'yahoo-finance2';
const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

async function test() {
    try {
        const ticker = '000660.ks';
        console.log(`Fetching quote for ${ticker}...`);
        const quote = await yf.quote(ticker);
        console.log("Short Name:", quote.shortName);
        console.log("Long Name:", quote.longName);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
