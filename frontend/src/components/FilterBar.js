import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function orderCategories(categories, order) {
    if (!categories)
        return [];
    if (!order || order.length === 0)
        return categories;
    const byValue = new Map(categories.map((c) => [c.value, c]));
    const seen = new Set();
    const out = [];
    for (const name of order) {
        const hit = byValue.get(name);
        if (hit) {
            out.push(hit);
            seen.add(name);
        }
    }
    for (const c of categories) {
        if (!seen.has(c.value))
            out.push(c);
    }
    return out;
}
export function FilterBar({ available, value, onChange, pinnedCount, categoryAccent, categoryOrder }) {
    const orderedCategories = orderCategories(available?.categories, categoryOrder);
    return (_jsxs("div", { className: "filterbar", "aria-label": "Dashboard filters", children: [_jsxs("div", { className: "fgroup", children: [_jsx("span", { className: "frow__label", children: "Platform" }), _jsx("button", { type: "button", className: `fchip ${value.platform === null && !value.pinnedOnly ? 'on' : ''}`, onClick: () => onChange({ ...value, platform: null, pinnedOnly: false }), children: "All" }), available?.platforms.map((p) => (_jsxs("button", { type: "button", className: `fchip ${value.platform === p.name ? 'on' : ''}`, onClick: () => onChange({ ...value, platform: p.name, pinnedOnly: false }), title: p.blurb ?? undefined, children: [p.accent && _jsx("span", { className: "fchip__sw", style: { background: p.accent }, "aria-hidden": true }), p.label, _jsx("span", { className: "fchip__c", children: p.dashboard_count })] }, p.name))), _jsxs("button", { type: "button", className: `fchip ${value.pinnedOnly ? 'on' : ''}`, onClick: () => onChange({ ...value, pinnedOnly: !value.pinnedOnly }), "aria-pressed": value.pinnedOnly, children: ["\u2605 Pinned", _jsx("span", { className: "fchip__c", children: pinnedCount })] })] }), _jsxs("div", { className: "fgroup", children: [_jsx("span", { className: "frow__label", children: "Category" }), _jsx("button", { type: "button", className: `fchip ${value.category === null ? 'on' : ''}`, onClick: () => onChange({ ...value, category: null }), children: "All" }), orderedCategories.map((c) => (_jsxs("button", { type: "button", className: `fchip ${value.category === c.value ? 'on' : ''}`, onClick: () => onChange({ ...value, category: c.value }), children: [categoryAccent && (_jsx("span", { className: "fchip__sw", style: { background: categoryAccent }, "aria-hidden": true })), c.label, _jsx("span", { className: "fchip__c", children: c.count })] }, c.value)))] }), _jsxs("div", { className: "fgroup", children: [_jsx("span", { className: "frow__label", children: "Market" }), _jsx("button", { type: "button", className: `fchip ${value.market === null ? 'on' : ''}`, onClick: () => onChange({ ...value, market: null }), children: "All" }), available?.markets.map((m) => (_jsxs("button", { type: "button", className: `fchip ${value.market === m.value ? 'on' : ''}`, onClick: () => onChange({ ...value, market: m.value }), children: [m.label, _jsx("span", { className: "fchip__c", children: m.count })] }, m.value)))] })] }));
}
