import { calculatePortfolioStats, normalizeTicker } from './src/lib/portfolioUtils.js';

console.log('Testing normalizeTicker...');
console.log('000660.KS ->', normalizeTicker('000660.KS'));
console.log('000660 ->', normalizeTicker('000660'));
console.log('BTC-USD ->', normalizeTicker('BTC-USD'));

const trades = [
    { ticker: '000660.KS', quantity: 10, price: 100, type: 'Buy', assetClass: 'Domestic Stock' },
    { ticker: '000660', quantity: 10, price: 100, type: 'Buy', assetClass: 'Domestic Stock' }
];
const prices = [{ ticker: '000660', price: 200 }];

const stats = calculatePortfolioStats(trades, prices);
console.log('Assets:', stats.assets.map(a => ({ ticker: a.ticker, quantity: a.quantity })));

if (stats.assets.length === 1 && stats.assets[0].quantity === 20) {
    console.log('SUCCESS: Duplicates merged.');
} else {
    console.log('FAILURE: Duplicates NOT merged.');
}
