'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Newspaper, Bot, ExternalLink } from 'lucide-react';

export default function JournalPage() {
    const [news, setNews] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analyze: false })
            });
            if (res.ok) {
                const data = await res.json();
                setNews(data.news);
            }
        } catch (error) {
            console.error('Failed to fetch news', error);
        } finally {
            setLoading(false);
        }
    };

    const generateInsight = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analyze: true })
            });
            if (res.ok) {
                const data = await res.json();
                setAnalysis(data.analysis);
            }
        } catch (error) {
            console.error('Failed to generate insight', error);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Newspaper size={40} /> Hyper-Personalized Journal
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Curated news and AI insights for your specific portfolio holdings.
                </p>
            </div>

            {/* AI Insight Section */}
            <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bot size={24} /> AI Portfolio Insight
                    </h3>
                    <button
                        onClick={generateInsight}
                        disabled={analyzing}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {analyzing ? 'Analyzing...' : '✨ Generate Insight'}
                    </button>
                </div>

                {analysis ? (
                    <div>
                        <div style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                            {analysis.summary}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div className="badge" style={{ background: 'var(--surface)' }}>
                                Sentiment: <b>{analysis.sentiment}</b>
                            </div>
                            {analysis.impactedAssets.map(ticker => (
                                <div key={ticker} className="badge" style={{ background: 'var(--surface)' }}>
                                    {ticker}
                                </div>
                            ))}
                        </div>
                        {analysis.actionableInsights && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Actionable Insights</div>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                    {analysis.actionableInsights.map((insight, idx) => (
                                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{insight}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Click "Generate Insight" to analyze recent news impact on your portfolio.
                    </div>
                )}
            </div>

            {/* News Feed */}
            <h3 style={{ marginBottom: '1rem' }}>Latest News</h3>
            {loading ? (
                <div>Loading news...</div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {news.map((item, idx) => (
                        <div key={idx} className="card" style={{ display: 'flex', gap: '1rem', transition: 'transform 0.2s' }}>
                            {item.thumbnail && (
                                <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className="badge" style={{ fontSize: '0.8rem' }}>{item.ticker}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(item.providerPublishTime).toLocaleDateString()}
                                    </span>
                                </div>
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--foreground)', textDecoration: 'none', display: 'block', marginBottom: '0.5rem' }}
                                >
                                    {item.title} <ExternalLink size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                                </a>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {item.publisher}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
