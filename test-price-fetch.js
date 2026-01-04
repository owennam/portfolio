
import yahooFinance from 'yahoo-finance2';

const tickers = ['0047A0', '0093D0', '462900']; // TIGER China Tech, KoAct Palantir, KoAct Bio

async function testFetch() {
    console.log("Testing fetch for Alphanumeric K-Stock Tickers...");

    for (const t of tickers) {
        try {
            console.log(`\nFetching ${t}...`);
            const q = await yahooFinance.quote(t);
            console.log(`SUCCESS ${t}:`, q.regularMarketPrice);
        } catch (e) {
            console.log(`FAILED ${t}:`, e.message);

            // Try with suffix manually
            try {
                console.log(`  Retry ${t}.KS...`);
                const q2 = await yahooFinance.quote(t + '.KS');
                console.log(`  SUCCESS ${t}.KS:`, q2.regularMarketPrice);
            } catch (e2) {
                console.log(`  FAILED ${t}.KS:`, e2.message);
            }
        }
    }
}

testFetch();
