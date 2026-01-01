// Simple in-memory cache for Yahoo Finance prices
// This prevents rate limiting by caching results for 10 minutes

const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function getCachedPrice(ticker) {
    const cached = cache.get(ticker);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > CACHE_DURATION) {
        cache.delete(ticker);
        return null;
    }

    return cached.data;
}

export function setCachedPrice(ticker, data) {
    cache.set(ticker, {
        data,
        timestamp: Date.now()
    });
}

export function clearCache() {
    cache.clear();
}
