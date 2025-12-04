import { fetchPortfolioNews } from './src/lib/journal/newsFetcher.js';
import { analyzeNews } from './src/lib/journal/llmAnalyzer.js';

async function test() {
    try {
        console.log('Testing fetchPortfolioNews...');
        const tickers = ['GOOGL', 'TSLA'];
        const news = await fetchPortfolioNews(tickers);
        console.log('News fetched:', news);

        if (news && news.length > 0) {
            console.log('Testing analyzeNews...');
            const analysis = await analyzeNews(news, { tickerCount: tickers.length });
            console.log('Analysis:', analysis);
        }
    } catch (error) {
        console.error('Test Error:', error);
    }
}

test();
