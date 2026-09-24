import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { DashboardCard } from './DashboardCard';
export function PlatformSection({ platform, dashboards, isPinned, onOpen, onTogglePin }) {
    const [collapsed, setCollapsed] = useState(false);
    const style = platform.accent ? { '--accent': platform.accent } : undefined;
    return (_jsxs("section", { className: `section ${collapsed ? 'collapsed' : ''}`, style: style, "aria-label": platform.label, children: [_jsxs("div", { className: "section__head", role: "button", tabIndex: 0, "aria-expanded": !collapsed, onClick: () => setCollapsed((c) => !c), onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCollapsed((c) => !c);
                } }, children: [_jsx("div", { className: "section__icon", "aria-hidden": true, children: platform.label.charAt(0) }), _jsxs("div", { className: "section__txt", children: [_jsx("h2", { className: "section__title", children: platform.label }), platform.blurb && _jsx("span", { className: "section__sub", children: platform.blurb })] }), _jsxs("span", { className: "section__count", children: [dashboards.length, " dashboards"] }), _jsx("span", { className: "section__toggle", "aria-hidden": true, children: collapsed ? '▸' : '▾' })] }), dashboards.length > 0 && (_jsx("div", { className: "grid", role: "list", children: dashboards.map((d) => (_jsx("div", { role: "listitem", children: _jsx(DashboardCard, { dashboard: d, pinned: isPinned(d.dashboard_id), onOpen: onOpen, onTogglePin: onTogglePin, accentColor: platform.accent ?? undefined }) }, d.dashboard_id))) }))] }));
}
