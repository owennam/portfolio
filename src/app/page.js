'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SummaryCards from '@/components/Dashboard/SummaryCards';
import JournalSection from '@/components/Dashboard/JournalSection';
import RoastSection from '@/components/Dashboard/RoastSection';
import MarketIndices from '@/components/Dashboard/MarketIndices';
import { calculatePortfolioStats } from '@/lib/portfolioUtils';
import Login from '@/components/Auth/Login';
import { useAuth } from '@/contexts/AuthContext';

function LandingHero() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <h1 className="text-5xl font-bold mb-6" style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                background: 'linear-gradient(to right, #60a5fa, #9333ea)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                AntiGravity Portfolio
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl" style={{
                fontSize: '1.25rem',
                color: '#9ca3af',
                marginBottom: '2rem',
                maxWidth: '42rem'
            }}>
                나만의 투자 포트폴리오를 관리하고, AI 분석을 통해 더 나은 투자 결정을 내려보세요.
            </p>
            <div style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(31, 41, 55, 0.5)',
                borderRadius: '0.75rem',
                border: '1px solid #374151',
                backdropFilter: 'blur(4px)'
            }}>
                <p style={{ color: '#d1d5db', marginBottom: '1rem' }}>시작하려면 로그인이 필요합니다.</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Login />
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    const { user, loading: authLoading } = useAuth();
    // ... existing logic ...
    const [trades, setTrades] = useState([]);
    const [prices, setPrices] = useState([]);
    const [stats, setStats] = useState({ totalValue: 0, totalInvested: 0, netProfit: 0, roi: 0, assets: [] });
    const [history, setHistory] = useState([]);
    const [manualAssets, setManualAssets] = useState([]);
    const [liabilities, setLiabilities] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [exchangeRate, setExchangeRate] = useState(null);

    // ... (fetch logic remains same) ...

    // 1. Fetch All Data
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
        if (user) {
            fetchAllData();
        }
    }, [user]);

    // 2. Fetch Prices
    useEffect(() => {
        if (!user || trades.length === 0) {
            setDataLoading(false);
            return;
        }

        const fetchPrices = async () => {
            const tickers = [...new Set(trades.map(t => t.ticker))];
            const allTickers = [...tickers, 'KRW=X']; // USD/KRW

            try {
                const res = await fetch(`/api/prices?tickers=${allTickers.join(',')}`);
                const data = await res.json();
                setPrices(data);

                const rate = data.find(p => p.ticker === 'KRW=X');
                if (rate) setExchangeRate(rate.price);
            } catch (error) {
                console.error('Failed to fetch prices', error);
            } finally {
                setDataLoading(false);
            }
        };

        fetchPrices();
    }, [trades, user]);

    // 3. Calculate Stats & Auto-Save History
    useEffect(() => {
        if (user && !dataLoading && prices.length > 0) {
            const computedStats = calculatePortfolioStats(trades, prices, exchangeRate);
            setStats(computedStats);

            // Calculate Net Worth for logging
            const manualAssetsValue = manualAssets.reduce((sum, item) => sum + parseFloat(item.value), 0);
            const liabilitiesValue = liabilities.reduce((sum, item) => sum + parseFloat(item.amount), 0);
            const totalAssets = computedStats.totalValue + manualAssetsValue;
            const netWorth = totalAssets - liabilitiesValue;

            // Auto-save history (Only if user is logged in)
            if (computedStats.totalValue > 0) {
                const today = new Date().toLocaleDateString('en-CA');
                // Auto-save logic calls API which is protected, but client sends token in simpler implementation
                // For now, let's keep GET logic but ensure POST actions are token-gated by components or explicitly here.
                // Actually, the previous task added 'verifyAuth' to POST /api/history.
                // So this `fetch` call will fail without Auth header.
                // We need to attach token here if we want auto-save to work.

                user.getIdToken().then(token => {
                    fetch('/api/history', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
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
                });
            }
        }
    }, [trades, prices, dataLoading, exchangeRate, manualAssets, liabilities, user]);

    // Render Loading State
    if (authLoading) return <div className="text-center p-10">Loading...</div>;

    // Render Landing Page if not logged in
    if (!user) {
        return (
            <div className="container">
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>My Portfolio</h1>
                    </div>
                </header>
                <LandingHero />
            </div>
        );
    }

    // Net Worth Calculation for UI
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
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Login />

                    <Link href="/portfolio" className="btn btn-outline" style={{ borderColor: '#eab308', color: '#eab308' }}>
                        포트폴리오
                    </Link>
                    <Link href="/analysis" className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }}>
                        분석
                    </Link>
                    <Link href="/networth" className="btn btn-outline" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                        자산/부채
                    </Link>
                    <Link href="/journal" className="btn btn-outline" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
                        일지 기록
                    </Link>
                    <Link href="/rebalancing" className="btn btn-outline">
                        리밸런싱
                    </Link>
                    <Link href="/simulator" className="btn btn-outline" style={{ borderColor: '#f87171', color: '#f87171' }}>
                        Risk Sim
                    </Link>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 1. Net Worth Summary */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>순자산 (Net Worth)</h2>
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

                {/* 2. Key Metrics & Market Indices */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    <SummaryCards stats={stats} />
                    <MarketIndices />
                </div>

                {/* 3. Engagement (Roast & Journal) */}
                <RoastSection stats={stats} holdings={trades} />
                <JournalSection
                    stats={stats}
                    trades={trades}
                    history={history}
                    globalStats={{
                        netWorth,
                        totalAssets,
                        liabilities: liabilitiesValue
                    }}
                />
            </div>
        </div>
    );
}
