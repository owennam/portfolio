
import { appendTradeToSheet } from './src/lib/googleSheets.js';

const testTrade = {
    date: new Date().toISOString().split('T')[0],
    type: 'Buy',
    assetClass: 'Test Asset',
    ticker: 'TEST-FEE',
    name: 'Test Fee Strategy',
    price: 100,
    quantity: 1,
    amount: 100,
    currency: 'USD',
    exchangeRate: 1400,
    fee: 5.5,
    strategy: 'Test Strategy',
    reason: 'Testing fee and strategy fields'
};

console.log('Attempting to append test trade with fee and strategy...');
appendTradeToSheet(testTrade)
    .then(() => console.log('Test script finished.'))
    .catch(err => console.error('Test script failed:', err));
