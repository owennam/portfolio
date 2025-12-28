import yahooFinance from 'yahoo-finance2';
import { generateGrokResponse } from '@/lib/grok';
const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function POST(request) {
    try {
        const { holdings, stats, globalStats, trades, history } = await request.json();

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

        // 3. Generate Content using Grok AI
        const today = new Date();
        const todayStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        const todayISO = today.toISOString().split('T')[0];

        // Prepare Context for AI
        let context = `Date: ${todayStr}\n\n`;

        // Portfolio Stats
        if (stats) {
            context += `[Portfolio Status]\n`;

            // Prefer globalStats (Net Worth) if available, otherwise Investment Value
            const currentTotal = globalStats ? globalStats.totalAssets : stats.totalValue;
            const label = globalStats ? "Total Assets (Net Worth)" : "Investment Assets";

            context += `- ${label}: ${Math.round(currentTotal).toLocaleString()} KRW\n`;
            context += `- Investment Profit: ${Math.round(stats.netProfit).toLocaleString()} KRW (${stats.roi.toFixed(2)}%)\n`;

            // Previous Day Comparison
            if (history && history.length > 0) {
                const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
                const prevEntry = sortedHistory.find(h => h.date < todayISO);
                if (prevEntry) {
                    // Compare apples to apples: if we have globalStats, compare to prev totalAssets
                    const prevTotal = prevEntry.totalAssets || prevEntry.totalValue; // Fallback to totalValue if old history
                    const diff = currentTotal - prevTotal;
                    const diffPercent = prevTotal > 0 ? (diff / prevTotal) * 100 : 0;
                    context += `- Change from Yesterday: ${diff > 0 ? '+' : ''}${Math.round(diff).toLocaleString()} KRW (${diffPercent.toFixed(2)}%)\n`;
                }
            }
            context += `\n`;
        }

        // Market Data
        context += `[Market Overview]\n`;
        marketData.forEach(item => {
            if (!item.error) {
                context += `- ${item.name} (${item.ticker}): ${item.price?.toLocaleString()} (${item.changePercent?.toFixed(2)}%)\n`;
            }
        });
        if (stockFNG) context += `- Stock Fear & Greed: ${stockFNG.score} (${stockFNG.rating})\n`;
        if (cryptoFNG) context += `- Crypto Fear & Greed: ${cryptoFNG.score} (${cryptoFNG.rating})\n`;
        context += `\n`;

        // Trade Logs
        context += `[Today's Trades]\n`;
        if (trades && trades.length > 0) {
            const todayTrades = trades.filter(t => t.date === todayISO);
            if (todayTrades.length > 0) {
                todayTrades.forEach(t => {
                    context += `- ${t.type} ${t.name || t.ticker} ${t.quantity} shares @ ${t.price.toLocaleString()}\n`;
                });
            } else {
                context += "No trades today.\n";
            }
        } else {
            context += "No trades today.\n";
        }


        // Influencer List for Grok
        const INFLUENCERS = `
[Legends]
- Cathie Wood (@CathieDWood): ARK Invest, Disruptive Innovation
- Michael Saylor (@saylor): MicroStrategy, Bitcoin Maximalist
- Elon Musk (@elonmusk): Tesla/SpaceX, Market Mover
- Warren Buffett: Value Investing (Berkshire Hathaway)
- Ray Dalio (@RayDalio): Bridgewater, Macro Economics

[Market Wizards]
- Mark Minervini (@markminervini): VCP Pattern, Superperformance
- Peter Brandt (@PeterLBrandt): Classical Charting (50+ yrs exp)
- David Ryan (@dryan310): 3x US Investing Champion
- Linda Raschke (@LindaRaschke): LBR Group, Trading Systems
- Chris Camillo (@ChrisCamillo): Social Arbitrage

[2024 Champion]
- J Law (@JLawStock): 2024 US Investing Champion (354% return)

[Macro/Market Experts]
- Tom Lee (@fundstrat): Fundstrat, Bullish Calls
- Kobeissi Letter (@KobeissiLetter): Global Capital Markets, Macro Analysis

[Technical Analysis]
- Aksel Kibar (@TechCharts): Classical Tech Analysis, Crypto/Stocks
- Ryan Detrick (@RyanDetrick): Carson Group, Market Data & Seasonality

[US Politics/Policy (Trump 2.0)]
- Donald Trump (@realDonaldTrump): President-Elect (Inauguration 2025.1.20)
- Howard Lutnick: Commerce Secretary Nominee (Semiconductors/Tariffs)
- Scott Bessent: Treasury Secretary Nominee (Tax/Dollar Policy)
- David Sacks (@DavidSacks): AI & Crypto Czar

[Crypto Experts - Verified]
- Pentoshi (@Pentosh1): Macro/Crypto Trader
- CryptoCred (@CryptoCred): Technical Analysis Education
- The Crypto Dog (@TheCryptoDog): Altcoin Opportunities
- Scott Melker (@scottmelker): "The Wolf of All Streets"
- CryptoWendyO (@CryptoWendyO): Charting & Sentiment

[Crypto Experts - Degen/Personal]
- Rocket Man (@iamrocketmen)
- Chicken Boy (@RealChickenBoy9)
- NPjoa_Hodl (@NPjoa_Hodl)

[Korea Market]
- Lee Hyo-seok (@HS_academy23): Ex-SK Securities, Semis/Macro
- Hankyung (@hankyung): Korea Economic Daily
`;

        // Prompt Construction
        const systemPrompt = `You are a professional, witty, and insightful investment analyst. 
Your job is to write a daily investment journal based on the provided data.
Use the persona of a "Grok" - smart, slightly sarcastic but helpful, and very knowledgeable.
Language: Korean (Use natural, engaging Korean).

You have access to Real-time X (Twitter) data. 
Below is a list of Key Influencers ("The Watchlist"). 
**Task:** Briefly scan specifically for MAJOR updates or Consensus from these figures. 
*Do not try to fetch every single one* if it takes too long. prioritize the most relevant to the user's holdings (if any) and major market movers (Musk, Powell/Fed, Trump Team).

${INFLUENCERS}

Instructions:
1. Title: "${todayStr} 투자 일지"
2. Section 1: 포트폴리오 현황 (Analyze performance via Total Assets/Net Worth. Congratulate/Console).
3. Section 2: X Influencer Insights (Highlights)
   - Pick top 3-5 most relevant insights from The Watchlist.
   - Mention "Trump 2.0" policy impacts if relevant.
   - Group by category (e.g. "Macro", "Crypto", "Political").
4. Section 3: 시장 상황 및 심리 (Brief summary).
   - **MUST** include a small table or list of the Key Market Indices (S&P 500, NASDAQ, KOSPI, BTC, USD/KRW) with their values and changes provided in the data.
5. Section 4: 오늘의 매매 회고.
6. Style: Markdown. **NO EMOJIS AT ALL**. Professional but witty tone.
`;

        let markdown = await generateGrokResponse([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context }
        ]);

        // Fallback if Grok fails
        if (!markdown) {
            console.log("Grok failed, falling back to simple template.");
            markdown = `# ${todayStr} 투자 일지 (Auto-Generated)\n\n`;
            markdown += `**Grok AI 연결 실패로 기본 템플릿이 표시됩니다.**\n\n`;
            markdown += context.replace(/\n/g, '  \n'); // Simple dump
        }

        return Response.json({ markdown });

        return Response.json({ markdown });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to generate journal', details: error.message }, { status: 500 });
    }
}
