import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PinnedPanel({ pinned, onOpen, onUnpin, onViewAll }) {
    return (_jsxs("aside", { className: "favs", "aria-label": "Pinned dashboards", children: [_jsxs("div", { className: "favs__head", children: [_jsxs("div", { className: "favs__label", children: [_jsx("span", { "aria-hidden": true, children: "\u2605" }), "Dashboards"] }), _jsx("button", { className: "favs__viewall", onClick: onViewAll, children: "View all" })] }), pinned.length === 0 ? (_jsxs("p", { className: "favs__empty", children: [_jsx("b", { children: "Pin a dashboard" }), "\u00A0\u2014 use the star on any card to keep your favourites in reach."] })) : (_jsx("div", { className: "favs__list", children: pinned.map((d) => (_jsxs("button", { type: "button", className: "fav-chip", onClick: () => onOpen(d), children: [_jsx("span", { className: "fav-chip__name", children: d.dashboard_name }), _jsx("span", { className: "fav-chip__star", "aria-label": "Unpin", role: "button", tabIndex: 0, onClick: (e) => { e.stopPropagation(); onUnpin(d); }, onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                onUnpin(d);
                            } }, children: "\u2605" })] }, d.dashboard_id))) }))] }));
}
