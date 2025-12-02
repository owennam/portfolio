import yahooFinance from 'yahoo-finance2';
const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function POST(request) {
    try {
        const { holdings, stats, trades, history } = await request.json();

        // 1. Fetch Market Indices
        const indices = ['^GSPC', '^IXIC', '^KS11', 'BTC-USD', 'USD/KRW'];
        const marketData = await Promise.all(
            indices.map(async (ticker) => {
                try {
                    const quote = await yf.quote(ticker);
                    return {
                        ticker,
                        name: quote.shortName || quote.longName,
                        price: quote.regularMarketPrice,
                        changePercent: quote.regularMarketChangePercent,
                    };
                } catch (e) {
                    return { ticker, error: 'Failed' };
                }
            })
        );

        // 2. Fetch Fear & Greed Index
        const getStockFNG = async () => {
            try {
                const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                if (!res.ok) return null;
                const data = await res.json();
                return {
                    score: Math.round(data.fear_and_greed.score),
                    rating: data.fear_and_greed.rating
                };
            } catch (e) {
                return null;
            }
        };

        const getCryptoFNG = async () => {
            try {
                const res = await fetch('https://api.alternative.me/fng/');
                if (!res.ok) return null;
                const data = await res.json();
                return {
                    score: data.data[0].value,
                    rating: data.data[0].value_classification
                };
            } catch (e) {
                return null;
            }
        };

        const [stockFNG, cryptoFNG] = await Promise.all([getStockFNG(), getCryptoFNG()]);

        // 3. Generate Markdown Draft
        const today = new Date();
        const todayStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        const todayISO = today.toISOString().split('T')[0];

        let markdown = `# 📔 ${todayStr} 투자 일지\n\n`;

        if (stats) {
            const profitIcon = stats.netProfit > 0 ? '📈' : (stats.netProfit < 0 ? '📉' : '➖');

            // Calculate change from yesterday
            let changeText = '';
            if (history && history.length > 0) {
                // Sort history by date descending
                const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
                // Find latest entry before today
                const prevEntry = sortedHistory.find(h => h.date < todayISO);

                if (prevEntry) {
                    const diff = stats.totalValue - prevEntry.totalValue;
                    const diffPercent = (diff / prevEntry.totalValue) * 100;
                    const diffIcon = diff > 0 ? '🔺' : (diff < 0 ? '🔻' : '➖');
                    changeText = `\n- **전일 대비**: ${diffIcon} ${Math.abs(Math.round(diff)).toLocaleString()}원 (${diffPercent.toFixed(2)}%)`;
                }
            }

            markdown += `## 💰 내 포트폴리오 현황\n`;
            markdown += `- **총 자산**: ${Math.round(stats.totalValue).toLocaleString()}원${changeText}\n`;
            markdown += `- **순수익**: ${profitIcon} ${Math.round(stats.netProfit).toLocaleString()}원 (${stats.roi.toFixed(2)}%)\n`;
            markdown += `\n`;
        }

        // Add Market Sentiment
        if (stockFNG || cryptoFNG) {
            markdown += `## 🧠 시장 심리 (공포/탐욕 지수)\n`;
            if (stockFNG) {
                let icon = '😐';
                if (stockFNG.rating.includes('Fear')) icon = '😨';
                if (stockFNG.rating.includes('Greed')) icon = '🤑';
                markdown += `- **주식 시장**: ${stockFNG.score} (${stockFNG.rating} ${icon})\n`;
            }
            if (cryptoFNG) {
                let icon = '😐';
                if (cryptoFNG.rating.includes('Fear')) icon = '😨';
                if (cryptoFNG.rating.includes('Greed')) icon = '🤑';
                markdown += `- **암호화폐**: ${cryptoFNG.score} (${cryptoFNG.rating} ${icon})\n`;
            }
            markdown += `\n`;
        }

        // Add Trade Log
        markdown += `## 📝 오늘의 매매 기록\n`;
        if (trades && trades.length > 0) {
            const todayTrades = trades.filter(t => t.date === todayISO);

            // Fetch currencies for traded assets
            const tradedTickers = [...new Set(todayTrades.map(t => t.ticker))];
            const currencyMap = {};

            await Promise.all(tradedTickers.map(async (ticker) => {
                try {
                    const quote = await yf.quote(ticker);
                    currencyMap[ticker] = quote.currency;
                } catch (e) {
                    console.error(`Failed to fetch currency for ${ticker}`, e);
                    currencyMap[ticker] = 'KRW'; // Default to KRW on error
                }
            }));

            if (todayTrades.length > 0) {
                todayTrades.forEach(t => {
                    const typeIcon = t.type.toLowerCase() === 'buy' ? '🔴 매수' : '🔵 매도';
                    let profitText = '';
                    const currency = currencyMap[t.ticker] || 'KRW';
                    const isUSD = currency === 'USD';

                    const formatPrice = (price) => {
                        if (isUSD) return `$${Number(price).toLocaleString()}`;
                        return `${Number(price).toLocaleString()}원`;
                    };

                    if (t.type === 'Sell') {
                        // Calculate Realized Profit
                        const relevantTrades = trades
                            .filter(h => h.ticker === t.ticker)
                            .sort((a, b) => new Date(a.date) - new Date(b.date));

                        let avgPrice = 0;
                        let holdingQty = 0;
                        let found = false;

                        for (const trade of relevantTrades) {
                            const qty = parseFloat(trade.quantity);
                            const price = parseFloat(trade.price);

                            if (trade.id === t.id) {
                                const profit = (price - avgPrice) * qty;
                                const roi = avgPrice > 0 ? (profit / (avgPrice * qty)) * 100 : 0;
                                const sign = profit > 0 ? '+' : '';

                                // Profit is always calculated in the asset's currency roughly, 
                                // but for the journal we want to show it in the asset's currency context
                                // However, usually profit in portfolio is tracked in base currency (KRW).
                                // But here we are calculating from trade history which presumably has prices in original currency?
                                // Let's assume trade prices are in original currency.

                                profitText = ` (${sign}${formatPrice(Math.round(profit))}, ${roi.toFixed(2)}%)`;
                                found = true;
                                break;
                            }

                            if (trade.type === 'Buy') {
                                const totalCost = (avgPrice * holdingQty) + (price * qty);
                                holdingQty += qty;
                                avgPrice = totalCost / holdingQty;
                            } else if (trade.type === 'Sell') {
                                holdingQty -= qty;
                            }
                        }
                    }

                    markdown += `- **${typeIcon}**: ${t.name || t.ticker} ${t.quantity}주 (@ ${formatPrice(t.price)})${profitText}\n`;
                });
            } else {
                markdown += `- 오늘의 매매 내역이 없습니다.\n`;
            }
        } else {
            markdown += `- 오늘의 매매 내역이 없습니다.\n`;
        }
        markdown += `\n`;

        markdown += `## 🌍 시장 개요\n`;
        marketData.forEach(item => {
            if (item.error) return;
            const icon = item.changePercent > 0 ? '🟢' : (item.changePercent < 0 ? '🔴' : '⚪');
            markdown += `- **${item.name}**: ${item.price?.toLocaleString()} (${icon} ${item.changePercent?.toFixed(2)}%)\n`;
        });

        return Response.json({ markdown });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to generate journal', details: error.message }, { status: 500 });
    }
}
