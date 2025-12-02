
const history = [
    { date: '2024-10-31', totalValue: 1000000, investedAmount: 900000 }, // Profit: 100,000
    { date: '2024-11-30', totalValue: 1200000, investedAmount: 1000000 }, // Profit: 200,000 (Change: +100,000)
    { date: '2024-12-02', totalValue: 1300000, investedAmount: 1050000 }, // Profit: 250,000 (Change: +50,000)
    { date: '2023-12-31', totalValue: 500000, investedAmount: 400000 }   // Profit: 100,000 (Last Year)
];

// Sort by date
const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

const getNetProfit = (entry) => entry.totalValue - entry.investedAmount;

const monthlyMap = {};
const yearlyMap = {};

sorted.forEach(entry => {
    const date = new Date(entry.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const yearKey = `${date.getFullYear()}`;

    monthlyMap[monthKey] = entry;
    yearlyMap[yearKey] = entry;
});

console.log('--- Monthly Stats ---');
const monthlyKeys = Object.keys(monthlyMap).sort();
monthlyKeys.forEach((key, index) => {
    const current = monthlyMap[key];
    const prevKey = monthlyKeys[index - 1];
    const prev = prevKey ? monthlyMap[prevKey] : null;

    const currentNetProfit = getNetProfit(current);
    const prevNetProfit = prev ? getNetProfit(prev) : 0;
    const profitChange = currentNetProfit - prevNetProfit;

    console.log(`${key}: Profit ${currentNetProfit}, Change ${profitChange}`);
});

console.log('\n--- Yearly Stats ---');
const yearlyKeys = Object.keys(yearlyMap).sort();
yearlyKeys.forEach((key, index) => {
    const current = yearlyMap[key];
    const prevKey = yearlyKeys[index - 1];
    const prev = prevKey ? yearlyMap[prevKey] : null;

    const currentNetProfit = getNetProfit(current);
    const prevNetProfit = prev ? getNetProfit(prev) : 0;
    const profitChange = currentNetProfit - prevNetProfit;

    console.log(`${key}: Profit ${currentNetProfit}, Change ${profitChange}`);
});
