'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { calculatePortfolioStats } from '@/lib/portfolioUtils';
import ScenarioControls from '@/components/Simulator/ScenarioControls';
import SimulationResult from '@/components/Simulator/SimulationResult';

export default function SimulatorPage() {
    const [trades, setTrades] = useState([]);
    const [prices, setPrices] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(1400); // Default fallback
    const [liabilities, setLiabilities] = useState([]);
    const [manualAssets, setManualAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Simulation State
    const [variables, setVariables] = useState({
        simulatedExchangeRate: 1400,
        btcChange: 0,
        usMarketChange: 0,
        domesticMarketChange: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tradesRes, pricesRes, liabilitiesRes, assetsRes] = await Promise.all([
                    fetch('/api/trades'),
                    fetch('/api/prices?tickers=KRW=X'),
                    fetch('/api/liabilities'),
                    fetch('/api/assets')
                ]);

                const tradesData = await tradesRes.json();
                const pricesData = await pricesRes.json();
                const liabilitiesData = await liabilitiesRes.json();
                const assetsData = await assetsRes.json();

                setTrades(tradesData);
                setLiabilities(liabilitiesData);
                setManualAssets(assetsData);

                // Extract exchange rate
                const rateObj = pricesData.find(p => p.ticker === 'KRW=X');
                if (rateObj) {
                    setExchangeRate(rateObj.price);
                    setVariables(prev => ({ ...prev, simulatedExchangeRate: rateObj.price }));
                }

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

    // 1. Calculate Current Stats
    const currentStats = calculatePortfolioStats(trades, prices, exchangeRate);

    // Add Manual Assets (Real Estate, Cash)
    const realEstateValue = manualAssets.filter(a => a.category === 'Real Estate').reduce((sum, item) => sum + parseFloat(item.value), 0);
    const cashValue = manualAssets.filter(a => a.category !== 'Real Estate').reduce((sum, item) => sum + parseFloat(item.value), 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    const currentTotalNetWorth = currentStats.totalValue + realEstateValue + cashValue - totalLiabilities;

    // 2. Calculate Simulated Stats
    const simulatedByAssetClass = {
        'Domestic Stock': { value: 0 },
        'US Stock': { value: 0 },
        'Crypto': { value: 0 }
    };

    // Apply Simulation Logic
    // Domestic: Value * (1 + Change)
    simulatedByAssetClass['Domestic Stock'].value = currentStats.byAssetClass['Domestic Stock'].value * (1 + variables.domesticMarketChange / 100);

    // US Stock: Value * (SimRate / CurrRate) * (1 + Change)
    simulatedByAssetClass['US Stock'].value = currentStats.byAssetClass['US Stock'].value * (variables.simulatedExchangeRate / exchangeRate) * (1 + variables.usMarketChange / 100);

    // Crypto: Value * (SimRate / CurrRate) * (1 + BTC Change)
    simulatedByAssetClass['Crypto'].value = currentStats.byAssetClass['Crypto'].value * (variables.simulatedExchangeRate / exchangeRate) * (1 + variables.btcChange / 100);

    const simulatedTotalValue =
        simulatedByAssetClass['Domestic Stock'].value +
        simulatedByAssetClass['US Stock'].value +
        simulatedByAssetClass['Crypto'].value;

    // Real Estate & Cash are assumed constant for now (or could add sliders later)
    const simulatedNetWorth = simulatedTotalValue + realEstateValue + cashValue - totalLiabilities;

    const simulatedStats = {
        netWorth: simulatedNetWorth,
        byAssetClass: simulatedByAssetClass
    };

    const fullCurrentStats = {
        netWorth: currentTotalNetWorth,
        byAssetClass: currentStats.byAssetClass,
        liabilities: totalLiabilities
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/" style={{ textDecoration: 'none', fontSize: '1.5rem' }}>←</Link>
                <div>
                    <h1 style={{ margin: 0 }}>🌪️ Risk Scenario Simulator</h1>
                    <p style={{ margin: 0, color: '#888' }}>Stress test your portfolio against market volatility</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                <ScenarioControls
                    variables={variables}
                    setVariables={setVariables}
                    currentExchangeRate={exchangeRate}
                />
                <SimulationResult
                    currentStats={fullCurrentStats}
                    simulatedStats={simulatedStats}
                    variables={variables}
                />
            </div>
        </div>
    );
}
