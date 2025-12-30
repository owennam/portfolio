import fs from 'fs';
import path from 'path';

const KOREAN_STOCKS_FILE = path.join(process.cwd(), 'data', 'korean-stocks.json');

/**
 * 한글 주식명으로 ticker를 검색하는 서비스
 */
export class StockSearchService {
  constructor() {
    this.koreanStocks = this.loadKoreanStocks();
  }

  loadKoreanStocks() {
    try {
      if (fs.existsSync(KOREAN_STOCKS_FILE)) {
        const data = fs.readFileSync(KOREAN_STOCKS_FILE, 'utf8');
        // Clear BOM if present to prevent JSON parse error
        const cleanData = data.replace(/^\uFEFF/, '');
        return JSON.parse(cleanData);
      }
    } catch (error) {
      console.error('Error loading Korean stocks:', error);
    }
    return {};
  }

  /**
   * 한글 주식명으로 ticker 검색 (정확한 일치)
   * @param {string} name - 한글 주식명
   * @returns {string|null} ticker 또는 null
   */
  getTickerByName(name) {
    return this.koreanStocks[name] || null;
  }

  /**
   * 한글 주식명으로 자동완성 검색 (부분 일치)
   * @param {string} query - 검색 쿼리
   * @param {number} limit - 결과 개수 제한
   * @returns {Array<{name: string, ticker: string}>}
   */
  searchStocks(query, limit = 10) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const results = [];
    const exactMatches = [];
    const startMatches = [];
    const containsMatches = [];
    const tickerMatches = []; // This array is no longer strictly needed with the new logic, but keeping it for now if the user wants to revert to the old structure.

    for (const [name, ticker] of Object.entries(this.koreanStocks)) {
      const normalizedName = name.toLowerCase();
      const normalizedTicker = ticker.toLowerCase();

      // 정확히 일치하는 경우 (이름 또는 티커)
      if (normalizedName === normalizedQuery || normalizedTicker === normalizedQuery) {
        results.unshift({ name, ticker });
      }
      // 시작하는 경우 (이름 또는 티커)
      else if (normalizedName.startsWith(normalizedQuery) || normalizedTicker.startsWith(normalizedQuery)) {
        results.push({ name, ticker });
      }
      // 포함하는 경우 (이름 또는 티커)
      else if (normalizedName.includes(normalizedQuery) || normalizedTicker.includes(normalizedQuery)) {
        results.push({ name, ticker });
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = [];
    const seenTickers = new Set();
    for (const item of results) {
      if (!seenTickers.has(item.ticker)) {
        uniqueResults.push(item);
        seenTickers.add(item.ticker);
      }
    }

    return uniqueResults.slice(0, limit);
  }

  /**
   * 새로운 한글 주식명-ticker 매핑 추가
   * @param {string} name - 한글 주식명
   * @param {string} ticker - ticker
   */
  addStock(name, ticker) {
    this.koreanStocks[name] = ticker;
    this.saveKoreanStocks();
  }

  /**
   * 여러 주식 추가
   * @param {Object} stocks - {name: ticker} 형태의 객체
   */
  addStocks(stocks) {
    this.koreanStocks = { ...this.koreanStocks, ...stocks };
    this.saveKoreanStocks();
  }

  /**
   * 로컬 DB에 저장
   */
  saveKoreanStocks() {
    try {
      fs.writeFileSync(
        KOREAN_STOCKS_FILE,
        JSON.stringify(this.koreanStocks, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving Korean stocks:', error);
    }
  }

  /**
   * Yahoo Finance API를 통한 검색 (백업용)
   * @param {string} query - 검색 쿼리
   * @returns {Promise<Array>}
   */
  async searchYahooFinance(query) {
    try {
      // Yahoo Finance 검색 쿼리에 .KS 추가하여 한국 주식 필터링
      const searchQuery = `${query} KS`;
      const response = await fetch(
        `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchQuery)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Yahoo Finance API request failed');
      }

      const data = await response.json();
      const quotes = data.quotes || [];

      // 한국 주식만 필터링 (.KS로 끝나는 것)
      const koreanQuotes = quotes
        .filter(quote => quote.symbol && quote.symbol.endsWith('.KS'))
        .map(quote => ({
          name: quote.longname || quote.shortname || quote.symbol,
          ticker: quote.symbol,
          exchange: quote.exchange
        }));

      return koreanQuotes;
    } catch (error) {
      console.error('Yahoo Finance search error:', error);
      return [];
    }
  }

  /**
   * 하이브리드 검색: 로컬 DB 우선, 없으면 Yahoo Finance API
   * @param {string} query - 검색 쿼리
   * @returns {Promise<Array>}
   */
  async hybridSearch(query) {
    // 1. 로컬 DB에서 검색
    const localResults = this.searchStocks(query);

    if (localResults.length > 0) {
      return localResults;
    }

    // 2. 로컬에 없으면 Yahoo Finance API 사용
    const apiResults = await this.searchYahooFinance(query);

    // 3. API 결과를 로컬 DB에 추가 (캐싱)
    if (apiResults.length > 0) {
      const newStocks = {};
      apiResults.forEach(result => {
        newStocks[result.name] = result.ticker;
      });
      this.addStocks(newStocks);
    }

    return apiResults;
  }
}

// 싱글톤 인스턴스
let stockSearchServiceInstance = null;

export function getStockSearchService() {
  if (!stockSearchServiceInstance) {
    stockSearchServiceInstance = new StockSearchService();
  }
  return stockSearchServiceInstance;
}
