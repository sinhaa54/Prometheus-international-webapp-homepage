import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * "Get access to a dashboard" modal.
 *
 * Two-step hierarchical layout: initially the three platform tiles
 * (ELVIS / T&C Global / Market Specific Solutions) occupy the full width.
 * Selecting one shifts the platform list into a narrow left rail and opens
 * a right pane listing that platform's dashboards. Selecting a dashboard
 * opens its access-request URL directly in a new tab.
 *
 * Each row links out to an external Office Forms / rm.pfizer.com URL that
 * has been server-side allowlisted (see backend `ALLOWED_ACCESS_REQUEST_HOSTS`).
 * The frontend performs a defensive second check via `isAccessUrlSafe` so a
 * bad row can never surface an unapproved redirect.
 */
import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
/** Display labels for platform buckets (mirrors homepage section naming). */
const PLATFORM_LABELS = {
    Market: 'Market Specific Solutions',
};
export function AccessRequestModal({ open, onClose, items, allowedHosts, onError }) {
    const [activePlatform, setActivePlatform] = useState(null);
    // Reset the selection whenever the modal is (re)opened.
    useEffect(() => {
        if (open)
            setActivePlatform(null);
    }, [open]);
    const safeItems = items.filter((it) => isAccessUrlSafe(it.request_url, allowedHosts));
    const platforms = Array.from(new Set(safeItems.map((it) => it.platform)));
    const dashboardsInPlatform = activePlatform
        ? safeItems.filter((it) => it.platform === activePlatform)
        : [];
    const onClick = (item) => (e) => {
        if (!isAccessUrlSafe(item.request_url, allowedHosts)) {
            e.preventDefault();
            onError('This access-request URL is not on the approved host allowlist.');
        }
    };
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Get access to a dashboard", eyebrow: "Request access", description: activePlatform === null
            ? 'Choose a platform to see the dashboards available for self-service access.'
            : 'Select a dashboard to open its request form.', className: "modal--wide", children: _jsx("div", { className: "modal__body", children: safeItems.length === 0 ? (_jsxs("p", { className: "access-note", role: "status", children: [_jsx(InfoIcon, {}), _jsx("span", { children: "No self-service access dashboards are available right now." })] })) : activePlatform === null ? (_jsx("ul", { className: "access-tiles", "aria-label": "Dashboard platforms", children: platforms.map((p) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "access-tile", onClick: () => setActivePlatform(p), children: [_jsx("span", { className: "access-tile__ic", "aria-hidden": "true", children: _jsx(ItemIcon, { iconKey: safeItems.find((it) => it.platform === p)?.icon_key ?? '' }) }), _jsx("span", { className: "access-tile__name", children: PLATFORM_LABELS[p] ?? p }), _jsxs("span", { className: "access-tile__count", children: [safeItems.filter((it) => it.platform === p).length, " dashboards"] })] }) }, p))) })) : (_jsxs("div", { className: "access-columns", children: [_jsx("ul", { className: "access-platforms", "aria-label": "Dashboard platforms", children: platforms.map((p) => (_jsx("li", { children: _jsxs("button", { type: "button", className: `access-platform ${activePlatform === p ? 'on' : ''}`, onClick: () => setActivePlatform(p), "aria-pressed": activePlatform === p, children: [_jsx("span", { className: "access-platform__name", children: PLATFORM_LABELS[p] ?? p }), _jsx("span", { className: "access-platform__count", children: safeItems.filter((it) => it.platform === p).length })] }) }, p))) }), _jsx("div", { className: "access-detail", children: _jsx("ul", { className: "access-list", "aria-label": `Dashboards in ${PLATFORM_LABELS[activePlatform] ?? activePlatform}`, children: dashboardsInPlatform.map((item) => (_jsx("li", { children: _jsxs("a", { className: "access-item", href: item.request_url, target: "_blank", rel: "noopener noreferrer", onClick: onClick(item), children: [_jsx("span", { className: "access-item__ic", "aria-hidden": "true", children: _jsx(ItemIcon, { iconKey: item.icon_key }) }), _jsxs("span", { className: "access-item__txt", children: [_jsx("span", { className: "access-item__name", children: item.name }), _jsx("span", { className: "access-item__meta", children: subline(item) })] }), _jsx("span", { className: "access-item__arrow", "aria-hidden": "true", children: _jsx(ArrowUpRightIcon, {}) })] }) }, item.name))) }) })] })) }) }));
}
/** Only HTTPS URLs whose exact hostname is in `allowedHosts`. */
export function isAccessUrlSafe(url, allowedHosts) {
    if (!url)
        return false;
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        return false;
    }
    if (parsed.protocol !== 'https:')
        return false;
    const host = parsed.hostname.toLowerCase();
    return allowedHosts.map((h) => h.toLowerCase()).includes(host);
}
/** Prefer server-provided `meta`; fall back to "category". */
function subline(item) {
    if (item.meta)
        return item.meta;
    return item.category ?? '';
}
// ---------- inline SVGs (mirrors the mockup) ----------
function ItemIcon({ iconKey }) {
    if (iconKey === 'pyramid') {
        return (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "m7.5 4.3 9 5.2v9.5l-9-5.2z" }), _jsx("path", { d: "m16.5 9.5-9-5.2M3 7.5l4.5 2.6M3 7.5v9l4.5 2.6V9.9M3 7.5 12 2.3l4.5 2.6" })] }));
    }
    if (iconKey === 'grid') {
        return (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] }));
    }
    // default: bar chart
    return (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M3 3v18h18" }), _jsx("rect", { x: "7", y: "12", width: "3", height: "6" }), _jsx("rect", { x: "12", y: "8", width: "3", height: "10" }), _jsx("rect", { x: "17", y: "5", width: "3", height: "13" })] }));
}
function ArrowUpRightIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M7 17 17 7M8 7h9v9" }) }));
}
function InfoIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 11v5M12 7.5h.01" })] }));
}
