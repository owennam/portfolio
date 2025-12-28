'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TradeForm from '@/components/Trade/TradeForm';
import TradeList from '@/components/Trade/TradeList';
import AllocationChart from '@/components/Dashboard/AllocationChart';
import SummaryCards from '@/components/Dashboard/SummaryCards';
import { calculatePortfolioStats } from '@/lib/portfolioUtils';

export default function PortfolioPage() {
    const [trades, setTrades] = useState([]);
    const [prices, setPrices] = useState([]);
    const [stats, setStats] = useState({ totalValue: 0, totalInvested: 0, netProfit: 0, roi: 0, assets: [] });
    const [exchangeRate, setExchangeRate] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTrades = async () => {
        try {
            const res = await fetch('/api/trades');
            setTrades(await res.json());
        } catch (error) {
            console.error('Failed to fetch trades', error);
        }
    };

    useEffect(() => {
        fetchTrades();
    }, []);

    useEffect(() => {
        const fetchPrices = async () => {
            if (trades.length === 0) {
                setLoading(false);
                return;
            }

            const tickers = [...new Set(trades.map(t => t.ticker))];
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

    useEffect(() => {
        if (!loading && prices.length > 0) {
            const computedStats = calculatePortfolioStats(trades, prices, exchangeRate);
            setStats(computedStats);
        }
    }, [trades, prices, loading, exchangeRate]);

    const handleTradeAdded = (newTrade) => {
        setTrades(prev => [...prev, newTrade]);
    };

    const handleTradeDeleted = async (tradeId) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/trades?id=${tradeId}`, { method: 'DELETE' });
            if (res.ok) setTrades(prev => prev.filter(t => t.id !== tradeId));
        } catch (error) {
            console.error('Failed to delete trade', error);
        }
    };

    const handleTradeUpdated = async () => {
        await fetchTrades();
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>포트폴리오 관리</h1>
                <Link href="/" className="btn btn-outline">
                    메인으로
                </Link>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <SummaryCards stats={stats} />
                <AllocationChart assets={stats.assets} />
                <TradeForm onTradeAdded={handleTradeAdded} />
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
