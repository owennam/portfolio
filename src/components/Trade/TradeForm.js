'use client';
import { useState } from 'react';

export default function TradeForm({ onTradeAdded }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Buy',
        assetClass: 'Domestic Stock',
        ticker: '',
        price: '',
        quantity: '',
        reason: '',
        account: 'General'
    });
    const [stockName, setStockName] = useState('');
    const [fetchingName, setFetchingName] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/trades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, name: stockName }),
            });
            if (res.ok) {
                const newTrade = await res.json();
                onTradeAdded(newTrade);
                // Reset form (keep date/type/account for convenience)
                setFormData(prev => ({ ...prev, ticker: '', price: '', quantity: '', reason: '' }));
                setStockName('');
            }
        } catch (error) {
            console.error('Failed to add trade', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTickerBlur = async () => {
        if (!formData.ticker) return;

        let searchTicker = formData.ticker;
        // Auto-append -USD for Crypto if not present
        if (formData.assetClass === 'Crypto' && !searchTicker.includes('-')) {
            searchTicker = `${searchTicker.toUpperCase()}-USD`;
            setFormData(prev => ({ ...prev, ticker: searchTicker }));
        }

        setFetchingName(true);
        try {
            const res = await fetch(`/api/prices?tickers=${searchTicker}`);
            const data = await res.json();
            if (data && data.length > 0 && data[0].shortName) {
                setStockName(data[0].shortName);
            } else {
                setStockName('종목을 찾을 수 없음');
            }
        } catch (error) {
            setStockName('조회 실패');
        } finally {
            setFetchingName(false);
        }
    };

    return (
        <div className="card">
            <h3>매매 기록 추가</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div>
                    <label className="text-sm text-muted">날짜</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" required style={{ width: '100%' }} />
                </div>
                <div>
                    <label className="text-sm text-muted">계좌</label>
                    <select name="account" value={formData.account} onChange={handleChange} className="input" style={{ width: '100%' }}>
                        <option value="General">일반 (General)</option>
                        <option value="Pension">연금저축 (Pension)</option>
                        <option value="IRP">IRP</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm text-muted">구분</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="input" style={{ width: '100%' }}>
                        <option value="Buy">매수</option>
                        <option value="Sell">매도</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm text-muted">자산군</label>
                    <select name="assetClass" value={formData.assetClass} onChange={handleChange} className="input" style={{ width: '100%' }}>
                        <option value="Domestic Stock">국내 주식</option>
                        <option value="US Stock">미국 주식</option>
                        <option value="Crypto">암호화폐</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm text-muted">티커 (종목코드)</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            name="ticker"
                            value={formData.ticker}
                            onChange={handleChange}
                            onBlur={handleTickerBlur}
                            placeholder="예: 005930.KS"
                            className="input"
                            required
                            style={{ width: '100%' }}
                        />
                        {!fetchingName && stockName && <div className="text-xs text-success" style={{ position: 'absolute', top: '100%', left: 0 }}>{stockName}</div>}
                    </div>
                </div>
                <div>
                    <label className="text-sm text-muted">가격</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="매수가" className="input" step="any" required style={{ width: '100%' }} />
                </div>
                <div>
                    <label className="text-sm text-muted">수량</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="수량" className="input" step="any" required style={{ width: '100%' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label className="text-sm text-muted">매매 사유 / 메모</label>
                    <textarea
                        name="reason"
                        value={formData.reason || ''}
                        onChange={handleChange}
                        placeholder="매수/매도 이유를 기록하세요..."
                        className="input"
                        style={{ minHeight: '60px', resize: 'vertical', width: '100%' }}
                    />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>기록하기</button>
                </div>
            </form>
        </div>
    );
}
