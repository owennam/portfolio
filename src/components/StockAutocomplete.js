'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Check } from 'lucide-react';

export default function StockAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = '주식명을 입력하세요 (예: 삼성전자)',
  useApi = false
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 쿼리 변경 시 자동완성
  useEffect(() => {
    const searchStocks = async () => {
      if (query.trim().length === 0) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/stocks/search?q=${encodeURIComponent(query)}${useApi ? '&useApi=true' : ''}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results || []);
          setIsOpen(data.results && data.results.length > 0);
        }
      } catch (error) {
        console.error('Autocomplete search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, useApi]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange?.(newValue);
    setSelectedIndex(-1);
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.name);
    onChange?.(suggestion.ticker);
    onSelect?.(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="input"
          style={{
            width: '100%',
            paddingLeft: '2.5rem',
            paddingRight: '2.5rem'
          }}
        />
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }}
        />
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          >
            <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.25rem)',
            left: 0,
            right: 0,
            maxHeight: '300px',
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.ticker}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: selectedIndex === index ? 'var(--primary-bg)' : 'transparent',
                borderBottom: index < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                  {suggestion.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {suggestion.ticker}
                </div>
              </div>
              {selectedIndex === index && (
                <Check size={18} style={{ color: 'var(--primary)' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
