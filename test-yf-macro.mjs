import yahooFinance from 'yahoo-finance2';

const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

const yfTickers = [
    'SOFR', 'SR3=F', // SOFR related
    '^TNX', // Control
];

const fredIds = [
    'RRPONTSYD', // RRP
    'TOTRESNS', // Reserves
    'SOFR', // SOFR
    'IORB' // IORB
];

async function test() {
    console.log('--- Yahoo Finance Test ---');
    for (const ticker of yfTickers) {
        try {
            const quote = await yf.quote(ticker);
            console.log(`[SUCCESS] ${ticker}: ${quote.regularMarketPrice} (${quote.shortName})`);
        } catch (e) {
            console.log(`[FAILED] ${ticker}: ${e.message}`);
        }
    }

    console.log('\n--- FRED CSV Test ---');
    for (const id of fredIds) {
        try {
            const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                const lines = text.trim().split('\n');
                const lastLine = lines[lines.length - 1];
                console.log(`[SUCCESS] ${id}: ${lastLine}`);
            } else {
                console.log(`[FAILED] ${id}: Status ${res.status}`);
            }
        } catch (e) {
            console.log(`[FAILED] ${id}: ${e.message}`);
        }
    }
}

test();
