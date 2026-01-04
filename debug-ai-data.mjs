
import yahooFinance from 'yahoo-finance2';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { calculatePortfolioStats } from './debug-portfolioUtils.mjs';

const serviceAccount = {
    projectId: 'portfolio-f6831',
    clientEmail: 'firebase-adminsdk-fbsvc@portfolio-f6831.iam.gserviceaccount.com',
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCnwxfLUu/zSobR
ferppRtzy6Q1g7Dp1KXdWkhC1OwaMTxy52KTjDKrF8wF52rAbEPXQrkodQfkXnsT
u2JxrnKmM6zqn82H0bNxRQlctoW8i5emxtURJtxik0F2ue3mwmgiXY2EQlbJJtS6
CJA31NXS11+I2yyBDZ7ffR4MaQrHbs7neViat4oJn3YOm+csKY3TSV4LgPzlpTaP
Oo9UGLKd7eP3XXlntyHQSmwqB3wTe2XsG3VDvNKTb+cldp40oBZcQQ2VdSA9EY81
5S8ETW9gYApwG5U/xPh5vtT2nF5i07R46lZ3FXpbyqnCPhcEESSMj+GrexRZHfSQ
W6d0ZH3lAgMBAAECggEACEpjJuRsoMaWVoyFOzIyYtzVuuJM8CVW5BNF3m2k1F+K
B/io3bdQOrXUmpcW5rcC/ESbH2V3NCE6Ll20jf8rwcxsd3TZxKRHnKmnfooznj98
yVxqo6wauJFj6xDhsaV6XXZnm7lmjg7J9P6e1+9/+Kk1mq8QKjmI2C0X+s+HHZdn
C7kFBLFkxjVTDbhlv7k2V0ecBI0+U1FMYj4vLFzZYOj5Yrwu+CMOzzqqDC8lKabS
4iQi4HuhQM5cmH1ivii96a6sxgDzL8i46w3r9M6jP1advp5LvzlX3x5HpJTVoXEu
eJ9Knyoh/bqWNTvxinMTOfbvQoqwu6LLkl2wOVPSmQKBgQDT+KtRiAqOrcb8636z
ZRZSpCdHQShBFBDQEPuY60/4a5S5CqlELEzA1k7YjQ2l7B1gnH/Pc/Tso7VvapXG
3/vufeLZ40nQn2IXbfwblIZr8zVSPd1P/3Zg+M2+b6iLR29IXyZWWpm01D8uUjYD
3ct7fVSYawj9JMS8HJHAOXEMWQKBgQDKm6WE1UQxg8tAmSYOt3yrU6el3W9ANeov
ed+anfpoDPkCKVgWTQwCwu+306iIh66aJsLU7nf8qpObLDUaKGXxfj609NgLSOEw
ipsKP+PH2Yuelm1FqiNjKRz5xDtwwX7yr8SnK/m724+tK3MtBlRjUiDtZ+RYWXoG
0gbWkhycbQKBgQCUoRt3Or20V7Ncar/XiD0Dy2hjNRPFtg0n55CTJARZ+w04Rnpz
e+CBooN8okL8obfjoziXPQZy20OAESteXHWpP4nOH+oFJ4y/QvZwXE945/ruZMSG
sGjQDAUvz9lNd9RW2ajnCfYW7nAyyaBoS5+/Qh0MFpkh7yMnh5zHPT/AWQKBgDM+
qt6uElFzxDTSh42xWxb6UaziFQFooZLggG3bBzrKDTE+w8jgM+l+5KLaJgZiSwcy
RpUUu8RsYGkfBU9YaHBsPfAG/Z3dERf19sDg5/vkSiwSYBD+t3SdMXb66w3Z4wH+
8v5VYRTis7RZCQiaUT3NyAZEAL1X5EVVWeVrj1EBAoGAVDCPgPqbY/8AuKdBOt/J
nxs1KInbnmB8pq3MTiKMjdk890dj51BZdINGdO4jJCS9VvpzPWhFfsEw38NFMEvN
R8K6yfIJlS/ZeiCNMkbpRDpFyTWREqWlB7onDPDvMIFRs5Bml7s7tarwXzg9912x
BcWXeSoIeLrE6ytUJVIlHjo=
-----END PRIVATE KEY-----`
};

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
    console.log("Fetching trades...");
    const tradesSnapshot = await db.collection('trades').get();
    const trades = tradesSnapshot.docs.map(doc => doc.data());
    console.log(`Fetched ${trades.length} trades.`);

    const tickers = [...new Set(trades.map(t => t.ticker))];
    console.log(`Unique tickers: ${tickers.join(', ')}`);

    console.log("Fetching prices...");
    const pricePromises = tickers.map(async (ticker) => {
        try {
            // Mimic the fallback logic from ai-data route
            try {
                const quote = await yahooFinance.quote(ticker);
                return {
                    ticker,
                    price: quote.regularMarketPrice,
                    changePercent: quote.regularMarketChangePercent,
                    quoteType: quote.quoteType
                };
            } catch (e) {
                if (/^[0-9A-Z]{6}$/.test(ticker)) {
                    try {
                        const quote = await yahooFinance.quote(ticker + '.KS');
                        return {
                            ticker,
                            price: quote.regularMarketPrice,
                            quoteType: quote.quoteType
                        };
                    } catch (e2) {
                        try {
                            const quote = await yahooFinance.quote(ticker + '.KQ');
                            return {
                                ticker,
                                price: quote.regularMarketPrice,
                                quoteType: quote.quoteType
                            };
                        } catch (e3) { return null; }
                    }
                }
                return null;
            }
        } catch (error) {
            console.error(`Error fetching ${ticker}:`, error.message);
            return null;
        }
    });

    const prices = (await Promise.all(pricePromises)).filter(p => p !== null);
    console.log(`Fetched ${prices.length} prices.`);
    prices.forEach(p => console.log(`Price for ${p.ticker}: ${p.price}`));

    console.log("Calculating stats...");
    const stats = calculatePortfolioStats(trades, prices, 1400); // Exchange rate 1400 mock

    console.log("Assets found:", stats.assets.length);
    stats.assets.forEach(a => {
        console.log(`Asset: ${a.ticker}, Qty: ${a.quantity}, Value: ${a.currentValue}`);
    });

    const holdings = stats.assets.map(a => {
        const priceObj = prices.find(p => p.ticker === a.ticker); // This is the exact faulty line if mismatch exists
        return {
            ticker: a.ticker,
            totalValue: Math.round(a.currentValue),
        };
    }).sort((a, b) => b.totalValue - a.totalValue);

    console.log("Final Holdings Response Count:", holdings.length);
}

run();
