'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { logError, logWarn, logDebug } from '@/lib/logger';

export default function JournalSection({ stats, trades, history, globalStats }) {
    const [journal, setJournal] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('preview');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleGenerate = async () => {
        // Validation: Warn if data seems missing but allow proceed (might be fresh user)
        if (!stats.totalValue && !globalStats?.totalAssets) {
            logWarn('Generating journal with 0 assets.');
        }

        setLoading(true);
        try {

            // Use calculated assets from stats if available, otherwise fallback to trades (top 20)
            const currentHoldings = stats.assets && stats.assets.length > 0
                ? stats.assets.map(a => ({
                    ticker: a.ticker,
                    name: a.name,
                    value: a.currentValue, // Calculated current value
                    quantity: a.quantity,
                    roi: a.roi,
                    totalReturn: a.roi // Alias for AI context
                }))
                : [...trades].sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity)).slice(0, 20);

            const res = await fetch('/api/journal/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    holdings: currentHoldings,
                    stats: {
                        totalValue: stats.totalValue,
                        netProfit: stats.netProfit,
                        roi: stats.roi
                    },
                    globalStats,
                    trades: trades,
                    history: history
                })
            });

            const data = await res.json();
            if (data.markdown) {
                setJournal(data.markdown);
                setMode('preview');
            } else if (data.error) {
                throw new Error(data.details || data.error);
            }
        } catch (error) {
            logError('Failed to generate journal', error);
            showToast(`일지 생성 실패: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };


    const { user } = useAuth();

    const handleSave = async () => {
        logDebug('handleSave called');
        if (!journal) {
            showToast('저장할 일지가 없습니다', 'error');
            return;
        }

        if (!user) {
            showToast('로그인이 필요합니다', 'error');
            return;
        }

        try {
            const today = new Date().toLocaleDateString('en-CA');
            logDebug('Saving journal for date:', today);

            const token = await user.getIdToken();
            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: today,
                    content: journal
                })
            });

            logDebug('Response status:', res.status);

            if (res.ok) {
                logDebug('Save successful');
                showToast('✅ 투자 일지가 저장되었습니다!', 'success');
            } else {
                const errorText = await res.text();
                // Check if 401
                if (res.status === 401) {
                    showToast('권한이 없습니다 (로그인 필요)', 'error');
                } else {
                    logError('Save failed:', new Error(errorText), { status: res.status });
                    showToast('저장 실패', 'error');
                }
            }
        } catch (error) {
            logError('Failed to save journal', error);
            showToast('오류 발생', 'error');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(journal);
        showToast('클립보드에 복사되었습니다!', 'success');
    };

    return (
        <div className="card" style={{ padding: '1.5rem', position: 'relative' }}>
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '1rem 1.5rem',
                    background: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    animation: 'slideIn 0.3s ease-out',
                    fontSize: '1rem',
                    fontWeight: '500'
                }}>
                    {toast.message}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>AI 투자 일지</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {journal && (
                        <>
                            <button className="btn btn-outline" onClick={handleSave}>저장</button>
                            <button
                                className="btn btn-outline"
                                onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
                            >
                                {mode === 'preview' ? '수정' : '미리보기'}
                            </button>
                            <button className="btn btn-outline" onClick={handleCopy}>복사</button>
                        </>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? '생성 중...' : '일지 생성'}
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

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
