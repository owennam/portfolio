
'use client';
import { useMemo } from 'react';

export default function PerformanceStats({ history }) {
    const stats = useMemo(() => {
        if (!history || history.length === 0) return { monthly: [], yearly: [] };

        // Sort by date
        const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Helper to get Net Profit
        const getNetProfit = (entry) => entry.totalValue - entry.investedAmount;

        // Group by Month and Year (keeping only the last entry of each period)
        const monthlyMap = {};
        const yearlyMap = {};

        sorted.forEach(entry => {
            const date = new Date(entry.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const yearKey = `${date.getFullYear()}`;

            // Always overwrite to keep the latest entry for that period
            monthlyMap[monthKey] = entry;
            yearlyMap[yearKey] = entry;
        });

        // Calculate Monthly Performance
        const monthlyKeys = Object.keys(monthlyMap).sort();
        const monthlyStats = monthlyKeys.map((key, index) => {
            const current = monthlyMap[key];
            const prevKey = monthlyKeys[index - 1];
            const prev = prevKey ? monthlyMap[prevKey] : null;

            const currentNetProfit = getNetProfit(current);
            const prevNetProfit = prev ? getNetProfit(prev) : 0; // Or start from 0?
            // If no previous month, maybe we should compare to the start of this month? 
            // For simplicity, let's just show the Net Profit at end of month if it's the first record.
            // Better: Change = Current Net Profit - Previous Month End Net Profit.

            const profitChange = currentNetProfit - prevNetProfit;
            const roi = prev && prev.totalValue > 0 ? (profitChange / prev.totalValue) * 100 : 0;

            return {
                period: key,
                netProfit: currentNetProfit,
                profitChange: profitChange,
                roi: roi,
                totalValue: current.totalValue
            };
        }).reverse(); // Show latest first

        // Calculate Yearly Performance
        const yearlyKeys = Object.keys(yearlyMap).sort();
        const yearlyStats = yearlyKeys.map((key, index) => {
            const current = yearlyMap[key];
            const prevKey = yearlyKeys[index - 1];
            const prev = prevKey ? yearlyMap[prevKey] : null;

            const currentNetProfit = getNetProfit(current);
            const prevNetProfit = prev ? getNetProfit(prev) : 0;

            const profitChange = currentNetProfit - prevNetProfit;
            const roi = prev && prev.totalValue > 0 ? (profitChange / prev.totalValue) * 100 : 0;

            return {
                period: key,
                netProfit: currentNetProfit,
                profitChange: profitChange,
                roi: roi,
                totalValue: current.totalValue
            };
        }).reverse();

        return { monthly: monthlyStats, yearly: yearlyStats };
    }, [history]);

    const formatCurrency = (val) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);

    return (
        <div className="grid-2">
            {/* Monthly Stats */}
            <div className="card">
                <h3>📅 월간 성과</h3>
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '0.5rem' }}>기간</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>수익금 (변동)</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>수익률</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>총 자산</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.monthly.slice(0, 12).map((stat) => (
                                <tr key={stat.period} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.5rem' }}>{stat.period}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }} className={stat.profitChange >= 0 ? 'text-success' : 'text-danger'}>
                                        {stat.profitChange > 0 ? '+' : ''}{formatCurrency(stat.profitChange)}
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }} className={stat.roi >= 0 ? 'text-success' : 'text-danger'}>
                                        {stat.roi.toFixed(2)}%
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                        {formatCurrency(stat.totalValue)}
                                    </td>
                                </tr>
                            ))}
                            {stats.monthly.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>데이터 없음</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Yearly Stats */}
            <div className="card">
                <h3>🏆 연간 성과</h3>
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '0.5rem' }}>연도</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>수익금 (변동)</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>수익률</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>총 자산</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.yearly.map((stat) => (
                                <tr key={stat.period} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.5rem' }}>{stat.period}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }} className={stat.profitChange >= 0 ? 'text-success' : 'text-danger'}>
                                        {stat.profitChange > 0 ? '+' : ''}{formatCurrency(stat.profitChange)}
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }} className={stat.roi >= 0 ? 'text-success' : 'text-danger'}>
                                        {stat.roi.toFixed(2)}%
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                        {formatCurrency(stat.totalValue)}
                                    </td>
                                </tr>
                            ))}
                            {stats.yearly.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>데이터 없음</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
