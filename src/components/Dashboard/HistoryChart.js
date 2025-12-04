
'use client';
import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function HistoryChart({ history }) {
    const [activeTab, setActiveTab] = useState('investment'); // 'investment' or 'networth'

    if (!history || history.length === 0) {
        return <div className="card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>데이터가 없습니다.</div>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#ccc' }
            },
            title: {
                display: false, // Title handled by tabs
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            y: {
                grid: { color: '#333' },
                ticks: { color: '#999' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#999' }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    const investmentData = {
        labels: history.map(h => h.date),
        datasets: [
            {
                label: '투자 자산',
                data: history.map(h => h.totalValue),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                tension: 0.3,
                pointRadius: 4,
                fill: true
            },
            {
                label: '투자 원금',
                data: history.map(h => h.investedAmount || null),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.3,
                pointRadius: 4,
                hidden: false
            }
        ],
    };

    const netWorthData = {
        labels: history.map(h => h.date),
        datasets: [
            {
                label: '순자산 (Net Worth)',
                data: history.map(h => h.netWorth || null),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3,
                fill: true
            },
            {
                label: '총 자산',
                data: history.map(h => h.totalAssets || null),
                borderColor: 'rgb(255, 205, 86)',
                backgroundColor: 'rgba(255, 205, 86, 0.5)',
                tension: 0.3,
                hidden: true
            },
            {
                label: '총 부채',
                data: history.map(h => h.liabilities || null),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.3,
                hidden: true
            }
        ],
    };

    return (
        <div className="card" style={{ height: '450px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>자산 추이</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setActiveTab('investment')}
                        className={`btn ${activeTab === 'investment' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
                    >
                        투자 자산
                    </button>
                    <button
                        onClick={() => setActiveTab('networth')}
                        className={`btn ${activeTab === 'networth' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
                    >
                        순자산
                    </button>
                </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
                <Line options={options} data={activeTab === 'investment' ? investmentData : netWorthData} />
            </div>
        </div>
    );
}
