'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { calculatePortfolioStats } from '@/lib/portfolioUtils';
import { Trash2 } from 'lucide-react';

export default function RebalancingPage() {
    const [assets, setAssets] = useState([]);
    const [targets, setTargets] = useState({});
    const [totalValue, setTotalValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(1);
    const [activeTab, setActiveTab] = useState('Overall');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tradesRes, pricesRes, targetsRes] = await Promise.all([
                    fetch('/api/trades'),
                    fetch('/api/prices?tickers=KRW=X'),
                    fetch('/api/targets')
                ]);

                const tradesData = await tradesRes.json();
                const pricesData = await pricesRes.json();
                const targetsData = await targetsRes.json();

                setTargets(targetsData);

                // Extract exchange rate
                let rate = 1;
                const rateObj = pricesData.find(p => p.ticker === 'KRW=X');
                if (rateObj) rate = rateObj.price;
                setExchangeRate(rate);

                // 1. Identify held tickers
                const heldTickers = new Set(tradesData.map(t => t.ticker));

                // 2. Identify potential simulation tickers from targets
                const potentialSimTickers = new Set();
                Object.keys(targetsData).forEach(key => {
                    let ticker = key;
                    // Attempt to parse "Ticker-Account" format
                    // We assume account is one of the known types if present at the end
                    if (key.includes('-')) {
                        const parts = key.split('-');
                        const lastPart = parts[parts.length - 1];
                        if (['General', 'Pension', 'IRP'].includes(lastPart)) {
                            ticker = parts.slice(0, -1).join('-');
                        }
                    }
                    potentialSimTickers.add(ticker);
                });

                // Combine all tickers to fetch prices
                const allTickers = [...new Set([...heldTickers, ...potentialSimTickers])];

                let currentPrices = [];
                if (allTickers.length > 0) {
                    const currentPricesRes = await fetch(`/api/prices?tickers=${allTickers.join(',')}`);
                    currentPrices = await currentPricesRes.json();
                }

                const stats = calculatePortfolioStats(tradesData, currentPrices, rate);
                setAssets(stats.assets);
                setTotalValue(stats.totalValue);

                // 3. Restore simulation assets
                // Any target key that does NOT match a held asset key is considered a simulation asset
                const heldAssetKeys = new Set(stats.assets.map(a => `${a.ticker}-${a.account}`));
                const restoredSimAssets = [];

                Object.keys(targetsData).forEach(key => {
                    if (heldAssetKeys.has(key)) return; // It's a real asset

                    // Parse key to reconstruct asset info
                    let ticker = key;
                    let account = 'General';
                    if (key.includes('-')) {
                        const parts = key.split('-');
                        const lastPart = parts[parts.length - 1];
                        if (['General', 'Pension', 'IRP'].includes(lastPart)) {
                            account = lastPart;
                            ticker = parts.slice(0, -1).join('-');
                        }
                    }

                    const priceData = currentPrices.find(p => p.ticker === ticker);
                    if (priceData) {
                        const isUS = priceData.currency === 'USD';
                        let assetClass = 'Domestic Stock';
                        if (isUS) assetClass = 'US Stock';
                        if (priceData.quoteType === 'CRYPTOCURRENCY') assetClass = 'Crypto';

                        restoredSimAssets.push({
                            ticker: priceData.ticker,
                            name: priceData.shortName || priceData.ticker,
                            account: account,
                            assetClass: assetClass,
                            quantity: 0,
                            currentPrice: priceData.price || 0,
                            currentValue: 0,
                            quoteType: priceData.quoteType,
                            currency: priceData.currency,
                            isSimulation: true
                        });
                    }
                });

                setSimulationAssets(restoredSimAssets);

            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleTargetChange = (key, value) => {
        setTargets(prev => ({
            ...prev,
            [key]: parseFloat(value)
        }));
    };

    const saveTargets = async () => {
        setSaving(true);
        try {
            await fetch('/api/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(targets)
            });
            alert('목표 비중이 저장되었습니다.');
        } catch (error) {
            console.error('Failed to save targets', error);
            alert('저장 실패');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(val);
    };

    const tabs = [
        { id: 'Overall', label: '종합 (Overall)' },
        { id: 'Pension', label: '연금저축 (Pension)' },
        { id: 'IRP', label: 'IRP' },
        { id: 'Domestic', label: '국내 개별 (Domestic)' },
        { id: 'US', label: '미국 주식 (US)' },
    ];

    const [simulationAssets, setSimulationAssets] = useState([]);
    const [newTicker, setNewTicker] = useState('');
    const [addingAsset, setAddingAsset] = useState(false);

    const handleAddAsset = async () => {
        if (!newTicker.trim()) return;
        setAddingAsset(true);
        try {
            const res = await fetch(`/api/prices?tickers=${newTicker.toUpperCase()}`);
            const data = await res.json();

            if (data && data.length > 0) {
                const priceData = data[0];
                const isUS = priceData.currency === 'USD';

                // Determine account based on active tab
                let account = 'General';
                if (activeTab === 'Pension') account = 'Pension';
                if (activeTab === 'IRP') account = 'IRP';

                // Determine asset class
                let assetClass = 'Domestic Stock';
                if (isUS) assetClass = 'US Stock';
                if (priceData.quoteType === 'CRYPTOCURRENCY') assetClass = 'Crypto';

                const newAsset = {
                    ticker: priceData.ticker,
                    name: priceData.shortName || priceData.ticker,
                    account: account,
                    assetClass: assetClass,
                    quantity: 0,
                    currentPrice: priceData.price || 0,
                    currentValue: 0,
                    quoteType: priceData.quoteType,
                    currency: priceData.currency,
                    isSimulation: true
                };

                setSimulationAssets(prev => [...prev, newAsset]);
                setNewTicker('');
            } else {
                alert('종목을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('Failed to add asset', error);
            alert('종목 추가 실패');
        } finally {
            setAddingAsset(false);
        }
    };

    const getFilteredAssets = () => {
        let combinedAssets = [...assets, ...simulationAssets];

        // Remove duplicates (if simulation asset is already in real assets, prefer real)
        // Actually, if it's in real assets, we shouldn't have added it? 
        // Or we just filter out simulation ones that match real ones.
        const realKeys = new Set(assets.map(a => `${a.ticker}-${a.account}`));
        combinedAssets = combinedAssets.filter(a => !a.isSimulation || !realKeys.has(`${a.ticker}-${a.account}`));

        switch (activeTab) {
            case 'Pension':
                return combinedAssets.filter(a => a.account === 'Pension');
            case 'IRP':
                return combinedAssets.filter(a => a.account === 'IRP');
            case 'Domestic':
                return combinedAssets.filter(a => a.account === 'General' && a.assetClass === 'Domestic Stock' && a.quoteType !== 'ETF');
            case 'US':
                return combinedAssets.filter(a => a.account === 'General' && a.assetClass === 'US Stock');
            default: // Overall
                return combinedAssets; // Overall usually doesn't show individual assets, but if we change logic...
            // Wait, Overall tab uses categorySummary, which is derived from 'assets'.
            // If we want simulation assets to appear in Overall summary, we need to include them in 'assets' or update categorySummary logic.
            // For now, let's focus on the detailed tabs.
        }
    };

    const filteredAssets = getFilteredAssets();

    // Calculate summary for Overall tab
    // We need to include simulation assets in the summary if we want them to affect category totals (though they have 0 value, so they don't affect totals yet).
    // But if we give them a target, they might imply future value. 
    // However, category summary is based on 'currentValue'. So 0 value simulation assets won't change the summary table rows, which is fine.

    const categorySummary = [
        { id: 'Domestic Stock', label: '국내 주식 (Domestic Stock)' },
        { id: 'US Stock', label: '미국 주식 (US Stock)' },
        { id: 'Crypto', label: '암호화폐 (Crypto)' }
    ].map(cat => {
        const catAssets = assets.filter(a => a.assetClass === cat.id);
        const currentValue = catAssets.reduce((sum, a) => sum + a.currentValue, 0);
        return {
            ...cat,
            currentValue
        };
    });

    const tabTotalValue = activeTab === 'Overall'
        ? totalValue
        : filteredAssets.reduce((sum, asset) => sum + asset.currentValue, 0);

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/" style={{ textDecoration: 'none', fontSize: '1.5rem' }}>←</Link>
                <h1>포트폴리오 리밸런싱</h1>
            </header>

            <div className="card">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : 'none',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <strong>{activeTab === 'Overall' ? '총 자산' : '계좌/그룹 자산'}: </strong> {formatCurrency(tabTotalValue)}
                        {activeTab !== 'Overall' && <span className="text-sm text-muted"> (전체의 {((tabTotalValue / totalValue) * 100).toFixed(1)}%)</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {activeTab !== 'Overall' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="종목 추가 (Ticker)"
                                    className="input"
                                    style={{ width: '150px', padding: '0.5rem' }}
                                    value={newTicker}
                                    onChange={(e) => setNewTicker(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddAsset()}
                                />
                                <button onClick={handleAddAsset} className="btn btn-outline" disabled={addingAsset}>
                                    {addingAsset ? '...' : '+'}
                                </button>
                            </div>
                        )}
                        <button onClick={saveTargets} className="btn btn-primary" disabled={saving}>
                            {saving ? '저장 중...' : '목표 비중 저장'}
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>{activeTab === 'Overall' ? '자산군' : '종목명'}</th>
                                {activeTab !== 'Overall' && <th style={{ padding: '1rem', minWidth: '100px' }}>계좌</th>}
                                {activeTab !== 'Overall' && <th style={{ padding: '1rem', textAlign: 'right' }}>현재가</th>}
                                <th style={{ padding: '1rem', textAlign: 'right' }}>평가액</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>{activeTab === 'Overall' ? '현재 비중' : '그룹 비중'}</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>목표 비중 (%)</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>목표 금액</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>조정 필요</th>
                                {activeTab !== 'Overall' && <th style={{ padding: '1rem', textAlign: 'right' }}>추가 매수/매도</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === 'Overall' ? (
                                categorySummary.map(cat => {
                                    const key = `Category-${cat.id}`;
                                    const currentRatio = totalValue > 0 ? (cat.currentValue / totalValue) * 100 : 0;
                                    const targetRatio = targets[key] || 0;
                                    const targetValue = totalValue * (targetRatio / 100);
                                    const diffValue = targetValue - cat.currentValue;

                                    return (
                                        <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{cat.label}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(cat.currentValue)}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>{currentRatio.toFixed(2)}%</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <input
                                                    type="number"
                                                    value={targets[key] || ''}
                                                    onChange={(e) => handleTargetChange(key, e.target.value)}
                                                    className="input"
                                                    style={{ width: '80px', textAlign: 'right' }}
                                                    step="0.1"
                                                />
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(targetValue)}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', color: diffValue > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                {diffValue > 0 ? '+' : ''}{formatCurrency(diffValue)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                filteredAssets.length === 0 ? (
                                    <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center' }}>자산이 없습니다.</td></tr>
                                ) : (
                                    filteredAssets.map(asset => {
                                        const key = `${asset.ticker}-${asset.account}`;
                                        const currentRatio = tabTotalValue > 0 ? (asset.currentValue / tabTotalValue) * 100 : 0;
                                        const targetRatio = targets[key] || 0;
                                        const targetValue = tabTotalValue * (targetRatio / 100);
                                        const diffValue = targetValue - asset.currentValue;

                                        let adjustedDiffQuantity = diffValue / asset.currentPrice;
                                        if (['US Stock', 'Crypto'].includes(asset.assetClass)) {
                                            const priceInKRW = asset.quantity > 0
                                                ? asset.currentValue / asset.quantity
                                                : asset.currentPrice * exchangeRate;
                                            adjustedDiffQuantity = diffValue / priceInKRW;
                                        }

                                        return (
                                            <tr key={key} style={{ borderBottom: '1px solid var(--border)', background: asset.isSimulation ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{asset.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{asset.ticker}</div>
                                                    {asset.isSimulation && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                                                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Simulation</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Remove from simulationAssets
                                                                    setSimulationAssets(prev => prev.filter(a => a.ticker !== asset.ticker || a.account !== asset.account));
                                                                    // Also remove from targets if present (optional, but good UX)
                                                                    setTargets(prev => {
                                                                        const newTargets = { ...prev };
                                                                        delete newTargets[`${asset.ticker}-${asset.account}`];
                                                                        // Also try legacy key
                                                                        if (asset.account === 'General') delete newTargets[asset.ticker];
                                                                        return newTargets;
                                                                    });
                                                                }}
                                                                style={{
                                                                    background: 'none', border: 'none', color: 'var(--danger)',
                                                                    cursor: 'pointer', fontSize: '0.8rem', padding: 0
                                                                }}
                                                                title="삭제"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span
                                                        className="badge"
                                                        onClick={() => setActiveTab(asset.account === 'General' ? 'Domestic' : asset.account)}
                                                        style={{
                                                            background: asset.account === 'Pension' ? '#e3f2fd' : (asset.account === 'IRP' ? '#fff3e0' : '#f5f5f5'),
                                                            color: asset.account === 'Pension' ? '#1565c0' : (asset.account === 'IRP' ? '#e65100' : '#616161'),
                                                            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {asset.account === 'General' ? '일반' : (asset.account === 'Pension' ? '연금' : 'IRP')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    {(asset.currentPrice || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    {formatCurrency(asset.currentValue)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    {currentRatio.toFixed(2)}%
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <input
                                                        type="number"
                                                        value={targets[key] || ''}
                                                        onChange={(e) => handleTargetChange(key, e.target.value)}
                                                        className="input"
                                                        style={{ width: '80px', textAlign: 'right' }}
                                                        step="0.1"
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    {formatCurrency(targetValue)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right', color: diffValue > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                    {diffValue > 0 ? '+' : ''}{formatCurrency(diffValue)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: adjustedDiffQuantity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                    {adjustedDiffQuantity > 0 ? '매수 ' : '매도 '}
                                                    {Math.abs(Math.round(adjustedDiffQuantity))}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 'bold', background: 'var(--background-secondary)' }}>
                                <td style={{ padding: '1rem' }}>합계</td>
                                {activeTab !== 'Overall' && <td></td>}
                                {activeTab !== 'Overall' && <td></td>}
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {formatCurrency(
                                        activeTab === 'Overall'
                                            ? categorySummary.reduce((sum, cat) => sum + cat.currentValue, 0)
                                            : filteredAssets.reduce((sum, a) => sum + a.currentValue, 0)
                                    )}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {/* Current Ratio Total should be 100% unless empty */
                                        (activeTab === 'Overall' ? categorySummary : filteredAssets).length > 0 ? '100.00%' : '0.00%'
                                    }
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--primary)' }}>
                                    {(() => {
                                        const items = activeTab === 'Overall' ? categorySummary : filteredAssets;
                                        const totalTarget = items.reduce((sum, item) => {
                                            const key = activeTab === 'Overall'
                                                ? `Category-${item.id}`
                                                : `${item.ticker}-${item.account}`;
                                            return sum + (targets[key] || 0);
                                        }, 0);
                                        return `${totalTarget.toFixed(1)}%`;
                                    })()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {formatCurrency(
                                        (() => {
                                            const items = activeTab === 'Overall' ? categorySummary : filteredAssets;
                                            const totalTarget = items.reduce((sum, item) => {
                                                const key = activeTab === 'Overall'
                                                    ? `Category-${item.id}`
                                                    : `${item.ticker}-${item.account}`;
                                                return sum + (targets[key] || 0);
                                            }, 0);
                                            // Target Value Total = Total Value * (Total Target / 100)
                                            // Or sum of individual target values?
                                            // Sum of individual target values is better to match column
                                            const baseValue = activeTab === 'Overall' ? totalValue : tabTotalValue;
                                            return items.reduce((sum, item) => {
                                                const key = activeTab === 'Overall'
                                                    ? `Category-${item.id}`
                                                    : `${item.ticker}-${item.account}`;
                                                const ratio = targets[key] || 0;
                                                return sum + (baseValue * (ratio / 100));
                                            }, 0);
                                        })()
                                    )}
                                </td>
                                <td></td>
                                {activeTab !== 'Overall' && <td></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
