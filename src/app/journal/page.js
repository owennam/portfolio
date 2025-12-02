'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function JournalArchive() {
    const [journals, setJournals] = useState([]);
    const [selectedJournal, setSelectedJournal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJournals = async () => {
            try {
                const res = await fetch('/api/journal');
                const data = await res.json();
                setJournals(data);
                if (data.length > 0) {
                    setSelectedJournal(data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch journals', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJournals();
    }, []);

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link href="/" className="btn btn-outline">← Dashboard</Link>
                    <h1>📚 투자 일지 보관함</h1>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', minHeight: '600px' }}>
                {/* Sidebar: List of Dates */}
                <div className="card" style={{ padding: '1rem', height: 'fit-content', maxHeight: '80vh', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>목록</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : journals.length === 0 ? (
                        <p style={{ color: '#888' }}>저장된 일지가 없습니다.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {journals.map(j => (
                                <li key={j.date}>
                                    <button
                                        onClick={() => {
                                            console.log('Clicked journal:', j);
                                            setSelectedJournal(j);
                                        }}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.75rem 1rem',
                                            background: selectedJournal?.date === j.date ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                                            color: selectedJournal?.date === j.date ? '#fff' : 'var(--foreground)',
                                            border: selectedJournal?.date === j.date ? '1px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: selectedJournal?.date === j.date ? '600' : 'normal',
                                            transition: 'all 0.2s ease',
                                            fontSize: '0.95rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedJournal?.date !== j.date) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedJournal?.date !== j.date) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            }
                                        }}
                                    >
                                        {j.date}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Main Content: Journal View */}
                <div className="card" style={{ padding: '2.5rem', minHeight: '600px', background: '#111', border: '1px solid #333' }}>
                    {selectedJournal ? (
                        <div className="prose" style={{ maxWidth: 'none' }}>
                            <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
                                {selectedJournal.date}
                            </h2>
                            <ReactMarkdown>{selectedJournal.content}</ReactMarkdown>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', gap: '1rem' }}>
                            <div style={{ fontSize: '3rem' }}>👈</div>
                            <p style={{ fontSize: '1.1rem' }}>왼쪽 목록에서 일지를 선택해주세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
