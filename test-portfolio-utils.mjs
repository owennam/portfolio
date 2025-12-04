import { calculatePortfolioStats } from './src/lib/portfolioUtils.js';

const trades = [
    { ticker: '005930.ks', type: 'Buy', price: 50000, quantity: 10, assetClass: 'Domestic Stock' }
];

const prices = [
    { ticker: '005930.KS', price: 60000, quoteType: 'EQUITY' }
];

const stats = calculatePortfolioStats(trades, prices);
const asset = stats.assets[0];

console.log('Ticker:', asset.ticker);
console.log('Avg Price:', asset.avgPrice);
console.log('Current Price:', asset.currentPrice);

if (asset.currentPrice === 60000) {
    console.log('SUCCESS: Current price updated correctly despite case mismatch.');
} else {
    console.log('FAILURE: Current price did not update.');
}
