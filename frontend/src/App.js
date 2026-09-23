import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EmptyState } from './components/EmptyState';
import { FilterBar } from './components/FilterBar';
import { LoadingSkeletonGrid } from './components/LoadingSkeleton';
import { PinnedPanel } from './components/PinnedPanel';
import { PlatformSection } from './components/PlatformSection';
import { SearchBar } from './components/SearchBar';
import { ToastView, useToast } from './components/Toast';
import { getAccessCatalog } from './api/endpoints';
import { useDashboards, useMetadata } from './features/dashboards/useDashboards';
import { usePinnedDashboards } from './features/favourites/usePinnedDashboards';
import { AccessRequestModal } from './features/submissions/AccessRequestModal';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { Footer } from './layouts/Footer';
import { Header } from './layouts/Header';
import { openTableauDashboard } from './services/tableau';
import { homepageGreeting } from './utils/greeting';
const INITIAL_FILTERS = { platform: null, category: null, market: null, pinnedOnly: false };
export default function App() {
    // ---- data ----
    const { data: metadata } = useMetadata();
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const search = useDebouncedValue(searchInput, 220);
    const params = useMemo(() => ({
        search: search || undefined,
        platform: filters.platform ?? undefined,
        category: filters.category ?? undefined,
        market: filters.market ?? undefined,
        page: 1,
        page_size: 500,
        sort_by: 'display_order',
        sort_direction: 'asc',
    }), [search, filters.platform, filters.category, filters.market]);
    const { data, loading, error } = useDashboards(params);
    // Suggestions use the same debounced query but only when user is typing something.
    const suggestionParams = useMemo(() => ({
        search: search || undefined,
        page: 1,
        page_size: 8,
        sort_by: 'name',
        sort_direction: 'asc',
    }), [search]);
    const { data: sugData, loading: sugLoading } = useDashboards(suggestionParams);
    // ---- pinned dashboards ----
    const validIds = useMemo(() => new Set((data?.items ?? []).map((d) => d.dashboard_id)), [data?.items]);
    const { pinnedIds, isPinned, toggle, isStorageAvailable } = usePinnedDashboards(validIds);
    useEffect(() => {
        if (!isStorageAvailable) {
            // eslint-disable-next-line no-console
            console.info('localStorage unavailable - pinned dashboards will not persist across sessions.');
        }
    }, [isStorageAvailable]);
    // ---- toast & modals ----
    const { toast, show } = useToast();
    const [openAccess, setOpenAccess] = useState(false);
    // ---- redirect handler ----
    const onOpenDashboard = (d) => {
        if (!metadata) {
            show('Portal metadata is still loading — please try again in a moment.', 'error');
            return;
        }
        const res = openTableauDashboard(d.tableau_url, {
            allowedHosts: metadata.tableau_allowed_hosts,
            openInNewTab: metadata.tableau_open_in_new_tab,
        });
        if (!res.ok)
            show(res.error ?? 'Unable to open this dashboard.', 'error');
        else
            show(`Opening ${d.dashboard_name} in Tableau…`);
    };
    // ---- filtering & grouping ----
    const items = data?.items ?? [];
    const platforms = data?.available_filters.platforms ?? [];
    const visibleItems = filters.pinnedOnly
        ? items.filter((d) => pinnedIds.includes(d.dashboard_id))
        : items;
    // Preserve platform display order (from metadata), then dashboard display_order.
    const grouped = useMemo(() => {
        const byName = new Map();
        for (const d of visibleItems) {
            const list = byName.get(d.platform) ?? [];
            list.push(d);
            byName.set(d.platform, list);
        }
        // Sort each bucket by display_order (repository already sorts, but keep stable).
        for (const list of byName.values())
            list.sort((a, b) => a.display_order - b.display_order);
        return platforms
            .map((p) => ({ platform: p, dashboards: byName.get(p.name) ?? [] }))
            .filter((g) => g.dashboards.length > 0);
    }, [visibleItems, platforms]);
    const pinnedDashboards = useMemo(() => items.filter((d) => pinnedIds.includes(d.dashboard_id)), [items, pinnedIds]);
    const resetFilters = () => { setFilters(INITIAL_FILTERS); setSearchInput(''); };
    const greeting = homepageGreeting();
    // ---- access-request catalog (loaded once) ----
    const [accessCatalog, setAccessCatalog] = useState(null);
    useEffect(() => {
        const ctrl = new AbortController();
        getAccessCatalog(ctrl.signal)
            .then(setAccessCatalog)
            .catch(() => { });
        return () => ctrl.abort();
    }, []);
    return (_jsxs(ErrorBoundary, { children: [_jsx(Header, { onOpenAccess: () => setOpenAccess(true), contactMailto: metadata?.contact_mailto ?? 'mailto:analytics@pfizer.com', feedbackUrl: metadata?.feedback_url ?? '', greeting: greeting, searchSlot: _jsx(SearchBar, { value: searchInput, onChange: setSearchInput, suggestions: sugData?.items ?? [], loading: sugLoading, onSelect: (d) => { setSearchInput(''); onOpenDashboard(d); }, onClear: () => setSearchInput('') }), pinnedSlot: _jsx(PinnedPanel, { pinned: pinnedDashboards, onOpen: onOpenDashboard, onUnpin: (d) => toggle(d.dashboard_id), onViewAll: () => setFilters({ ...INITIAL_FILTERS, pinnedOnly: true }) }) }), _jsxs("main", { id: "main-content", children: [_jsx(FilterBar, { available: data?.available_filters, value: filters, onChange: setFilters, pinnedCount: pinnedDashboards.length, categoryAccent: metadata?.category_accent, categoryOrder: metadata?.category_order }), (filters.platform || filters.category || filters.market || filters.pinnedOnly || search) && (_jsxs("div", { className: "search-banner", role: "status", children: [_jsxs("span", { children: [search ? _jsxs(_Fragment, { children: ["Filtering by ", _jsxs("strong", { children: ["\u201C", search, "\u201D"] }), " \u00B7 "] }) : null, filters.pinnedOnly ? _jsx(_Fragment, { children: "Pinned only \u00B7 " }) : null, data?.total ?? 0, " matching dashboards."] }), _jsx("button", { type: "button", className: "fchip", onClick: resetFilters, children: "Reset filters" })] })), error && (_jsxs("div", { className: "error-banner", role: "alert", children: ["Could not load dashboards: ", error] })), loading && _jsx(LoadingSkeletonGrid, {}), !loading && !error && grouped.length === 0 && (_jsx(EmptyState, { title: "No dashboards to show", message: search || filters.platform || filters.category || filters.market || filters.pinnedOnly
                            ? 'Try a different search or clear your filters.'
                            : 'The catalogue is empty. Add rows to the source dataset to get started.', actionLabel: search || filters.platform || filters.category || filters.market || filters.pinnedOnly ? 'Reset filters' : undefined, onAction: resetFilters })), !loading && !error && grouped.map((g) => (_jsx(PlatformSection, { platform: g.platform, dashboards: g.dashboards, isPinned: isPinned, onOpen: onOpenDashboard, onTogglePin: (d) => toggle(d.dashboard_id) }, g.platform.name)))] }), _jsx(Footer, { metadata: metadata }), _jsx(AccessRequestModal, { open: openAccess, onClose: () => setOpenAccess(false), items: accessCatalog?.items ?? [], allowedHosts: ['forms.office.com', 'urldefense.com'], onError: (m) => show(m, 'error') }), _jsx(ToastView, { toast: toast })] }));
}
