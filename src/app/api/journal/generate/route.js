import yahooFinance from 'yahoo-finance2';
const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    // Optional: User's top holdings to fetch specific news for
    const holdings = searchParams.get('holdings')?.split(',') || [];

    try {
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

        // 2. Fetch News (General Market + Holdings)
        // We'll search for "Stock Market" and specific holdings
        const newsQueries = ['Stock Market', 'Crypto', ...holdings.slice(0, 3)]; // Limit to top 3 holdings to save time
        const newsResults = await Promise.all(
            newsQueries.map(async (query) => {
                try {
                    const result = await yf.search(query, { newsCount: 3 });
                    return { query, news: result.news };
                } catch (e) {
                    return { query, news: [] };
                }
            })
        );

        // 3. Generate Markdown Draft
        const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

        let markdown = `# 📊 ${today} 투자 일지\n\n`;

        markdown += `## 🌍 시장 개요\n`;
        marketData.forEach(item => {
            if (item.error) return;
            const icon = item.changePercent > 0 ? '🟢' : (item.changePercent < 0 ? '🔴' : '⚪');
            markdown += `- **${item.name}**: ${item.price?.toLocaleString()} (${icon} ${item.changePercent?.toFixed(2)}%)\n`;
        });

        markdown += `\n## 📰 주요 뉴스\n`;
        newsResults.forEach(item => {
            if (item.news && item.news.length > 0) {
                markdown += `### ${item.query}\n`;
                item.news.forEach(news => {
                    markdown += `- [${news.title}](${news.link})\n`;
                });
                markdown += `\n`;
            }
        });

        markdown += `## 💭 오늘의 성찰\n`;
        markdown += `- (여기에 오늘의 매매 원칙을 지켰는지, 감정 상태는 어떠했는지 기록하세요)\n`;

        return Response.json({ markdown });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to generate journal', details: error.message }, { status: 500 });
    }
}
