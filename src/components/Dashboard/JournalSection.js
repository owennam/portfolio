'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function JournalSection({ stats, trades, history }) {
    const [journal, setJournal] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('preview'); // 'preview' or 'edit'

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Get top 3 holdings by value
            const sortedTrades = [...trades].sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
            const topHoldings = sortedTrades.slice(0, 3).map(t => ({ ticker: t.ticker, name: t.name }));

            const res = await fetch('/api/journal/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    holdings: topHoldings,
                    stats: {
                        totalValue: stats.totalValue,
                        netProfit: stats.netProfit,
                        roi: stats.roi
                    },
                    trades: trades, // Pass all trades, backend filters for today
                    history: history // Pass history for comparison
                })
            });
            const data = await res.json();
            if (data.markdown) {
                setJournal(data.markdown);
                setMode('preview');
            }
        } catch (error) {
            console.error('Failed to generate journal', error);
            alert('일지 생성 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!journal) return;
        if (!confirm('일지를 저장하시겠습니까?')) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: today,
                    content: journal
                })
            });

            if (res.ok) {
                alert('저장되었습니다!');
            } else {
                alert('저장 실패');
            }
        } catch (error) {
            console.error('Failed to save journal', error);
            alert('오류 발생');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(journal);
        alert('클립보드에 복사되었습니다!');
    };

    return (
        <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>🤖 AI 투자 일지</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {journal && (
                        <>
                            <button className="btn btn-outline" onClick={handleSave}>💾 저장</button>
                            <button
                                className="btn btn-outline"
                                onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
                            >
                                {mode === 'preview' ? '✏️ 수정' : '👁️ 미리보기'}
                            </button>
                            <button className="btn btn-outline" onClick={handleCopy}>📋 복사</button>
                        </>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? '생성 중...' : '✨ 일지 생성'}
                    </button>
                </div>
            </div>

            {journal ? (
                <div style={{ background: 'var(--background-secondary)', padding: '1rem', borderRadius: '8px', minHeight: '200px' }}>
                    {mode === 'preview' ? (
                        <div className="prose" style={{ color: 'var(--foreground)' }}>
                            <ReactMarkdown>{journal}</ReactMarkdown>
                        </div>
                    ) : (
                        <textarea
                            value={journal}
                            onChange={(e) => setJournal(e.target.value)}
                            style={{
                                width: '100%',
                                height: '400px',
                                background: 'transparent',
                                color: 'inherit',
                                border: 'none',
                                resize: 'vertical',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem'
                            }}
                        />
                    )}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                    <p>아직 작성된 일지가 없습니다.</p>
                    <p>버튼을 눌러 오늘의 시장 상황과 내 포트폴리오를 분석해보세요.</p>
                </div>
            )}
        </div>
    );
}
