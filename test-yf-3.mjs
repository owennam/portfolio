import { YahooFinance } from 'yahoo-finance2';

async function test() {
    try {
        const yahooFinance = new YahooFinance();

        console.log("1. Testing Quote for ^GSPC...");
        const quote = await yahooFinance.quote('^GSPC');
        console.log("Quote Result:", quote ? `Success: ${quote.regularMarketPrice}` : "Empty");
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
