'use client';

export default function SimulationResult({ currentStats, simulatedStats, variables }) {
    const formatCurrency = (val) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(val);

    const diff = simulatedStats.netWorth - currentStats.netWorth;
    const diffPercent = (diff / currentStats.netWorth) * 100;

    return (
        <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>📊 시뮬레이션 결과 (Result)</h2>

            {/* Main Result */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div style={{ fontSize: '1rem', color: '#888', marginBottom: '0.5rem' }}>예상 순자산 (Simulated Net Worth)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {formatCurrency(simulatedStats.netWorth)}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: diff >= 0 ? '#4ade80' : '#f87171' }}>
                    {diff > 0 ? '+' : ''}{formatCurrency(diff)} ({diff > 0 ? '+' : ''}{diffPercent.toFixed(2)}%)
                </div>
            </div>

            {/* Breakdown Table */}
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>자산군별 영향 (Impact by Asset Class)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #333', color: '#888', fontSize: '0.9rem' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>자산군</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>현재 가치</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>시뮬레이션 가치</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>변동</th>
                    </tr>
                </thead>
                <tbody>
                    {['Domestic Stock', 'US Stock', 'Crypto'].map(assetClass => {
                        const current = currentStats.byAssetClass[assetClass]?.value || 0;
                        const simulated = simulatedStats.byAssetClass[assetClass]?.value || 0;
                        const d = simulated - current;
                        const p = current > 0 ? (d / current) * 100 : 0;

                        return (
                            <tr key={assetClass} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '0.75rem 0.5rem' }}>{assetClass}</td>
                                <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>{formatCurrency(current)}</td>
                                <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>{formatCurrency(simulated)}</td>
                                <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: d >= 0 ? '#4ade80' : '#f87171' }}>
                                    {d > 0 ? '+' : ''}{formatCurrency(d)} <br />
                                    <span style={{ fontSize: '0.8rem' }}>({d > 0 ? '+' : ''}{p.toFixed(1)}%)</span>
                                </td>
                            </tr>
                        );
                    })}
                    {/* Liabilities (Fixed) */}
                    <tr style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>부채 (Liabilities)</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#f87171' }}>-{formatCurrency(currentStats.liabilities)}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#f87171' }}>-{formatCurrency(currentStats.liabilities)}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>-</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
