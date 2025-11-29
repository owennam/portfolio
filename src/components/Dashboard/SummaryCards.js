import Link from 'next/link';

export default function SummaryCards({ stats }) {
    const { totalValue, totalInvested, netProfit, roi, byAssetClass } = stats;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Main Summary */}
            <div className="grid-4">
                <div className="card">
                    <h3>총 자산</h3>
                    <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
                <div className="card">
                    <h3>총 투자금</h3>
                    <p className="text-xl font-bold">{formatCurrency(totalInvested)}</p>
                </div>
                <div className="card">
                    <h3>순수익</h3>
                    <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(netProfit)}
                    </p>
                </div>
                <div className="card">
                    <h3>수익률</h3>
                    <p className={`text-xl font-bold ${roi >= 0 ? 'text-success' : 'text-danger'}`}>
                        {roi.toFixed(2)}%
                    </p>
                </div>
            </div>

            {/* Asset Class Breakdown */}
            {byAssetClass && (
                <div className="grid-3">
                    {Object.entries(byAssetClass).map(([className, data]) => {
                        const classRoi = data.invested > 0 ? ((data.value - data.invested) / data.invested) * 100 : 0;

                        let linkHref = '#';
                        if (className === 'Domestic Stock') linkHref = '/assets/domestic';
                        if (className === 'US Stock') linkHref = '/assets/us';
                        if (className === 'Crypto') linkHref = '/assets/crypto';

                        return (
                            <Link href={linkHref} key={className} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="card hover-card" style={{ padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        {className === 'Domestic Stock' ? '🇰🇷 국내 주식' : (className === 'US Stock' ? '🇺🇸 미국 주식' : '🪙 암호화폐')}
                                    </h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(data.value)}</span>
                                        <span className={classRoi >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: '0.9rem' }}>
                                            {classRoi > 0 ? '+' : ''}{classRoi.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
