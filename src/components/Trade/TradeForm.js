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
        fee: '',
        reason: '',
        exchangeRate: 1400,
        account: 'General'
    });
    const [stockName, setStockName] = useState('');
    const [fetchingName, setFetchingName] = useState(false);
    const [currentRate, setCurrentRate] = useState(1400); // Default fallback

    // Fetch Exchange Rate on Mount
    useState(() => {
        const fetchRate = async () => {
            try {
                const res = await fetch('/api/prices?tickers=KRW=X');
                const data = await res.json();
                if (data && data[0] && data[0].price) {
                    setCurrentRate(data[0].price);
                    setFormData(prev => ({ ...prev, exchangeRate: data[0].price }));
                }
            } catch (error) {
                console.error('Failed to fetch exchange rate', error);
            }
        };
        fetchRate();
    }, []);

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
                // Reset form (keep date/type/account/exchangeRate)
                setFormData(prev => ({ ...prev, ticker: '', price: '', quantity: '', fee: '', reason: '' }));
                setStockName('');
            }
        } catch (error) {
            console.error('Failed to add trade', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate fee if price/quantity/assetClass/type/account changes
            if (['price', 'quantity', 'assetClass', 'type', 'account'].includes(name)) {
                const price = parseFloat(updated.price) || 0;
                const qty = parseFloat(updated.quantity) || 0;
                const amount = price * qty;

                if (amount > 0) {
                    let rate = 0;

                    if (updated.assetClass === 'Crypto') {
                        // Binance: 0.1%
                        rate = 0.001;
                    } else if (updated.assetClass === 'US Stock') {
                        // Samsung Securities (US): 0.07% (Event rate assumption)
                        rate = 0.0007;
                    } else if (updated.assetClass === 'Domestic Stock') {
                        if (updated.account === 'General') {
                            // Samsung Securities (Domestic)
                            // Fee: ~0.0036396%, Tax (Sell only): 0.18%
                            const baseFee = 0.000036396;
                            const tax = updated.type === 'Sell' ? 0.0018 : 0;
                            rate = baseFee + tax;
                        } else {
                            // Pension/IRP (Mirae Asset): ~0.0036396% (ETF)
                            rate = 0.000036396;
                        }
                    }

                    if (['US Stock', 'Crypto'].includes(updated.assetClass)) {
                        updated.fee = (amount * rate).toFixed(2);
                    } else {
                        updated.fee = Math.floor(amount * rate);
                    }
                }
            }
            return updated;
        });
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
            <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: '0 0 140px' }}>
                    <label className="text-sm text-muted">날짜</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" required style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '0 0 130px' }}>
                    <label className="text-sm text-muted">계좌</label>
                    <select name="account" value={formData.account} onChange={handleChange} className="input" style={{ width: '100%' }}>
                        <option value="General">일반</option>
                        <option value="Pension">연금저축</option>
                        <option value="IRP">IRP</option>
                    </select>
                </div>
                <div style={{ flex: '0 0 80px' }}>
                    <label className="text-sm text-muted">구분</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="input" style={{ width: '100%' }}>
                        <option value="Buy">매수</option>
                        <option value="Sell">매도</option>
                    </select>
                </div>
                <div style={{ flex: '0 0 120px' }}>
                    <label className="text-sm text-muted">자산군</label>
                    <select name="assetClass" value={formData.assetClass} onChange={handleChange} className="input" style={{ width: '100%' }}>
                        <option value="Domestic Stock">국내 주식</option>
                        <option value="US Stock">미국 주식</option>
                        <option value="Crypto">암호화폐</option>
                    </select>
                </div>
                <div style={{ flex: '0 0 140px' }}>
                    <label className="text-sm text-muted">티커</label>
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
                <div style={{ flex: '1 1 150px' }}>
                    <label className="text-sm text-muted">가격</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="매수가" className="input" step="any" required style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '0 0 100px' }}>
                    <label className="text-sm text-muted">수량</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="수량" className="input" step="any" required style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '0 0 100px' }}>
                    <label className="text-sm text-muted">수수료</label>
                    <input type="number" name="fee" value={formData.fee} onChange={handleChange} placeholder="0" className="input" step="any" style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 100%' }}>
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
                <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'center' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', paddingLeft: '3rem', paddingRight: '3rem' }}>기록하기</button>
                </div>
            </form>
        </div>
    );
}
