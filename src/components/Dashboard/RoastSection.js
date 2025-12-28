'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function RoastSection({ stats, holdings }) {
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState(null); // 'roast' or 'advisor'

    const handleRoast = async (selectedMode) => {
        setLoading(true);
        setMode(selectedMode);
        setResponse(''); // Clear previous response

        try {
            const res = await fetch('/api/roast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stats,
                    holdings,
                    mode: selectedMode
                })
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.details || 'Unknown error occurred');
            }

            if (data.markdown) {
                setResponse(data.markdown);
            }
        } catch (error) {
            console.error('Roast failed', error);
            setResponse(`❌ 오류 발생: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(to right, #1a1a1a, #2d2d2d)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Grok Portfolio Check
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                        내 포트폴리오에 대한 냉철한 평가 혹은 따뜻한 조언을 받아보세요.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn"
                        onClick={() => handleRoast('roast')}
                        disabled={loading}
                        style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading && mode === 'roast' ? '굽는 중...' : '팩트 폭격 (Roast)'}
                    </button>
                    <button
                        className="btn"
                        onClick={() => handleRoast('advisor')}
                        disabled={loading}
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading && mode === 'advisor' ? '생각 중...' : '진지한 조언 (Advisor)'}
                    </button>
                </div>
            </div>

            {response && (
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${mode === 'roast' ? '#ef4444' : '#3b82f6'}`,
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    <div className="prose" style={{ color: '#e5e5e5' }}>
                        <ReactMarkdown>{response}</ReactMarkdown>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
