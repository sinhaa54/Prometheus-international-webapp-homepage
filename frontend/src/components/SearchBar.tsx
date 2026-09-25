import { useEffect, useRef, useState } from 'react';
import type { Dashboard } from '../types/api';

interface Props {
  value: string;
  onChange: (next: string) => void;
  suggestions: Dashboard[];
  onSelect: (d: Dashboard) => void;
  loading?: boolean;
  onClear: () => void;
}

export function SearchBar({ value, onChange, suggestions, onSelect, loading, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const open = focused && (value.length > 0);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') {
      const d = suggestions[activeIndex] ?? suggestions[0];
      if (d) { e.preventDefault(); onSelect(d); }
    }
    if (e.key === 'Escape') { (e.target as HTMLInputElement).blur(); }
  };

  return (
    <div className="search">
      <span className="search__icon" aria-hidden>🔍</span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search dashboards, markets, tags…"
        aria-label="Search dashboards"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-suggestions"
        autoComplete="off"
        value={value}
        onChange={(e) => { onChange(e.target.value); setActiveIndex(0); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={onKeyDown}
      />
      {value ? (
        <button className="search__clear" aria-label="Clear search" onClick={() => { onClear(); inputRef.current?.focus(); }}>×</button>
      ) : null}
      {open && (
        <div className="suggest" id="search-suggestions" role="listbox">
          {loading && <div className="sug" role="option" aria-selected={false}>Searching…</div>}
          {!loading && suggestions.length === 0 && (
            <div className="sug" role="option" aria-selected={false}>No results.</div>
          )}
          {suggestions.map((d, i) => (
            <button
              type="button"
              key={d.dashboard_id}
              className={`sug ${i === activeIndex ? 'active' : ''}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(d)}
            >
              <div>
                <div className="sug__name">{d.dashboard_name}</div>
                <div className="sug__meta">{d.platform} · {d.category ?? '—'} · {d.market ?? 'Global'}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
