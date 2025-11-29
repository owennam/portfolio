const yahooFinance = require('yahoo-finance2').default;

async function test() {
    try {
        console.log("Testing Quote...");
        const quote = await yahooFinance.quote('^GSPC');
        console.log("Quote Result:", quote ? "Success" : "Empty");

        console.log("Testing Search...");
        const search = await yahooFinance.search('Stock Market', { newsCount: 3 });
        console.log("Search Result:", search);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
