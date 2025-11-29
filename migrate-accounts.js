const fs = require('fs');
const path = require('path');

const tradesPath = path.join(__dirname, 'data', 'trades.json');

try {
    const data = fs.readFileSync(tradesPath, 'utf8');
    const trades = JSON.parse(data);

    const updatedTrades = trades.map(trade => ({
        ...trade,
        account: trade.account || 'General' // Default to General if missing
    }));

    fs.writeFileSync(tradesPath, JSON.stringify(updatedTrades, null, 2));
    console.log(`Migrated ${updatedTrades.length} trades.`);
} catch (err) {
    console.error('Migration failed:', err);
}
