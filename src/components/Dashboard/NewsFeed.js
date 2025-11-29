'use client';
import { useState } from 'react';
import { Newspaper, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function NewsFeed({ assets }) {
    const [journal, setJournal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);

    // Identify Movers (>3% change)
    const movers = assets.filter(a => Math.abs(a.changePercent) > 3);

    const handleGenerateJournal = async () => {
        setLoading(true);
        setShowJournalModal(true);
        try {
            const topHoldings = assets
                .sort((a, b) => b.currentValue - a.currentValue)
                .slice(0, 3)
                .map(a => a.ticker)
                .join(',');

            const res = await fetch(`/api/journal/generate?holdings=${topHoldings}`);
            const data = await res.json();

            if (data.error) {
                setJournal(`Error: ${data.error}\nDetails: ${data.details || 'No details'}`);
            } else {
                setJournal(data.markdown);
            }
        } catch (e) {
            console.error(e);
            setJournal("Failed to generate journal. Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3><Newspaper size={20} style={{ marginRight: '8px', verticalAlign: 'bottom' }} /> Market Insights</h3>
                <button className="btn btn-primary" onClick={handleGenerateJournal}>
                    <BookOpen size={16} style={{ marginRight: '8px' }} /> 투자일지 작성
                </button>
            </div>

            {/* Movers Section */}
            {movers.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h4 className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>🔥 주요 변동 종목</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {movers.map(asset => (
                            <span key={asset.ticker} className={`badge ${asset.changePercent > 0 ? 'badge-success' : 'badge-danger'}`}>
                                {asset.ticker} {asset.changePercent > 0 ? '+' : ''}{asset.changePercent?.toFixed(2)}%
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Journal Modal (Simple Overlay) */}
            {showJournalModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="card" style={{ width: '800px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
                        <button
                            onClick={() => setShowJournalModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}
                        >
                            &times;
                        </button>
                        <h2>📝 오늘의 투자 일지 (Draft)</h2>
                        {loading ? (
                            <p>시장 데이터를 분석하고 뉴스를 수집 중입니다...</p>
                        ) : (
                            <div style={{ lineHeight: 1.6, color: '#e5e5e5' }}>
                                <ReactMarkdown>{journal}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
