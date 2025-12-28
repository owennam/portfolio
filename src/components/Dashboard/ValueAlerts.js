'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ValueAlerts() {
    const [alerts, setAlerts] = useState({ overheated: [], undervalued: [], neutral: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/value-alerts')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setAlerts(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    if (loading) return null;
    if (alerts.overheated.length === 0 && alerts.undervalued.length === 0 && alerts.neutral.length === 0 && (!alerts.pending || alerts.pending.length === 0)) return null;

    return (
        <div className="card">
            <h3>Value Alerts</h3>
            <div className="grid-2" style={{ gap: '1.5rem' }}>
                {alerts.overheated.length > 0 && (
                    <div>
                        <h4 className="text-danger" style={{ marginBottom: '0.5rem' }}>Overheated</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {alerts.overheated.map(item => (
                                <Link key={item.ticker} href={`/analysis/${item.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-card">
                                        <div>
                                            <b>{item.name || item.ticker}</b>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ticker} • Margin: {item.marginOfSafety}%</div>
                                        </div>
                                        <div className="badge" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.8rem' }}>{item.recommendation}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {alerts.undervalued.length > 0 && (
                    <div>
                        <h4 className="text-success" style={{ marginBottom: '0.5rem' }}>Undervalued</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {alerts.undervalued.map(item => (
                                <Link key={item.ticker} href={`/analysis/${item.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-card">
                                        <div>
                                            <b>{item.name || item.ticker}</b>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ticker} • Margin: +{item.marginOfSafety}%</div>
                                        </div>
                                        <div className="badge" style={{ background: 'var(--success)', color: 'white', fontSize: '0.8rem' }}>{item.recommendation}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {alerts.neutral.length > 0 && (
                    <div>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--warning)' }}>Fair Value / Hold</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {alerts.neutral.map(item => (
                                <Link key={item.ticker} href={`/analysis/${item.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-card">
                                        <div>
                                            <b>{item.name || item.ticker}</b>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ticker} • Margin: {item.marginOfSafety > 0 ? '+' : ''}{item.marginOfSafety}%</div>
                                        </div>
                                        <div className="badge" style={{ background: 'var(--warning)', color: 'white', fontSize: '0.8rem' }}>{item.recommendation}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {alerts.pending && alerts.pending.length > 0 && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Pending Analysis</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                            {alerts.pending.map(item => (
                                <Link key={item.ticker} href={`/analysis/${item.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-card">
                                        <div>
                                            <b>{item.name || item.ticker}</b>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ticker}</div>
                                        </div>
                                        <div className="badge" style={{ background: 'var(--text-muted)', color: 'white', fontSize: '0.8rem' }}>ANALYZE</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
