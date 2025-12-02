
import { calculatePortfolioStats } from './src/lib/portfolioUtils.js';

const trades = [
    { ticker: '005930', type: 'Buy', price: 50000, quantity: 10, assetClass: 'Domestic Stock', account: 'General' },
    { ticker: '000660', type: 'Buy', price: 100000, quantity: 5, assetClass: 'Domestic Stock', account: 'Pension' },
    { ticker: '373220', type: 'Buy', price: 10000, quantity: 20, assetClass: 'Domestic Stock', account: 'IRP' },
    { ticker: 'AAPL', type: 'Buy', price: 150, quantity: 1, assetClass: 'US Stock', account: 'General' }
];

const prices = [
    { ticker: '005930', price: 60000 },
    { ticker: '000660', price: 110000 },
    { ticker: '373220', price: 12000 },
    { ticker: 'AAPL', price: 160 }
];

const stats = calculatePortfolioStats(trades, prices, 1400);

console.log('--- Account Breakdown ---');
console.log(JSON.stringify(stats.byAccount, null, 2));

console.log('\n--- Asset Class Breakdown ---');
console.log(JSON.stringify(stats.byAssetClass, null, 2));
