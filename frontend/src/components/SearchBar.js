import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
export function SearchBar({ value, onChange, suggestions, onSelect, loading, onClear }) {
    const inputRef = useRef(null);
    const [focused, setFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    useEffect(() => {
        const onKey = (e) => {
            const tag = (document.activeElement?.tagName || '').toLowerCase();
            const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            else if (e.key === '/' && !typing) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);
    const open = focused && (value.length > 0);
    const onKeyDown = (e) => {
        if (!open)
            return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        }
        if (e.key === 'Enter') {
            const d = suggestions[activeIndex] ?? suggestions[0];
            if (d) {
                e.preventDefault();
                onSelect(d);
            }
        }
        if (e.key === 'Escape') {
            e.target.blur();
        }
    };
    return (_jsxs("div", { className: "search", children: [_jsx("span", { className: "search__icon", "aria-hidden": true, children: "\uD83D\uDD0D" }), _jsx("input", { ref: inputRef, type: "text", placeholder: "Search dashboards, markets, tags\u2026", "aria-label": "Search dashboards", role: "combobox", "aria-expanded": open, "aria-controls": "search-suggestions", autoComplete: "off", value: value, onChange: (e) => { onChange(e.target.value); setActiveIndex(0); }, onFocus: () => setFocused(true), onBlur: () => setTimeout(() => setFocused(false), 150), onKeyDown: onKeyDown }), value ? (_jsx("button", { className: "search__clear", "aria-label": "Clear search", onClick: () => { onClear(); inputRef.current?.focus(); }, children: "\u00D7" })) : null, open && (_jsxs("div", { className: "suggest", id: "search-suggestions", role: "listbox", children: [loading && _jsx("div", { className: "sug", role: "option", "aria-selected": false, children: "Searching\u2026" }), !loading && suggestions.length === 0 && (_jsx("div", { className: "sug", role: "option", "aria-selected": false, children: "No results." })), suggestions.map((d, i) => (_jsx("button", { type: "button", className: `sug ${i === activeIndex ? 'active' : ''}`, role: "option", "aria-selected": i === activeIndex, onMouseDown: (e) => e.preventDefault(), onClick: () => onSelect(d), children: _jsxs("div", { children: [_jsx("div", { className: "sug__name", children: d.dashboard_name }), _jsxs("div", { className: "sug__meta", children: [d.platform, " \u00B7 ", d.category ?? '—', " \u00B7 ", d.market ?? 'Global'] })] }) }, d.dashboard_id)))] }))] }));
}
