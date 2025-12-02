
import { appendTradeToSheet } from './src/lib/googleSheets.js';

const testTrade = {
    date: new Date().toISOString().split('T')[0],
    type: 'Buy',
    assetClass: 'Test Asset',
    ticker: 'TEST-123',
    name: 'Test Trade',
    price: 100,
    quantity: 1,
    amount: 100,
    currency: 'USD',
    exchangeRate: 1400
};

console.log('Attempting to append test trade...');
appendTradeToSheet(testTrade)
    .then(() => console.log('Test script finished.'))
    .catch(err => console.error('Test script failed:', err));
