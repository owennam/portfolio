import { NextResponse } from 'next/server';
import { getStockSearchService } from '@/lib/stockSearchService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const useApi = searchParams.get('useApi') === 'true';

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const stockService = getStockSearchService();

    let results;
    if (useApi) {
      // 하이브리드 검색 (로컬 DB + API)
      results = await stockService.hybridSearch(query);
    } else {
      // 로컬 DB만 검색
      results = stockService.searchStocks(query);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, ticker } = body;

    if (!name || !ticker) {
      return NextResponse.json(
        { error: 'Name and ticker are required' },
        { status: 400 }
      );
    }

    const stockService = getStockSearchService();
    stockService.addStock(name, ticker);

    return NextResponse.json({ success: true, message: 'Stock added successfully' });
  } catch (error) {
    console.error('Add stock error:', error);
    return NextResponse.json(
      { error: 'Failed to add stock', details: error.message },
      { status: 500 }
    );
  }
}
