'use client';
import { useState } from 'react';
import { format, subWeeks, subMonths, subYears, isAfter } from 'date-fns';

export default function TradeList({ trades, prices, exchangeRate, onTradeDeleted, onTradeUpdated }) {
    const [filter, setFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const getCurrentPrice = (ticker) => {
        if (!prices || prices.length === 0) return null;
        const priceData = prices.find(p => p.ticker === ticker);
        return priceData ? priceData.price : null;
    };

    const filteredTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.date);
        const now = new Date();

        if (filter === 'Week') return isAfter(tradeDate, subWeeks(now, 1));
        if (filter === 'Month') return isAfter(tradeDate, subMonths(now, 1));
        if (filter === 'Year') return isAfter(tradeDate, subYears(now, 1));
        return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

    // Pagination Logic
    const totalPages = Math.ceil(filteredTrades.length / ITEMS_PER_PAGE);
    const paginatedTrades = filteredTrades.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Reset to page 1 when filter changes
    if (currentPage > 1 && currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }

    const [editingTrade, setEditingTrade] = useState(null);

    const handleAccountUpdate = async (tradeId, newAccount) => {
        try {
            const res = await fetch('/api/trades', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: tradeId, account: newAccount })
            });

            if (res.ok) {
                if (onTradeUpdated) onTradeUpdated(); // Re-fetch
                setEditingTrade(null);
            } else {
                alert('Failed to update account');
            }
        } catch (error) {
            console.error('Update failed', error);
            alert('Update failed');
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>최근 매매 내역</h3>
                <select
                    value={filter}
                    onChange={(e) => {
                        setFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="input"
                    style={{ width: 'auto', padding: '0.5rem' }}
                >
                    <option value="All">전체</option>
                    <option value="Week">최근 1주</option>
                    <option value="Month">최근 1달</option>
                    <option value="Year">최근 1년</option>
                </select>
            </div>

            <div style={{ overflowX: 'auto', minHeight: '400px' }}> {/* Added minHeight to prevent layout shift */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>날짜</th>
                            <th style={{ padding: '0.75rem' }}>구분</th>
                            <th style={{ padding: '0.75rem' }}>자산군</th>
                            <th style={{ padding: '0.75rem' }}>종목</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>가격</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>수량</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>총액</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>수익률</th>
                            <th style={{ padding: '0.75rem' }}>비고</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTrades.map(trade => {
                            const currentPrice = getCurrentPrice(trade.ticker);
                            let roi = null;
                            if (currentPrice && trade.type === 'Buy') {
                                roi = ((currentPrice - trade.price) / trade.price) * 100;
                            }

                            const isForeign = ['US Stock', 'Crypto'].includes(trade.assetClass);
                            const priceDisplay = isForeign
                                ? (
                                    <>
                                        <div>${Number(trade.price).toLocaleString()}</div>
                                        {exchangeRate && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>≈ ₩{(trade.price * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>}
                                    </>
                                )
                                : Number(trade.price).toLocaleString();

                            const totalDisplay = isForeign
                                ? (
                                    <>
                                        <div>${(trade.price * trade.quantity).toLocaleString()}</div>
                                        {exchangeRate && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>≈ ₩{(trade.price * trade.quantity * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>}
                                    </>
                                )
                                : (trade.price * trade.quantity).toLocaleString();

                            return (
                                <tr key={trade.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>{trade.date}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span className={`badge ${trade.type === 'Buy' ? 'badge-danger' : 'badge-success'}`}>
                                            {trade.type === 'Buy' ? '매수' : '매도'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{trade.assetClass}</td>
                                    <td style={{ padding: '0.75rem', position: 'relative' }}>
                                        <div
                                            style={{ fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            onClick={() => setEditingTrade(editingTrade === trade.id ? null : trade.id)}
                                        >
                                            {trade.name || trade.ticker}
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: trade.account === 'Pension' ? '#e3f2fd' : (trade.account === 'IRP' ? '#fff3e0' : '#f5f5f5'),
                                                color: trade.account === 'Pension' ? '#1565c0' : (trade.account === 'IRP' ? '#e65100' : '#616161')
                                            }}>
                                                {trade.account === 'General' ? '일반' : (trade.account === 'Pension' ? '연금' : 'IRP')}
                                            </span>
                                        </div>
                                        {trade.name && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{trade.ticker}</div>}

                                        {editingTrade === trade.id && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: '100%',
                                                marginLeft: '10px',
                                                zIndex: 100,
                                                background: 'var(--surface)', // Changed from var(--card-bg) which was undefined
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)', // Stronger shadow
                                                padding: '0.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem',
                                                minWidth: '120px'
                                            }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>계좌 변경</div>
                                                {['General', 'Pension', 'IRP'].map(acc => (
                                                    <button
                                                        key={acc}
                                                        onClick={() => handleAccountUpdate(trade.id, acc)}
                                                        style={{
                                                            padding: '0.5rem',
                                                            border: 'none',
                                                            background: trade.account === acc ? 'var(--primary)' : 'transparent',
                                                            color: trade.account === acc ? 'white' : 'var(--text)',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        {acc === 'General' ? '일반' : (acc === 'Pension' ? '연금저축' : 'IRP')}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{priceDisplay}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{trade.quantity}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{totalDisplay}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: roi > 0 ? 'var(--success)' : (roi < 0 ? 'var(--danger)' : 'inherit') }}>
                                        {roi !== null ? `${roi > 0 ? '+' : ''}${roi.toFixed(2)}%` : '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem', maxWidth: '200px' }}>
                                        {trade.reason ? (
                                            <div title={trade.reason} style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                cursor: 'help',
                                                fontSize: '0.85rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                {trade.reason}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => onTradeDeleted(trade.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                            title="삭제"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {paginatedTrades.length === 0 && (
                            <tr>
                                <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    기록이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                        이전
                    </button>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
}
