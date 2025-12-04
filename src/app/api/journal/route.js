import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fetchPortfolioNews } from '@/lib/journal/newsFetcher';
import { analyzeNews } from '@/lib/journal/llmAnalyzer';

const TRADES_FILE = path.join(process.cwd(), 'data', 'trades.json');

export async function POST(request) {
    try {
        console.log('Journal API called');

        // 1. Get Tickers from Portfolio
        console.log('Reading trades file:', TRADES_FILE);
        if (!fs.existsSync(TRADES_FILE)) {
            console.error('Trades file not found');
            return NextResponse.json({ news: [], analysis: null });
        }

        const fileData = fs.readFileSync(TRADES_FILE, 'utf8');
        const trades = JSON.parse(fileData);

        // Extract unique tickers
        const tickers = [...new Set(trades.map(t => t.ticker))];
        console.log('Tickers found:', tickers);

        if (tickers.length === 0) {
            return NextResponse.json({ news: [], analysis: null });
        }

        // 2. Fetch News
        console.log('Fetching news...');
        const news = await fetchPortfolioNews(tickers);
        console.log('News fetched count:', news ? news.length : 'null');

        // 3. Analyze (Optional: only if requested)
        const body = await request.json();
        const analyze = body.analyze;
        let analysis = null;

        if (analyze) {
            console.log('Analyzing news...');
            analysis = await analyzeNews(news, { tickerCount: tickers.length });
            console.log('Analysis complete');
        }

        return NextResponse.json({
            success: true,
            news,
            analysis
        });

    } catch (error) {
        console.error('Journal API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
