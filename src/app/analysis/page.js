'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HistoryChart from '@/components/Dashboard/HistoryChart';
import PerformanceStats from '@/components/Dashboard/PerformanceStats';
import ValueAlerts from '@/components/Dashboard/ValueAlerts';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AnalysisPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        fetch('/api/history')
            .then(res => res.json())
            .then(setHistory)
            .catch(err => console.error('Failed to fetch history', err));
    }, []);

    if (authLoading || !user) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>투자 분석</h1>
                <Link href="/" className="btn btn-outline">
                    메인으로
                </Link>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <ValueAlerts />
                <HistoryChart history={history} />
                <PerformanceStats history={history} />
            </div>
        </div>
    );
}
