'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StockAutocomplete from '@/components/StockAutocomplete';

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

    const { user } = useAuth(); // Get user from context

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/trades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, name: stockName }),
            });
            if (res.ok) {
                const newTrade = await res.json();
                onTradeAdded(newTrade);
                // Reset form (keep date/type/account/exchangeRate)
                setFormData(prev => ({ ...prev, ticker: '', price: '', quantity: '', fee: '', reason: '' }));
                setStockName('');
            } else {
                alert('저장 실패: ' + res.statusText);
            }
        } catch (error) {
            console.error('Failed to add trade', error);
            alert('저장 중 오류 발생');
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
        if (formData.category === '암호화폐' && !searchTicker.includes('-')) {
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
            <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                {/* Row 1: Basic Inputs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>날짜</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1d1d1d',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '100px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>계좌</label>
                        <select
                            name="account"
                            value={formData.account}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1d1d1d',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: 'white'
                            }}
                        >
                            <option value="일반">일반</option>
                            <option value="연금">연금</option>
                            <option value="ISA">ISA</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '100px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>구분</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1d1d1d',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: 'white'
                            }}
                        >
                            <option value="매수">매수</option>
                            <option value="매도">매도</option>
                            <option value="배당">배당</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '100px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>자산군</label>
                        <select
                            name="category" // Changed from assetClass
                            value={formData.category} // Changed to category
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1d1d1d',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: 'white'
                            }}
                        >
                            <option value="국내 주식">국내 주식</option>
                            <option value="해외 주식">해외 주식</option>
                            <option value="암호화폐">암호화폐</option>
                            <option value="현금">현금</option>
                        </select>
                    </div>
                    <div style={{ flex: 2, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>티커</label>
                        <StockAutocomplete
                            value={formData.ticker}
                            onChange={(val) => {
                                setFormData(prev => ({ ...prev, ticker: val }));
                                if (val) {
                                    setTimeout(() => handleTickerBlur(), 100);
                                }
                            }}
                            onSelect={(stock) => {
                                setFormData(prev => ({ ...prev, ticker: stock.ticker }));
                                setStockName(stock.name);
                            }}
                            placeholder="종목형/코드"
                            useApi={true}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1d1d1d',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: 'white'
                            }}
                        />
                        {!fetchingName && stockName && <div className="text-xs text-success" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '2px', whiteSpace: 'nowrap' }}>{stockName}</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>가격</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="매수가"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1d1d1d',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '100px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>수량</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            placeholder="수량"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1d1d1d',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '100px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>수수료</label>
                        <input
                            type="number"
                            name="fee"
                            value={formData.fee}
                            onChange={handleChange}
                            placeholder="0"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1d1d1d',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: 'white'
                            }}
                        />
                    </div>
                </div>

                {/* Row 2: Reason & Action */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>매매 사유 / 메모</label>
                        <textarea
                            name="reason"
                            value={formData.reason || ''}
                            onChange={handleChange}
                            placeholder="매수/매도 이유를 기록하세요"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1d1d1d',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: 'white',
                                height: '50px',
                                resize: 'none'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                height: '50px',
                                padding: '0 2rem',
                                marginBottom: '4px' // Align with textarea input part roughly
                            }}
                        >
                            기록하기
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
