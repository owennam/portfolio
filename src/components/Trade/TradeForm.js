'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StockAutocomplete from '@/components/StockAutocomplete';
import { getKoreanNameByTicker } from '@/lib/koreanStocks';

export default function TradeForm({ onTradeAdded }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: '매수',
        category: '국내 주식',
        ticker: '',
        price: '',
        quantity: '',
        fee: '',
        reason: '',
        exchangeRate: 1400,
        account: '일반'
    });
    const [stockName, setStockName] = useState('');
    const [fetchingName, setFetchingName] = useState(false);
    const [currentRate, setCurrentRate] = useState(1400); // Default fallback
    const [searchQuery, setSearchQuery] = useState(''); // Separate state for search input

    // Fetch Exchange Rate on Mount
    useEffect(() => {
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
            // Map Korean UI values back to English system values
            const payload = {
                ...formData,
                type: formData.type === '매수' ? 'Buy' : 'Sell',
                account: formData.account === '일반' ? 'General' : formData.account === '연금' ? 'Pension' : 'IRP',
                category: formData.category === '국내 주식' ? 'Domestic Stock' : formData.category === '해외 주식' ? 'US Stock' : 'Crypto', // Map category
                // assetClass is mapped from category
                assetClass: formData.category === '국내 주식' ? 'Domestic Stock' : formData.category === '해외 주식' ? 'US Stock' : 'Crypto',
                name: stockName
            };

            const res = await fetch('/api/trades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const newTrade = await res.json();
                onTradeAdded(newTrade);
                // Reset form (keep date/type/account/exchangeRate)
                setFormData(prev => ({ ...prev, ticker: '', price: '', quantity: '', fee: '', reason: '' }));
                setStockName('');
                setSearchQuery('');
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

            // Auto-calculate fee if price/quantity/category/type/account changes
            if (['price', 'quantity', 'category', 'type', 'account'].includes(name)) {
                const price = parseFloat(updated.price) || 0;
                const qty = parseFloat(updated.quantity) || 0;
                const amount = price * qty;

                if (amount > 0) {
                    let rate = 0;

                    if (updated.category === '암호화폐') {
                        // Binance: 0.1%
                        rate = 0.001;
                    } else if (updated.category === '해외 주식') {
                        // Samsung Securities (US): 0.07% (Event rate assumption)
                        rate = 0.0007;
                    } else if (updated.category === '국내 주식') {
                        if (updated.account === '일반') {
                            // Samsung Securities (Domestic)
                            // Fee: ~0.0036396%, Tax (Sell only): 0.18%
                            const baseFee = 0.000036396;
                            const tax = updated.type === '매도' ? 0.0018 : 0; // Check for '매도' instead of 'Sell'
                            rate = baseFee + tax;
                        } else {
                            // Pension/IRP (Mirae Asset): ~0.0036396% (ETF)
                            rate = 0.000036396;
                        }
                    }

                    if (['해외 주식', '암호화폐'].includes(updated.category)) {
                        updated.fee = (amount * rate).toFixed(2);
                    } else {
                        updated.fee = Math.floor(amount * rate);
                    }
                }
            }
            return updated;
        });
    };

    const handleTickerBlur = async (tickerArg) => {
        const currentTicker = tickerArg !== undefined ? tickerArg : formData.ticker;
        if (!currentTicker) return;

        let searchTicker = currentTicker;
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
                // Fallback to local Korean stock map
                const koreanName = getKoreanNameByTicker(searchTicker);
                if (koreanName) {
                    setStockName(koreanName);
                } else {
                    setStockName('종목을 찾을 수 없음');
                }
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
                            <option value="IRP">IRP</option>
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
                        </select>
                    </div>
                    <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>티커</label>
                        <StockAutocomplete
                            value={searchQuery || formData.ticker}
                            onChange={(val) => {
                                setSearchQuery(val);
                                // Clear existing ticker and stock name when user starts typing
                                if (formData.ticker) {
                                    setFormData(prev => ({ ...prev, ticker: '' }));
                                }
                                if (stockName) setStockName('');
                            }}
                            onSelect={(stock) => {
                                setSearchQuery('');
                                setFormData(prev => ({ ...prev, ticker: stock.ticker }));
                                setStockName(stock.name);
                                // Fetch price info for the selected stock
                                setTimeout(() => handleTickerBlur(stock.ticker), 100);
                            }}
                            placeholder="종목명/티커 (예: 삼성전자, AAPL)"
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
                        {!fetchingName && stockName && formData.ticker && <div className="text-xs text-success" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '2px', whiteSpace: 'nowrap' }}>{stockName}</div>}
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
