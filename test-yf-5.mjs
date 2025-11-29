import yahooFinance from 'yahoo-finance2';

async function test() {
    try {
        console.log("Instantiating YahooFinance...");
        const yf = new yahooFinance();

        console.log("Testing Quote for ^GSPC...");
        const quote = await yf.quote('^GSPC');
        console.log("Quote Result:", quote ? `Success: ${quote.regularMarketPrice}` : "Empty");
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
