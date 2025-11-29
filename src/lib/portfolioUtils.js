export function calculatePortfolioStats(trades, currentPrices, exchangeRate = 1) {
    // Group by ticker
    const holdings = {};

    trades.forEach(trade => {
        const { ticker, type, price, quantity, assetClass, account = 'General' } = trade;
        const qty = parseFloat(quantity);
        const cost = parseFloat(price);
        const key = `${ticker}-${account}`;

        if (!holdings[key]) {
            holdings[key] = {
                ticker,
                account,
                name: trade.name || ticker, // Preserve name
                assetClass,
                quantity: 0,
                totalCost: 0,
                avgPrice: 0,
            };
        }

        if (type === 'Buy') {
            holdings[key].quantity += qty;
            holdings[key].totalCost += qty * cost;
        } else if (type === 'Sell') {
            holdings[key].quantity -= qty;
            holdings[key].totalCost -= qty * holdings[key].avgPrice;
        }

        // Recalculate Avg Price
        if (holdings[key].quantity > 0) {
            holdings[key].avgPrice = holdings[key].totalCost / holdings[key].quantity;
        } else {
            holdings[key].totalCost = 0;
            holdings[key].avgPrice = 0;
        }
    });

    // Calculate Totals with Current Prices
    let totalInvested = 0;
    let totalValue = 0;
    const assets = [];

    // Group stats by asset class
    const byAssetClass = {
        'Domestic Stock': { invested: 0, value: 0 },
        'US Stock': { invested: 0, value: 0 },
        'Crypto': { invested: 0, value: 0 }
    };

    Object.values(holdings).forEach(holding => {
        if (holding.quantity <= 0.000001) return; // Ignore sold out positions

        const currentPriceObj = currentPrices.find(p => p.ticker === holding.ticker);
        const currentPrice = currentPriceObj ? currentPriceObj.price : holding.avgPrice;

        let currentValue = holding.quantity * currentPrice;
        let investedValue = holding.totalCost;

        // Apply Exchange Rate for US Stocks and Crypto
        if (['US Stock', 'Crypto'].includes(holding.assetClass) && exchangeRate) {
            currentValue *= exchangeRate;
            investedValue *= exchangeRate; // Convert cost basis to KRW for consistent ROI calculation in KRW
        }

        totalInvested += investedValue;
        totalValue += currentValue;

        // Aggregate by Asset Class
        if (byAssetClass[holding.assetClass]) {
            byAssetClass[holding.assetClass].invested += investedValue;
            byAssetClass[holding.assetClass].value += currentValue;
        }

        assets.push({
            ...holding,
            currentPrice,
            currentValue, // Now in KRW for US stocks
            investedValue, // Now in KRW for US stocks
            roi: ((currentValue - investedValue) / investedValue) * 100,
            profit: currentValue - investedValue,
            quoteType: currentPriceObj ? currentPriceObj.quoteType : undefined,
        });
    });

    return {
        totalInvested,
        totalValue,
        netProfit: totalValue - totalInvested,
        roi: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
        assets,
        byAssetClass // Return grouped stats
    };
}
