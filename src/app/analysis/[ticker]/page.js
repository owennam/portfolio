'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function StockAnalysisPage() {
    const { ticker } = useParams();
    const [analysis, setAnalysis] = useState(null);
    const [price, setPrice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        if (!ticker) return;

        const fetchData = async () => {
            try {
                // 1. Get Analysis
                const resAnalysis = await fetch(`/api/stock-analysis/${ticker}`);
                if (resAnalysis.ok) {
                    const data = await resAnalysis.json();
                    setAnalysis(data);
                    setEditData(data); // Initialize edit data
                }

                // 2. Get Price
                const resPrice = await fetch(`/api/prices?tickers=${ticker}`);
                const priceData = await resPrice.json();
                if (priceData.length > 0) setPrice(priceData[0].price);

                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch data', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [ticker]);

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/stock-analysis/${ticker}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });

            if (res.ok) {
                const updated = await res.json();
                setAnalysis(updated);
                setIsEditing(false);
                alert('Analysis saved successfully!');
            } else {
                alert('Failed to save analysis.');
            }
        } catch (error) {
            console.error('Save error', error);
            alert('Error saving analysis.');
        }
    };

    const handleChange = (section, field, value) => {
        setEditData(prev => {
            if (section === 'root') {
                return { ...prev, [field]: value };
            }
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            };
        });
    };

    const handleNestedChange = (section, subsection, field, value) => {
        setEditData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subsection]: {
                    ...prev[section][subsection],
                    [field]: value
                }
            }
        }));
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!analysis) return <div className="container">Analysis not found for {ticker}</div>;

    const marginOfSafety = price && analysis.intrinsicValue?.midpoint
        ? ((analysis.intrinsicValue.midpoint - price) / analysis.intrinsicValue.midpoint * 100).toFixed(2)
        : 'N/A';

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Link href="/" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <div>
                    {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setIsEditing(false)} className="btn btn-outline">Cancel</button>
                            <button onClick={handleSave} className="btn btn-primary" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>Save Changes</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="btn btn-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                            ✏️ Edit Analysis
                        </button>
                    )}
                </div>
            </div>

            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{analysis.name} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>({analysis.ticker})</span></h1>
                        <div className="badge" style={{ fontSize: '1rem', background: 'var(--surface-hover)' }}>US Stock</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${price}</div>
                        <div style={{ color: marginOfSafety > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                            Margin of Safety: {marginOfSafety}%
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid-2" style={{ gap: '2rem' }}>
                {/* Intrinsic Value */}
                <div className="card">
                    <h3>💎 Intrinsic Value</h3>
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Midpoint ($)</label>
                                <input
                                    type="number"
                                    value={editData.intrinsicValue?.midpoint || ''}
                                    onChange={(e) => handleChange('intrinsicValue', 'midpoint', parseFloat(e.target.value))}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Low ($)</label>
                                    <input
                                        type="number"
                                        value={editData.intrinsicValue?.range?.low || ''}
                                        onChange={(e) => handleNestedChange('intrinsicValue', 'range', 'low', parseFloat(e.target.value))}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>High ($)</label>
                                    <input
                                        type="number"
                                        value={editData.intrinsicValue?.range?.high || ''}
                                        onChange={(e) => handleNestedChange('intrinsicValue', 'range', 'high', parseFloat(e.target.value))}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Valuation Method</label>
                                <input
                                    type="text"
                                    value={editData.intrinsicValue?.method || ''}
                                    onChange={(e) => handleChange('intrinsicValue', 'method', e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                ${analysis.intrinsicValue?.midpoint || 'N/A'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                <span>Range: ${analysis.intrinsicValue?.range?.low || '?'} - ${analysis.intrinsicValue?.range?.high || '?'}</span>
                            </div>
                            <div className="text-sm">Method: {analysis.intrinsicValue?.method}</div>
                            <div className="text-sm text-muted">Last Updated: {analysis.intrinsicValue?.lastUpdated}</div>
                        </>
                    )}
                </div>

                {/* Economic Moat */}
                <div className="card">
                    <h3>🏰 Economic Moat</h3>
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Moat Score (0-20)</label>
                                <input
                                    type="number"
                                    value={editData.moat?.score || ''}
                                    onChange={(e) => handleChange('moat', 'score', parseFloat(e.target.value))}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Rating (Wide/Narrow/None)</label>
                                <select
                                    value={editData.moat?.rating || 'Unrated'}
                                    onChange={(e) => handleChange('moat', 'rating', e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                >
                                    <option value="Wide">Wide</option>
                                    <option value="Narrow">Narrow</option>
                                    <option value="None">None</option>
                                    <option value="Unrated">Unrated</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{analysis.moat?.score || 0}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/20</span></div>
                                <div className="badge" style={{ fontSize: '1rem', background: analysis.moat?.rating === 'Wide' ? 'var(--success)' : 'var(--warning)', color: 'white' }}>
                                    {analysis.moat?.rating}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                                {analysis.moat?.breakdown && Object.entries(analysis.moat.breakdown).map(([key, val]) => (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <b>{val}</b>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Investment Thesis */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h3>📜 Investment Thesis</h3>
                    {isEditing ? (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Key Hypotheses (One per line)</label>
                            <textarea
                                rows={5}
                                value={editData.investmentThesis?.hypotheses?.map(h => h.hypothesis).join('\n') || ''}
                                onChange={(e) => {
                                    const lines = e.target.value.split('\n');
                                    const newHypotheses = lines.map(line => ({ hypothesis: line, valid: true }));
                                    setEditData(prev => ({
                                        ...prev,
                                        investmentThesis: {
                                            ...prev.investmentThesis,
                                            hypotheses: newHypotheses
                                        }
                                    }));
                                }}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                            />
                        </div>
                    ) : (
                        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                            {analysis.investmentThesis?.hypotheses?.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                                    {item.hypothesis} {item.valid ? '✅' : '❌'}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Capital Allocation */}
                <div className="card">
                    <h3>💰 Capital Allocation</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="stat-box">
                            <div className="label">ROE</div>
                            <div className="value">{analysis.capitalAllocation?.roe?.current}% <span className="grade">{analysis.capitalAllocation?.roe?.grade}</span></div>
                        </div>
                        <div className="stat-box">
                            <div className="label">ROIC</div>
                            <div className="value">{analysis.capitalAllocation?.roic?.current}% <span className="grade">{analysis.capitalAllocation?.roic?.grade}</span></div>
                        </div>
                        <div className="stat-box">
                            <div className="label">Debt/Equity</div>
                            <div className="value">{analysis.capitalAllocation?.debtEquity?.current} <span className="grade">{analysis.capitalAllocation?.debtEquity?.grade}</span></div>
                        </div>
                        <div className="stat-box">
                            <div className="label">Overall Grade</div>
                            <div className="value" style={{ fontSize: '1.5rem' }}>{analysis.capitalAllocation?.overallGrade}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Sections: Alerts & Next Actions */}
            <div className="grid-2" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Alerts */}
                {analysis.alerts && (
                    <div className="card">
                        <h3>🚨 Alerts</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {analysis.alerts.marginOfSafety && (
                                <div style={{ padding: '0.75rem', background: analysis.alerts.marginOfSafety.triggered ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-hover)', borderRadius: '8px', border: analysis.alerts.marginOfSafety.triggered ? '1px solid var(--danger)' : 'none' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Margin of Safety</div>
                                    <div style={{ fontSize: '0.9rem' }}>Threshold: {analysis.alerts.marginOfSafety.threshold}%</div>
                                    {analysis.alerts.marginOfSafety.triggered && (
                                        <div style={{ color: 'var(--danger)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                                            ⚠️ {analysis.alerts.marginOfSafety.message}
                                        </div>
                                    )}
                                </div>
                            )}
                            {analysis.alerts.moatWeakening && (
                                <div style={{ padding: '0.75rem', background: analysis.alerts.moatWeakening.triggered ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-hover)', borderRadius: '8px', border: analysis.alerts.moatWeakening.triggered ? '1px solid var(--danger)' : 'none' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Moat Weakening</div>
                                    <div style={{ fontSize: '0.9rem' }}>Threshold: {analysis.alerts.moatWeakening.threshold}</div>
                                    {analysis.alerts.moatWeakening.triggered && (
                                        <div style={{ color: 'var(--danger)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                                            ⚠️ Moat score dropped below threshold!
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Next Actions */}
                {analysis.nextActions && (
                    <div className="card">
                        <h3>🚀 Next Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {analysis.nextActions.map((action, idx) => (
                                <div key={idx} style={{ padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold' }}>{action.action}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '2px 8px', borderRadius: '4px' }}>
                                        {action.condition}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Price History */}
            {analysis.priceHistory && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <h3>📈 Price History</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Date</th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.priceHistory.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--surface-hover)' }}>
                                        <td style={{ padding: '0.5rem' }}>{item.date}</td>
                                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>${item.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style jsx>{`
                .stat-box {
                    background: var(--surface-hover);
                    padding: 1rem;
                    border-radius: 8px;
                }
                .label {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    margin-bottom: 0.25rem;
                }
                .value {
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                .grade {
                    font-size: 0.85rem;
                    padding: 2px 6px;
                    background: var(--surface);
                    border-radius: 4px;
                    margin-left: 6px;
                }
            `}</style>
        </div>
    );
}
