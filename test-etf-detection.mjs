import yahooFinance from 'yahoo-finance2';
const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

const tickers = [
    '017670.KS', // SKTelecom
    '0047A0.KS', // TIGER CHINA TECH TOP10
    '0093D0.KS', // KoAct Palantir
    '411060.KS', // ACE KRX Physical Gold
    '434730.KS', // HANARO Nuclear Power
    '449450.KS', // PLUS K-Defense Industry
    '487240.KS', // KODEX AI
    '494670.KS', // TIGER Shipbuilding
    '0019K0.KS', // TIMEFOLIO
    '433500.KS', // ACE Nuclear
];

async function checkQuoteType() {
    try {
        const results = await Promise.all(
            tickers.map(async (ticker) => {
                try {
                    const quote = await yf.quote(ticker);
                    console.log(`[${ticker}] Type: '${quote.quoteType}' | ShortName: '${quote.shortName}'`);
                } catch (e) {
                    console.log(`[${ticker}] Error: ${e.message}`);
                }
            })
        );
    } catch (e) {
        console.error(e);
    }
}

checkQuoteType();
