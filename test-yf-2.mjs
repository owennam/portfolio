import yahooFinance from 'yahoo-finance2';

async function test() {
    try {
        console.log("1. Testing Quote for ^GSPC...");
        const quote = await yahooFinance.quote('^GSPC');
        console.log("Quote Result:", quote ? `Success: ${quote.regularMarketPrice}` : "Empty");

        console.log("2. Testing Search for 'Stock Market'...");
        const search = await yahooFinance.search('Stock Market', { newsCount: 3 });
        console.log("Search Result:", search.news && search.news.length > 0 ? `Success: ${search.news.length} items` : "Empty");
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
