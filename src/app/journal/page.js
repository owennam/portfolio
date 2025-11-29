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

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', minHeight: '600px' }}>
                {/* Sidebar: List of Dates */}
                <div className="card" style={{ padding: '1rem', height: 'fit-content' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>목록</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : journals.length === 0 ? (
                        <p style={{ color: '#888' }}>저장된 일지가 없습니다.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {journals.map(j => (
                                <li key={j.date} style={{ marginBottom: '0.5rem' }}>
                                    <button
                                        onClick={() => setSelectedJournal(j)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.75rem',
                                            background: selectedJournal?.date === j.date ? 'var(--primary)' : 'transparent',
                                            color: selectedJournal?.date === j.date ? '#fff' : 'var(--foreground)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: selectedJournal?.date === j.date ? 'bold' : 'normal'
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
                <div className="card" style={{ padding: '2rem', minHeight: '600px' }}>
                    {selectedJournal ? (
                        <div className="prose">
                            <ReactMarkdown>{selectedJournal.content}</ReactMarkdown>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                            <p>일지를 선택해주세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
