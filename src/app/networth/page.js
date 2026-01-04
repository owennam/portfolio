
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function NetWorthPage() {
    const [assets, setAssets] = useState([]);
    const [liabilities, setLiabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Form States
    const [assetForm, setAssetForm] = useState({ category: 'Real Estate', name: '', value: '', memo: '' });
    const [liabilityForm, setLiabilityForm] = useState({ name: '', amount: '', interestRate: '', maturityDate: '' });
    const [editingLiability, setEditingLiability] = useState(null); // ID of liability being edited
    const [editForm, setEditForm] = useState({ name: '', amount: '', interestRate: '', maturityDate: '' });
    const [editingAsset, setEditingAsset] = useState(null); // ID of asset being edited
    const [assetEditForm, setAssetEditForm] = useState({ category: 'Real Estate', name: '', value: '', memo: '' });

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [resAssets, resLiabilities] = await Promise.all([
                fetch('/api/assets'),
                fetch('/api/liabilities')
            ]);
            setAssets(await resAssets.json());
            setLiabilities(await resLiabilities.json());
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleAssetSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(assetForm)
            });
            if (res.ok) {
                setAssetForm({ category: 'Real Estate', name: '', value: '', memo: '' });
                fetchAll();
            } else {
                alert('추가 실패: ' + res.statusText);
            }
        } catch (error) {
            console.error('Failed to add asset', error);
        }
    };

    const handleLiabilitySubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/liabilities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(liabilityForm)
            });
            if (res.ok) {
                setLiabilityForm({ name: '', amount: '', interestRate: '', maturityDate: '' });
                fetchAll();
            } else {
                alert('추가 실패: ' + res.statusText);
            }
        } catch (error) {
            console.error('Failed to add liability', error);
        }
    };

    const handleDeleteAsset = async (id) => {
        if (!confirm('삭제하시겠습니까?')) return;
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        const token = await user.getIdToken();
        await fetch(`/api/assets?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchAll();
    };

    const handleEditAsset = (item) => {
        setEditingAsset(item.id);
        setAssetEditForm({
            category: item.category,
            name: item.name,
            value: item.value,
            memo: item.memo || ''
        });
    };

    const handleUpdateAsset = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/assets?id=${editingAsset}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(assetEditForm)
            });
            if (res.ok) {
                setEditingAsset(null);
                setAssetEditForm({ category: 'Real Estate', name: '', value: '', memo: '' });
                fetchAll();
            } else {
                alert('수정 실패: ' + res.statusText);
            }
        } catch (error) {
            console.error('Failed to update asset', error);
        }
    };

    const handleCancelAssetEdit = () => {
        setEditingAsset(null);
        setAssetEditForm({ category: 'Real Estate', name: '', value: '', memo: '' });
    };

    const handleDeleteLiability = async (id) => {
        if (!confirm('삭제하시겠습니까?')) return;
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        const token = await user.getIdToken();
        await fetch(`/api/liabilities?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchAll();
    };

    const handleEditLiability = (item) => {
        setEditingLiability(item.id);
        setEditForm({
            name: item.name,
            amount: item.amount,
            interestRate: item.interestRate,
            maturityDate: item.maturityDate || ''
        });
    };

    const handleUpdateLiability = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/liabilities?id=${editingLiability}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                setEditingLiability(null);
                setEditForm({ name: '', amount: '', interestRate: '', maturityDate: '' });
                fetchAll();
            } else {
                alert('수정 실패: ' + res.statusText);
            }
        } catch (error) {
            console.error('Failed to update liability', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingLiability(null);
        setEditForm({ name: '', amount: '', interestRate: '', maturityDate: '' });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>자산/부채 관리</h1>
                    <p>부동산, 현금, 대출 등을 관리합니다.</p>
                </div>
                <Link href="/" className="btn btn-outline">메인으로</Link>
            </header>

            <div className="grid-2">
                {/* Assets Section */}
                <div>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3>자산 추가 (부동산/현금)</h3>
                        <form onSubmit={handleAssetSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="grid-2">
                                <div>
                                    <label className="text-sm text-muted">분류</label>
                                    <select
                                        value={assetForm.category}
                                        onChange={e => setAssetForm({ ...assetForm, category: e.target.value })}
                                        className="input"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Real Estate">부동산</option>
                                        <option value="Cash">현금/예금</option>
                                        <option value="Insurance">보험</option>
                                        <option value="Other">기타</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-muted">자산명</label>
                                    <input
                                        type="text"
                                        value={assetForm.name}
                                        onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                                        placeholder="예: 서초 트라팰리스"
                                        className="input"
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-muted">평가액 (원)</label>
                                <input
                                    type="number"
                                    value={assetForm.value}
                                    onChange={e => setAssetForm({ ...assetForm, value: e.target.value })}
                                    placeholder="0"
                                    className="input"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-muted">메모</label>
                                <input
                                    type="text"
                                    value={assetForm.memo}
                                    onChange={e => setAssetForm({ ...assetForm, memo: e.target.value })}
                                    placeholder="메모 (선택)"
                                    className="input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">추가하기</button>
                        </form>
                    </div>

                    <div className="card">
                        <h3>자산 목록</h3>
                        <div style={{ marginTop: '1rem' }}>
                            {assets.map(item => (
                                <div key={item.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                    {editingAsset === item.id ? (
                                        /* Edit Mode */
                                        <form onSubmit={handleUpdateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div className="grid-2" style={{ gap: '0.5rem' }}>
                                                <select
                                                    value={assetEditForm.category}
                                                    onChange={e => setAssetEditForm({ ...assetEditForm, category: e.target.value })}
                                                    className="input"
                                                    style={{ width: '100%' }}
                                                >
                                                    <option value="Real Estate">부동산</option>
                                                    <option value="Cash">현금/예금</option>
                                                    <option value="Insurance">보험</option>
                                                    <option value="Other">기타</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={assetEditForm.name}
                                                    onChange={e => setAssetEditForm({ ...assetEditForm, name: e.target.value })}
                                                    className="input"
                                                    placeholder="자산명"
                                                    required
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                            <input
                                                type="number"
                                                value={assetEditForm.value}
                                                onChange={e => setAssetEditForm({ ...assetEditForm, value: e.target.value })}
                                                className="input"
                                                placeholder="평가액"
                                                required
                                                style={{ width: '100%' }}
                                            />
                                            <input
                                                type="text"
                                                value={assetEditForm.memo}
                                                onChange={e => setAssetEditForm({ ...assetEditForm, memo: e.target.value })}
                                                className="input"
                                                placeholder="메모 (선택)"
                                                style={{ width: '100%' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>저장</button>
                                                <button type="button" onClick={handleCancelAssetEdit} className="btn btn-outline" style={{ flex: 1 }}>취소</button>
                                            </div>
                                        </form>
                                    ) : (
                                        /* View Mode */
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                                <div className="text-sm text-muted">{item.category} {item.memo && `• ${item.memo}`}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold' }}>{formatCurrency(item.value)}</div>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleEditAsset(item)}
                                                        className="text-xs"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAsset(item.id)}
                                                        className="text-xs"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {assets.length === 0 && <p className="text-muted text-center" style={{ padding: '1rem' }}>등록된 자산이 없습니다.</p>}
                        </div>
                    </div>
                </div>

                {/* Liabilities Section */}
                <div>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3>부채 추가 (대출)</h3>
                        <form onSubmit={handleLiabilitySubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="text-sm text-muted">대출명</label>
                                <input
                                    type="text"
                                    value={liabilityForm.name}
                                    onChange={e => setLiabilityForm({ ...liabilityForm, name: e.target.value })}
                                    placeholder="예: 주택담보대출"
                                    className="input"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="grid-2">
                                <div>
                                    <label className="text-sm text-muted">대출금액 (원)</label>
                                    <input
                                        type="number"
                                        value={liabilityForm.amount}
                                        onChange={e => setLiabilityForm({ ...liabilityForm, amount: e.target.value })}
                                        placeholder="0"
                                        className="input"
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted">금리 (%)</label>
                                    <input
                                        type="number"
                                        value={liabilityForm.interestRate}
                                        onChange={e => setLiabilityForm({ ...liabilityForm, interestRate: e.target.value })}
                                        placeholder="3.5"
                                        className="input"
                                        step="0.01"
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-muted">만기일</label>
                                <input
                                    type="date"
                                    value={liabilityForm.maturityDate}
                                    onChange={e => setLiabilityForm({ ...liabilityForm, maturityDate: e.target.value })}
                                    className="input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#ef4444' }}>추가하기</button>
                        </form>
                    </div>

                    <div className="card">
                        <h3>부채 목록</h3>
                        <div style={{ marginTop: '1rem' }}>
                            {liabilities.map(item => (
                                <div key={item.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                    {editingLiability === item.id ? (
                                        /* Edit Mode */
                                        <form onSubmit={handleUpdateLiability} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                className="input"
                                                placeholder="대출명"
                                                required
                                                style={{ width: '100%' }}
                                            />
                                            <div className="grid-2" style={{ gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    value={editForm.amount}
                                                    onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                                    className="input"
                                                    placeholder="금액"
                                                    required
                                                    style={{ width: '100%' }}
                                                />
                                                <input
                                                    type="number"
                                                    value={editForm.interestRate}
                                                    onChange={e => setEditForm({ ...editForm, interestRate: e.target.value })}
                                                    className="input"
                                                    placeholder="금리(%)"
                                                    step="0.01"
                                                    required
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                            <input
                                                type="date"
                                                value={editForm.maturityDate}
                                                onChange={e => setEditForm({ ...editForm, maturityDate: e.target.value })}
                                                className="input"
                                                style={{ width: '100%' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>저장</button>
                                                <button type="button" onClick={handleCancelEdit} className="btn btn-outline" style={{ flex: 1 }}>취소</button>
                                            </div>
                                        </form>
                                    ) : (
                                        /* View Mode */
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                                <div className="text-sm text-muted">{item.interestRate}% • {item.maturityDate ? `${item.maturityDate} 만기` : '만기 없음'}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(item.amount)}</div>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleEditLiability(item)}
                                                        className="text-xs"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLiability(item.id)}
                                                        className="text-xs"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {liabilities.length === 0 && <p className="text-muted text-center" style={{ padding: '1rem' }}>등록된 부채가 없습니다.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
