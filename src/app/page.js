
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SummaryCards from '@/components/Dashboard/SummaryCards';
import AllocationChart from '@/components/Dashboard/AllocationChart';
import HistoryChart from '@/components/Dashboard/HistoryChart';
import PerformanceStats from '@/components/Dashboard/PerformanceStats';
import JournalSection from '@/components/Dashboard/JournalSection';
import MarketIndices from '@/components/Dashboard/MarketIndices';
import TradeForm from '@/components/Trade/TradeForm';
import TradeList from '@/components/Trade/TradeList';
import { calculatePortfolioStats } from '@/lib/portfolioUtils';

function ValueAlerts() {
    const [alerts, setAlerts] = useState({ overheated: [], undervalued: [], neutral: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/value-alerts')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setAlerts(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    if (loading) return null;
    if (alerts.overheated.length === 0 && alerts.undervalued.length === 0 && alerts.neutral.length === 0 && alerts.pending.length === 0) return null;

    return (
        <div className="card">
            <h3>⚠️ Value Alerts</h3>
            <div className="grid-2" style={{ gap: '1.5rem' }}>
                {alerts.overheated.length > 0 && (
                    <div>
                        <h4 className="text-danger" style={{ marginBottom: '0.5rem' }}>🔴 Overheated</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {alerts.overheated.map(item => (
                                <Link key={item.ticker} href={`/analysis/${item.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-card">
                                        <div>
                                            <b>{item.name || item.ticker}</b>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ticker} • Margin: {item.marginOfSafety}%</div>
                                        </div>
                                        <div className="badge" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.8rem' }}>{item.recommendation}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {alerts.undervalued.length > 0 && (
                    <div>
                        <h4 className="text-success" style={{ marginBottom: '0.5rem' }}>🟢 Undervalued</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {alerts.undervalued.map(item => (
                                <Link key={item.ticker} href={`/analysis/${item.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-card">
                                        <div>
                                            <b>{item.name || item.ticker}</b>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ticker} • Margin: +{item.marginOfSafety}%</div>
                                        </div>
                                        <div className="badge" style={{ background: 'var(--success)', color: 'white', fontSize: '0.8rem' }}>{item.recommendation}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {alerts.neutral.length > 0 && (
                    <div>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--warning)' }}>🟡 Fair Value / Hold</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {alerts.neutral.map(item => (
                                <Link key={item.ticker} href={`/analysis/${item.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-card">
                                        <div>
                                            <b>{item.name || item.ticker}</b>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ticker} • Margin: {item.marginOfSafety > 0 ? '+' : ''}{item.marginOfSafety}%</div>
                                        </div>
                                        <div className="badge" style={{ background: 'var(--warning)', color: 'white', fontSize: '0.8rem' }}>{item.recommendation}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {alerts.pending && alerts.pending.length > 0 && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>⏳ Pending Analysis</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                            {alerts.pending.map(item => (
                                <Link key={item.ticker} href={`/analysis/${item.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-card">
                                        <div>
                                            <b>{item.name || item.ticker}</b>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ticker}</div>
                                        </div>
                                        <div className="badge" style={{ background: 'var(--text-muted)', color: 'white', fontSize: '0.8rem' }}>ANALYZE</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Home() {
    const [trades, setTrades] = useState([]);
    const [prices, setPrices] = useState([]);
    const [stats, setStats] = useState({ totalValue: 0, totalInvested: 0, netProfit: 0, roi: 0, assets: [] });
    const [history, setHistory] = useState([]);
    const [manualAssets, setManualAssets] = useState([]);
    const [liabilities, setLiabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exchangeRate, setExchangeRate] = useState(null);

    // 1. Fetch Trades, History, Assets, Liabilities
    const fetchAllData = async () => {
        try {
            const [resTrades, resHistory, resAssets, resLiabilities] = await Promise.all([
                fetch('/api/trades'),
                fetch('/api/history'),
                fetch('/api/assets'),
                fetch('/api/liabilities')
            ]);

            setTrades(await resTrades.json());
            setHistory(await resHistory.json());
            setManualAssets(await resAssets.json());
            setLiabilities(await resLiabilities.json());
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // 2. Fetch Prices when trades change
    useEffect(() => {
        const fetchPrices = async () => {
            if (trades.length === 0) {
                setLoading(false);
                return;
            }

            const tickers = [...new Set(trades.map(t => t.ticker))];
            // Always fetch exchange rate
            const allTickers = [...tickers, 'KRW=X'];

            try {
                const res = await fetch(`/api/prices?tickers=${allTickers.join(',')}`);
                const data = await res.json();
                setPrices(data);

                const rate = data.find(p => p.ticker === 'KRW=X');
                if (rate) setExchangeRate(rate.price);
            } catch (error) {
                console.error('Failed to fetch prices', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, [trades]);

    // 3. Calculate Stats & Auto-Save History
    useEffect(() => {
        if (!loading && prices.length > 0) {
            const computedStats = calculatePortfolioStats(trades, prices, exchangeRate);
            setStats(computedStats);

            // Calculate Net Worth for logging
            const manualAssetsValue = manualAssets.reduce((sum, item) => sum + parseFloat(item.value), 0);
            const liabilitiesValue = liabilities.reduce((sum, item) => sum + parseFloat(item.amount), 0);
            const totalAssets = computedStats.totalValue + manualAssetsValue;
            const netWorth = totalAssets - liabilitiesValue;

            // Auto-save history if totalValue > 0
            if (computedStats.totalValue > 0) {
                const today = new Date().toLocaleDateString('en-CA');

                fetch('/api/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: today,
                        totalValue: computedStats.totalValue,
                        investedAmount: computedStats.totalInvested,
                        netWorth: netWorth,
                        totalAssets: totalAssets,
                        liabilities: liabilitiesValue
                    })
                }).then(res => res.json())
                    .then(data => {
                        if (data.history) setHistory(data.history);
                    })
                    .catch(err => console.error('Failed to auto-save history', err));
            }
        }
    }, [trades, prices, loading, exchangeRate, manualAssets, liabilities]);

    const handleTradeAdded = (newTrade) => {
        setTrades(prev => [...prev, newTrade]);
    };

    const handleTradeDeleted = async (tradeId) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/trades?id=${tradeId}`, { method: 'DELETE' });
            if (res.ok) {
                setTrades(prev => prev.filter(t => t.id !== tradeId));
            } else {
                alert('삭제 실패');
            }
        } catch (error) {
            console.error('Failed to delete trade', error);
            alert('삭제 중 오류 발생');
        }
    };

    const handleTradeUpdated = async () => {
        await fetchAllData();
    };

    // Calculate Net Worth
    const realEstateValue = manualAssets.filter(a => a.category === 'Real Estate').reduce((sum, item) => sum + parseFloat(item.value), 0);
    const cashValue = manualAssets.filter(a => a.category !== 'Real Estate').reduce((sum, item) => sum + parseFloat(item.value), 0);
    const manualAssetsValue = realEstateValue + cashValue;

    const liabilitiesValue = liabilities.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const totalAssets = stats.totalValue + manualAssetsValue;
    const netWorth = totalAssets - liabilitiesValue;
    const leverageRatio = totalAssets > 0 ? (liabilitiesValue / totalAssets) * 100 : 0;

    const formatCurrency = (val) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>My Portfolio</h1>
                    <p>Investment Dashboard & Journal</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link href="/networth" className="btn btn-outline" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                        💰 자산/부채 관리
                    </Link>
                    <Link href="/journal" className="btn btn-outline">
                        📚 일지 보관함
                    </Link>
                    <Link href="/rebalancing" className="btn btn-outline">
                        ⚖️ 리밸런싱
                    </Link>
                    <div className="text-sm text-muted">
                        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Net Worth Summary Card */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>💎 순자산 (Net Worth)</h2>
                        <span className="text-xl font-bold text-success">{formatCurrency(netWorth)}</span>
                    </div>
                    <div className="grid-5" style={{ gap: '1rem' }}>
                        <div>
                            <div className="text-sm text-muted">총 자산</div>
                            <div className="font-bold">{formatCurrency(totalAssets)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">투자 자산</div>
                            <div className="font-bold">{formatCurrency(stats.totalValue)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">부동산</div>
                            <div className="font-bold">{formatCurrency(realEstateValue)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">현금/기타</div>
                            <div className="font-bold">{formatCurrency(cashValue)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">총 부채 (레버리지 {leverageRatio.toFixed(2)}%)</div>
                            <div className="font-bold text-danger">{formatCurrency(liabilitiesValue)}</div>
                        </div>
                    </div>
                </div>

                {/* Value Alerts Section */}
                <ValueAlerts />

                {/* Row 1: Summary & Chart */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    <SummaryCards stats={stats} />
                    <AllocationChart assets={stats.assets} />
                </div>

                <HistoryChart history={history} />
                <PerformanceStats history={history} />

                {/* Row 2: Journal Section */}
                <JournalSection stats={stats} trades={trades} history={history} />

                {/* Row 3: Market Indices */}
                <MarketIndices />

                {/* Row 4: Trade Form */}
                <TradeForm onTradeAdded={handleTradeAdded} />

                {/* Row 5: Trade List */}
                <TradeList
                    trades={trades}
                    prices={prices}
                    exchangeRate={exchangeRate}
                    onTradeDeleted={handleTradeDeleted}
                    onTradeUpdated={handleTradeUpdated}
                />
            </div>
        </div>
    );
}
