'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SummaryCards from '@/components/Dashboard/SummaryCards';
import AllocationChart from '@/components/Dashboard/AllocationChart';
import MarketIndices from '@/components/Dashboard/MarketIndices';
import TradeForm from '@/components/Trade/TradeForm';
import TradeList from '@/components/Trade/TradeList';
import { calculatePortfolioStats } from '@/lib/portfolioUtils';

export default function Home() {
    const [trades, setTrades] = useState([]);
    const [prices, setPrices] = useState([]);
    const [stats, setStats] = useState({ totalValue: 0, totalInvested: 0, netProfit: 0, roi: 0, assets: [] });
    const [loading, setLoading] = useState(true);

    // 1. Fetch Trades
    const fetchTrades = async () => {
        try {
            const res = await fetch('/api/trades');
            const data = await res.json();
            setTrades(data);
        } catch (error) {
            console.error('Failed to fetch trades', error);
        }
    };

    useEffect(() => {
        fetchTrades();
    }, []);

    const [exchangeRate, setExchangeRate] = useState(null);

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

    // 3. Calculate Stats
    useEffect(() => {
        if (!loading) {
            const computedStats = calculatePortfolioStats(trades, prices, exchangeRate);
            setStats(computedStats);
        }
    }, [trades, prices, loading]);

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
        await fetchTrades();
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>My Portfolio</h1>
                    <p>Investment Dashboard & Journal</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link href="/rebalancing" className="btn btn-outline">
                        ⚖️ 리밸런싱
                    </Link>
                    <div className="text-sm text-muted">
                        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Row 1: Summary & Chart */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    <SummaryCards stats={stats} />
                    <AllocationChart assets={stats.assets} />
                </div>

                {/* Row 2: Market Indices */}
                <MarketIndices />

                {/* Row 3: Trade Form */}
                <TradeForm onTradeAdded={handleTradeAdded} />

                {/* Row 4: Trade List */}
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
