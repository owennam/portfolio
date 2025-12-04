import yahooFinance from 'yahoo-finance2';

const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

async function test() {
    try {
        const aapl = await yf.quote('AAPL');
        console.log('AAPL Currency:', aapl.currency);

        const btc = await yf.quote('BTC-USD');
        console.log('BTC-USD Currency:', btc.currency);

        const kospi = await yf.quote('005930.KS'); // Samsung Electronics
        console.log('Samsung Currency:', kospi.currency);
    } catch (e) {
        console.error(e);
    }
}

test();
