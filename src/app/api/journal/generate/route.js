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

        // 2. Generate Markdown Draft
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

        // Add Trade Log
        markdown += `## 📝 오늘의 매매 기록\n`;
        if (trades && trades.length > 0) {
            const todayTrades = trades.filter(t => t.date === todayISO);
            if (todayTrades.length > 0) {
                todayTrades.forEach(t => {
                    const typeIcon = t.type === 'buy' ? '🔴 매수' : '🔵 매도';
                    markdown += `- **${typeIcon}**: ${t.name || t.ticker} ${t.quantity}주 (@ ${Number(t.price).toLocaleString()}원)\n`;
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
