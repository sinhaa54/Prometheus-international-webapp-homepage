import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * A dashboard tile. Hovering (or keyboard-focusing) reveals a tooltip
 * containing the description + dashboard owner, mirroring the v2_new mockup.
 *
 * The tooltip is rendered inline inside the card and revealed via CSS
 * (`.card:hover .tip`, `.card:focus-within .tip`). This keeps a11y correct
 * for keyboard users and avoids the complexity of a portal.
 */
export function DashboardCard({ dashboard, pinned, onOpen, onTogglePin, accentColor }) {
    const style = accentColor ? { '--accent': accentColor } : undefined;
    const hasTooltip = Boolean(dashboard.dashboard_description || dashboard.owner_name);
    return (_jsxs("div", { className: "card", style: style, role: "button", tabIndex: 0, "aria-label": `Open ${dashboard.dashboard_name} in Tableau`, onClick: () => onOpen(dashboard), onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(dashboard);
            }
        }, children: [_jsx("h3", { className: "card__name", children: dashboard.dashboard_name }), _jsx("button", { type: "button", className: `fav ${pinned ? 'on' : ''}`, "aria-label": pinned ? 'Unpin dashboard' : 'Pin dashboard', "aria-pressed": pinned, onClick: (e) => { e.stopPropagation(); onTogglePin(dashboard); }, children: pinned ? '\u2605' : '\u2606' }), _jsxs("div", { className: "card__row", children: [dashboard.category && _jsx("span", { className: "chip", children: dashboard.category })] }), hasTooltip && (_jsxs("div", { className: "tip", role: "tooltip", children: [dashboard.dashboard_description && (_jsx("div", { className: "tip__desc", children: dashboard.dashboard_description })), dashboard.owner_name && (_jsxs("div", { className: "tip__owner", children: [_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 20c0-4 3.6-6 8-6s8 2 8 6" })] }), _jsx("span", { className: "tip__owner-label", children: "Owner" }), _jsx("span", { className: "tip__owner-name", children: dashboard.owner_name })] }))] }))] }));
}
