'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { calculatePortfolioStats } from '@/lib/portfolioUtils';

export default function AssetDetailClient({ type }) {
    const [trades, setTrades] = useState([]);
    const [prices, setPrices] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(null);
    const [loading, setLoading] = useState(true);

    const assetClassMap = {
        'domestic': 'Domestic Stock',
        'us': 'US Stock',
        'crypto': 'Crypto'
    };

    const targetAssetClass = assetClassMap[type];
    const titleMap = {
        'domestic': '🇰🇷 국내 주식 보유 현황',
        'us': '🇺🇸 미국 주식 보유 현황',
        'crypto': '🪙 암호화폐 보유 현황'
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tradesRes, pricesRes] = await Promise.all([
                    fetch('/api/trades'),
                    fetch('/api/prices?tickers=KRW=X') // Initial fetch for exchange rate
                ]);

                const tradesData = await tradesRes.json();
                const pricesData = await pricesRes.json();

                setTrades(tradesData);

                // Extract exchange rate
                const rateObj = pricesData.find(p => p.ticker === 'KRW=X');
                if (rateObj) setExchangeRate(rateObj.price);

                // Fetch current prices for all held tickers
                const tickers = [...new Set(tradesData.map(t => t.ticker))];
                if (tickers.length > 0) {
                    const currentPricesRes = await fetch(`/api/prices?tickers=${tickers.join(',')}`);
                    const currentPricesData = await currentPricesRes.json();
                    setPrices(currentPricesData);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="container">Loading...</div>;
    if (!targetAssetClass) return <div className="container">Invalid Asset Class</div>;

    const stats = calculatePortfolioStats(trades, prices, exchangeRate);
    const holdings = stats.assets.filter(a => a.assetClass === targetAssetClass);

    // Grouping for Domestic
    const domesticGroups = {
        'General': holdings.filter(h => h.account === 'General'),
        'Pension': holdings.filter(h => h.account === 'Pension'),
        'IRP': holdings.filter(h => h.account === 'IRP')
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/" style={{ textDecoration: 'none', fontSize: '1.5rem' }}>←</Link>
                <h1>{titleMap[type]}</h1>
            </header>

            <div className="card">
                {type === 'domestic' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* General Account */}
                        {domesticGroups['General'].length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem' }}>🏢 개별 종목 (일반 계좌)</h3>
                                <HoldingsTable holdings={domesticGroups['General']} />
                            </div>
                        )}

                        {/* Pension Account */}
                        {domesticGroups['Pension'].length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem' }}>💰 연금저축 (Pension)</h3>
                                <HoldingsTable holdings={domesticGroups['Pension']} />
                            </div>
                        )}

                        {/* IRP Account */}
                        {domesticGroups['IRP'].length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem' }}>🛡️ IRP</h3>
                                <HoldingsTable holdings={domesticGroups['IRP']} />
                            </div>
                        )}

                        {/* Fallback if no holdings match known accounts but holdings exist */}
                        {holdings.length > 0 &&
                            domesticGroups['General'].length === 0 &&
                            domesticGroups['Pension'].length === 0 &&
                            domesticGroups['IRP'].length === 0 && (
                                <HoldingsTable holdings={holdings} />
                            )}
                    </div>
                ) : (
                    <HoldingsTable holdings={holdings} />
                )}
            </div>
        </div>
    );
}

function HoldingsTable({ holdings }) {
    const formatCurrency = (val, currency = 'KRW') => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: currency === 'KRW' ? 0 : 2
        }).format(val);
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '1rem' }}>종목명</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>보유수량</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>평단가</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>현재가</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>평가금액 (KRW)</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>평가손익</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>수익률</th>
                    </tr>
                </thead>
                <tbody>
                    {holdings.map(holding => {
                        const isForeign = ['US Stock', 'Crypto'].includes(holding.assetClass);
                        const currency = isForeign ? 'USD' : 'KRW';

                        return (
                            <tr key={holding.ticker} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 'bold' }}>{holding.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{holding.ticker}</div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{holding.quantity}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {formatCurrency(holding.avgPrice, currency)}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {formatCurrency(holding.currentPrice, currency)}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                                    {formatCurrency(holding.currentValue, 'KRW')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }} className={holding.profit >= 0 ? 'text-success' : 'text-danger'}>
                                    {formatCurrency(holding.profit, 'KRW')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }} className={holding.roi >= 0 ? 'text-success' : 'text-danger'}>
                                    {holding.roi.toFixed(2)}%
                                </td>
                            </tr>
                        );
                    })}
                    {holdings.length === 0 && (
                        <tr>
                            <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                보유 중인 종목이 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
