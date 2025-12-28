'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Trash2, Calendar, FileText } from 'lucide-react';

export default function JournalHistoryPage() {
    const [journals, setJournals] = useState([]);
    const [selectedJournal, setSelectedJournal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJournals();
    }, []);

    const fetchJournals = async () => {
        try {
            const res = await fetch('/api/journal');
            const data = await res.json();
            if (data.journals) {
                setJournals(data.journals);
            }
        } catch (error) {
            console.error('Failed to fetch journals', error);
        } finally {
            setLoading(false);
        }
    };

    // Note: Delete API is not implemented yet in route.js, so this is just UI for now or we can implement DELETE method.
    // For now let's just show the list.

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', margin: '0 0 0.5rem 0' }}>
                        <FileText size={32} /> 투자 일지 기록 (History)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        저장된 과거의 AI 투자 분석 기록을 확인하세요.
                    </p>
                </div>
                <Link href="/" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    메인으로
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Sidebar: List */}
                <div className="card" style={{ padding: '1rem', height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                        저장된 일지 ({journals.length})
                    </h3>
                    {loading ? (
                        <div>Loading...</div>
                    ) : journals.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                            기록이 없습니다.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {journals.map((journal, index) => (
                                <div
                                    key={journal.id || index}
                                    onClick={() => setSelectedJournal(journal)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: selectedJournal?.id === journal.id ? 'var(--primary)' : 'var(--background-secondary)',
                                        color: selectedJournal?.id === journal.id ? 'white' : 'inherit',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                        <Calendar size={14} />
                                        {journal.date}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {journal.content.substring(0, 30)}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content: Viewer */}
                <div className="card" style={{ padding: '2rem', minHeight: '500px' }}>
                    {selectedJournal ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                <h2 style={{ margin: 0 }}>{selectedJournal.date} 투자 일지</h2>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Updated: {new Date(selectedJournal.updatedAt).toLocaleString()}
                                </span>
                            </div>
                            <div className="prose" style={{ color: 'var(--foreground)' }}>
                                <ReactMarkdown>{selectedJournal.content}</ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', minHeight: '400px' }}>
                            <FileText size={64} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p style={{ fontSize: '1.2rem' }}>왼쪽 목록에서 일지를 선택하여 내용을 확인하세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
