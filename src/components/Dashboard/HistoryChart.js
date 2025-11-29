'use client';
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
                display: true,
                text: '자산 추이',
                color: '#fff',
                font: { size: 16 }
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

    const data = {
        labels: history.map(h => h.date),
        datasets: [
            {
                label: '총 자산',
                data: history.map(h => h.totalValue),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                tension: 0.3,
                fill: true
            },
            {
                label: '투자 원금 (추정)',
                data: history.map(h => h.investedAmount || null), // Optional
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderDash: [5, 5],
                tension: 0.3,
                hidden: true // Hide by default if not strictly tracked
            }
        ],
    };

    return (
        <div className="card" style={{ height: '400px', padding: '1rem' }}>
            <Line options={options} data={data} />
        </div>
    );
}
