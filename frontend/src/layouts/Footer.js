import { Fragment as _Fragment, jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
function fmtDate(iso) {
    if (!iso)
        return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }
    catch {
        return '—';
    }
}
export function Footer({ metadata }) {
    return (_jsx("footer", { role: "contentinfo", children: _jsx("div", { className: "foot__meta", children: metadata ? (_jsxs(_Fragment, { children: [metadata.active_dashboard_count, " active dashboards \u00B7", ' ', metadata.platform_count, " platforms \u00B7", ' ', metadata.market_count, " markets \u00B7", ' ', "source refreshed ", fmtDate(metadata.source_refreshed_at), " \u00B7", ' ', "v", metadata.app_version] })) : ('Loading portal metadata…') }) }));
}
