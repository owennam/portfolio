import yahooFinance from 'yahoo-finance2';
const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

const tickers = ['005930.KS', '069500.KS', '371460.KS']; // Samsung, KODEX 200, TIGER ...

async function checkQuoteType() {
    try {
        const results = await Promise.all(
            tickers.map(async (ticker) => {
                const quote = await yf.quote(ticker);
                console.log(`${ticker}: ${quote.quoteType} (${quote.shortName})`);
            })
        );
    } catch (e) {
        console.error(e);
    }
}

checkQuoteType();
