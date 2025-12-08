'use client';
import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

export default function MarketIndices() {
    const [indices, setIndices] = useState([]);
    const [macroData, setMacroData] = useState(null);
    const [loading, setLoading] = useState(true);

    const tickers = [
        { symbol: '^GSPC', name: 'S&P 500' },
        { symbol: '^IXIC', name: 'Nasdaq' },
        { symbol: '^RUT', name: 'Russell 2000' },
        { symbol: '^TNX', name: '10Y Treasury' },
        { symbol: 'DX-Y.NYB', name: 'US Dollar Index' },
        { symbol: '^KS11', name: 'KOSPI' },
        { symbol: '^KQ11', name: 'KOSDAQ' },
        { symbol: 'KRW=X', name: 'USD/KRW' },
        { symbol: '^VIX', name: 'VIX' },
        { symbol: 'GC=F', name: 'Gold' },
        { symbol: 'SI=F', name: 'Silver' },
        { symbol: 'CL=F', name: 'Oil' },
        { symbol: 'BTC-USD', name: 'Bitcoin' },
        { symbol: 'ETH-USD', name: 'Ethereum' },
    ];

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const symbols = tickers.map(t => t.symbol).join(',');

                const [pricesRes, macroRes] = await Promise.all([
                    fetch(`/api/prices?tickers=${symbols}`),
                    fetch('/api/macro')
                ]);

                const data = await pricesRes.json();
                const macro = await macroRes.json();

                setMacroData(macro);

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
        const interval = setInterval(fetchIndices, 600000); // Refresh every 10 minutes
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Market Indexes</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                        href="https://fred.stlouisfed.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        <ExternalLink size={14} style={{ marginRight: '4px' }} /> FRED
                    </a>
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
                    <>
                        {/* Macro Indicators */}
                        {macroData && (
                            <>
                                <a
                                    href="https://fred.stlouisfed.org/series/RRPONTSYD"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{ padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem', height: '100%', transition: 'transform 0.2s' }} className="hover-card">
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Liquidity (RRP) <ExternalLink size={10} />
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {macroData.rrp ? `$${macroData.rrp.value.toFixed(2)}B` : '-'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {macroData.rrp ? macroData.rrp.date : ''}
                                        </div>
                                    </div>
                                </a>

                                <a
                                    href="https://fred.stlouisfed.org/series/WRESBAL"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{ padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem', height: '100%', transition: 'transform 0.2s' }} className="hover-card">
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Bank Reserves <ExternalLink size={10} />
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {macroData.reserves ? `$${(macroData.reserves.value / 1000).toFixed(2)}T` : '-'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {macroData.reserves ? macroData.reserves.date : ''}
                                        </div>
                                    </div>
                                </a>

                                <a
                                    href="https://fred.stlouisfed.org/series/SOFR"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{ padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem', height: '100%', transition: 'transform 0.2s' }} className="hover-card">
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Funding Spread <ExternalLink size={10} />
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: macroData.spread?.value > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                            {macroData.spread ? `${(macroData.spread.value * 100).toFixed(0)} bps` : '-'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            SOFR - IORB
                                        </div>
                                    </div>
                                </a>
                            </>
                        )}

                        {/* Market Indices */}
                        {indices.map(idx => (
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
                        ))}
                    </>
                )}
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.6; }
                }
                .hover-card:hover {
                    transform: translateY(-2px);
                    background: var(--surface) !important;
                    border: 1px solid var(--primary);
                }
            `}</style>
        </div>
    );
}
