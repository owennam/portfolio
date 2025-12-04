'use client';

export default function ScenarioControls({ variables, setVariables, currentExchangeRate }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setVariables(prev => ({
            ...prev,
            [name]: parseFloat(value)
        }));
    };

    return (
        <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>🎛️ 시나리오 설정 (Scenario Settings)</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Exchange Rate Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label>🇺🇸 원/달러 환율 (Exchange Rate)</label>
                        <span className="font-bold">{variables.simulatedExchangeRate.toLocaleString()} KRW</span>
                    </div>
                    <input
                        type="range"
                        name="simulatedExchangeRate"
                        min="1000"
                        max="1600"
                        step="10"
                        value={variables.simulatedExchangeRate}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                        <span>1,000</span>
                        <span>Current: {currentExchangeRate?.toLocaleString()}</span>
                        <span>1,600</span>
                    </div>
                </div>

                {/* Bitcoin Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label>🪙 비트코인 변동 (Bitcoin Change)</label>
                        <span className={variables.btcChange >= 0 ? 'text-success font-bold' : 'text-danger font-bold'}>
                            {variables.btcChange > 0 ? '+' : ''}{variables.btcChange}%
                        </span>
                    </div>
                    <input
                        type="range"
                        name="btcChange"
                        min="-50"
                        max="50"
                        step="5"
                        value={variables.btcChange}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                        <span>-50%</span>
                        <span>0%</span>
                        <span>+50%</span>
                    </div>
                </div>

                {/* US Market Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label>🇺🇸 미국 증시 변동 (US Market)</label>
                        <span className={variables.usMarketChange >= 0 ? 'text-success font-bold' : 'text-danger font-bold'}>
                            {variables.usMarketChange > 0 ? '+' : ''}{variables.usMarketChange}%
                        </span>
                    </div>
                    <input
                        type="range"
                        name="usMarketChange"
                        min="-30"
                        max="30"
                        step="1"
                        value={variables.usMarketChange}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Domestic Market Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label>🇰🇷 한국 증시 변동 (KOSPI/KOSDAQ)</label>
                        <span className={variables.domesticMarketChange >= 0 ? 'text-success font-bold' : 'text-danger font-bold'}>
                            {variables.domesticMarketChange > 0 ? '+' : ''}{variables.domesticMarketChange}%
                        </span>
                    </div>
                    <input
                        type="range"
                        name="domesticMarketChange"
                        min="-30"
                        max="30"
                        step="1"
                        value={variables.domesticMarketChange}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
