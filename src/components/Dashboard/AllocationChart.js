'use client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AllocationChart({ assets }) {
    // Group by Asset Class
    const allocation = assets.reduce((acc, asset) => {
        acc[asset.assetClass] = (acc[asset.assetClass] || 0) + asset.currentValue;
        return acc;
    }, {});

    const data = {
        labels: Object.keys(allocation),
        datasets: [
            {
                data: Object.values(allocation),
                backgroundColor: [
                    '#3b82f6', // Blue
                    '#10b981', // Green
                    '#f59e0b', // Yellow
                    '#8b5cf6', // Purple
                    '#ec4899', // Pink
                ],
                borderColor: '#171717',
                borderWidth: 2,
            },
        ],
    };

    const options = {
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#ededed' }
            }
        },
        cutout: '70%',
    };

    return (
        <div className="card" style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%' }}>
                <Doughnut data={data} options={options} />
            </div>
        </div>
    );
}
