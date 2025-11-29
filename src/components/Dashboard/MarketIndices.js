'use client';
import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

export default function MarketIndices() {
    const [indices, setIndices] = useState([]);
    const [loading, setLoading] = useState(true);

    const tickers = [
        { symbol: '^GSPC', name: 'S&P 500' },
        { symbol: '^IXIC', name: 'Nasdaq' },
        { symbol: '^KS11', name: 'KOSPI' },
        { symbol: '^KQ11', name: 'KOSDAQ' },
        { symbol: 'KRW=X', name: 'USD/KRW' },
        { symbol: '^VIX', name: 'VIX' },
        { symbol: 'GC=F', name: 'Gold' },
        { symbol: 'CL=F', name: 'Oil' },
        { symbol: 'BTC-USD', name: 'Bitcoin' },
        { symbol: 'ETH-USD', name: 'Ethereum' },
    ];

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const symbols = tickers.map(t => t.symbol).join(',');
                const res = await fetch(`/api/prices?tickers=${symbols}`);
                const data = await res.json();

                // Map results back to our list to preserve order and custom names
                const mappedData = tickers.map(t => {
                    const found = data.find(d => d.ticker === t.symbol);
                    return {
                        ...t,
                        price: found ? found.price : null,
                        changePercent: found ? found.changePercent : null,
                    };
                });
                setIndices(mappedData);
            } catch (error) {
                console.error('Failed to fetch indices', error);
            } finally {
                setLoading(false);
            }
        };

        fetchIndices();
        const interval = setInterval(fetchIndices, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Market Indexes</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                        href="https://www.google.com/finance"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        <ExternalLink size={14} style={{ marginRight: '4px' }} /> Google Finance
                    </a>
                    <a
                        href="https://coinmarketcap.com/ko/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        <ExternalLink size={14} style={{ marginRight: '4px' }} /> CoinMarketCap
                    </a>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '1rem'
            }}>
                {loading ? (
                    Array(10).fill(0).map((_, i) => (
                        <div key={i} style={{ height: '70px', background: 'var(--surface-hover)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
                    ))
                ) : (
                    indices.map(idx => (
                        <div key={idx.symbol} style={{
                            padding: '0.75rem',
                            background: 'var(--surface-hover)',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{idx.name}</div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {idx.price ? idx.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: idx.changePercent > 0 ? 'var(--success)' : (idx.changePercent < 0 ? 'var(--danger)' : 'var(--text-muted)')
                            }}>
                                {idx.changePercent ? `${idx.changePercent > 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%` : '-'}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
