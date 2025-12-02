
const trades = [
    { id: '1', date: '2024-01-01', type: 'Buy', ticker: 'AAPL', price: 100, quantity: 10 },
    { id: '2', date: '2024-02-01', type: 'Buy', ticker: 'AAPL', price: 200, quantity: 10 }, // Avg Price: (1000 + 2000) / 20 = 150
    { id: '3', date: '2024-03-01', type: 'Sell', ticker: 'AAPL', price: 300, quantity: 5 }   // Profit: (300 - 150) * 5 = 750
];

const targetTrade = trades[2];

const relevantTrades = trades
    .filter(h => h.ticker === targetTrade.ticker)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

let avgPrice = 0;
let holdingQty = 0;

console.log('Calculating profit for trade:', targetTrade);

for (const trade of relevantTrades) {
    const qty = parseFloat(trade.quantity);
    const price = parseFloat(trade.price);

    if (trade.id === targetTrade.id) {
        const profit = (price - avgPrice) * qty;
        const roi = avgPrice > 0 ? (profit / (avgPrice * qty)) * 100 : 0;
        console.log(`Sell at ${price}, Avg Buy Price: ${avgPrice}`);
        console.log(`Profit: ${profit}, ROI: ${roi}%`);
        break;
    }

    if (trade.type === 'Buy') {
        const totalCost = (avgPrice * holdingQty) + (price * qty);
        holdingQty += qty;
        avgPrice = totalCost / holdingQty;
        console.log(`Buy at ${price}, New Avg Price: ${avgPrice}`);
    } else if (trade.type === 'Sell') {
        holdingQty -= qty;
    }
}
