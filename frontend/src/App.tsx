import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EmptyState } from './components/EmptyState';
import { LoadingSkeletonGrid } from './components/LoadingSkeleton';
import { PinnedPanel } from './components/PinnedPanel';
import { PlatformSection } from './components/PlatformSection';
import { SearchBar } from './components/SearchBar';
import { ToastView, useToast } from './components/Toast';
import { getAccessCatalog } from './api/endpoints';
import { useDashboards, useMetadata } from './features/dashboards/useDashboards';
import { usePinnedDashboards } from './features/favourites/usePinnedDashboards';
import { AccessRequestModal, isAccessUrlSafe } from './features/submissions/AccessRequestModal';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { Header } from './layouts/Header';
import { openTableauDashboard } from './services/tableau';
import type { AccessCatalogItem, AccessCatalogResponse, Dashboard, PlatformInfo } from './types/api';
import { homepageGreeting } from './utils/greeting';

const ALLOWED_ACCESS_REQUEST_HOSTS = ['forms.office.com', 'urldefense.com', 'forms.cloud.microsoft', 'rm.pfizer.com'];

/** Best-effort match of a dashboard to a curated access-catalog entry: exact
 *  name, then platform+category, then the catch-all "Multiple" platform entry. */
function findAccessCatalogItem(dashboard: Dashboard, items: AccessCatalogItem[]): AccessCatalogItem | undefined {
  return (
    items.find((it) => it.name === dashboard.dashboard_name) ??
    items.find((it) => it.platform === dashboard.platform && it.category === dashboard.category) ??
    items.find((it) => it.platform === 'Multiple')
  );
}

export default function App() {
  // ---- data ----
  const { data: metadata } = useMetadata();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 220);

  const params = useMemo(() => ({
    search: search || undefined,
    page: 1,
    page_size: 500,
    sort_by: 'display_order' as const,
    sort_direction: 'asc' as const,
  }), [search]);

  const { data, loading, error } = useDashboards(params);

  // Suggestions use the same debounced query but only when user is typing something.
  const suggestionParams = useMemo(() => ({
    search: search || undefined,
    page: 1,
    page_size: 8,
    sort_by: 'name' as const,
    sort_direction: 'asc' as const,
  }), [search]);
  const { data: sugData, loading: sugLoading } = useDashboards(suggestionParams);

  // ---- pinned dashboards ----
  const validIds = useMemo(
    () => new Set((data?.items ?? []).map((d) => d.dashboard_id)),
    [data?.items],
  );
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
  const onOpenDashboard = (d: Dashboard) => {
    if (!metadata) {
      show('Portal metadata is still loading — please try again in a moment.', 'error');
      return;
    }
    const res = openTableauDashboard(d.tableau_url, {
      allowedHosts: metadata.tableau_allowed_hosts,
      openInNewTab: metadata.tableau_open_in_new_tab,
    });
    if (!res.ok) show(res.error ?? 'Unable to open this dashboard.', 'error');
    else show(`Opening ${d.dashboard_name} in Tableau…`);
  };

  // ---- filtering & grouping ----
  const items = data?.items ?? [];
  const platforms: PlatformInfo[] = data?.available_filters.platforms ?? [];

  // Sections to hide entirely from the homepage.
  const HIDDEN_PLATFORMS = new Set(['Internal']);
  // Sections to always show first, in this order.
  const PLATFORM_PRIORITY = ['T&C Global'];

  // Preserve platform display order (from metadata), then dashboard display_order.
  const grouped = useMemo(() => {
    const byName = new Map<string, Dashboard[]>();
    for (const d of items) {
      const list = byName.get(d.platform) ?? [];
      list.push(d);
      byName.set(d.platform, list);
    }
    // Sort each bucket by display_order (repository already sorts, but keep stable).
    for (const list of byName.values()) list.sort((a, b) => a.display_order - b.display_order);
    const orderedPlatforms = [...platforms].sort((a, b) => {
      const ai = PLATFORM_PRIORITY.indexOf(a.name);
      const bi = PLATFORM_PRIORITY.indexOf(b.name);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return orderedPlatforms
      .filter((p) => !HIDDEN_PLATFORMS.has(p.name))
      .map((p) => ({ platform: p, dashboards: byName.get(p.name) ?? [] }))
      .filter((g) => g.dashboards.length > 0);
  }, [items, platforms]);

  const pinnedDashboards = useMemo(
    () => items.filter((d) => pinnedIds.includes(d.dashboard_id)),
    [items, pinnedIds],
  );

  const greeting = homepageGreeting();

  // ---- access-request catalog (loaded once) ----
  const [accessCatalog, setAccessCatalog] = useState<AccessCatalogResponse | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    getAccessCatalog(ctrl.signal)
      .then(setAccessCatalog)
      .catch(() => { /* soft-fail; modal shows an empty state */ });
    return () => ctrl.abort();
  }, []);

  // Per-dashboard "Request Access" link for the tile tooltip, resolved from the
  // curated access catalog (no per-dashboard API field needed).
  const accessUrlByDashboard = useMemo(() => {
    const catalogItems = accessCatalog?.items ?? [];
    const map = new Map<string, string>();
    for (const d of items) {
      const match = findAccessCatalogItem(d, catalogItems);
      if (match && isAccessUrlSafe(match.request_url, ALLOWED_ACCESS_REQUEST_HOSTS)) {
        map.set(d.dashboard_id, match.request_url);
      }
    }
    return map;
  }, [items, accessCatalog]);

  return (
    <ErrorBoundary>
      <Header
        onOpenAccess={() => setOpenAccess(true)}
        contactMailto={metadata?.contact_mailto ?? 'mailto:analytics@pfizer.com'}
        feedbackUrl={metadata?.feedback_url ?? ''}
        greeting={greeting}
        searchSlot={
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            suggestions={sugData?.items ?? []}
            loading={sugLoading}
            onSelect={(d) => { setSearchInput(''); onOpenDashboard(d); }}
            onClear={() => setSearchInput('')}
          />
        }
        pinnedSlot={
          <PinnedPanel
            pinned={pinnedDashboards}
            onOpen={onOpenDashboard}
            onUnpin={(d) => toggle(d.dashboard_id)}
          />
        }
      />

      <main id="main-content">
        {search && (
          <div className="search-banner" role="status">
            <span>
              Filtering by <strong>&ldquo;{search}&rdquo;</strong> · {data?.total ?? 0} matching dashboards.
            </span>
            <button type="button" className="fchip" onClick={() => setSearchInput('')}>Reset search</button>
          </div>
        )}

        {error && (
          <div className="error-banner" role="alert">
            Could not load dashboards: {error}
          </div>
        )}

        {loading && <LoadingSkeletonGrid />}

        {!loading && !error && grouped.length === 0 && (
          <EmptyState
            title="No dashboards to show"
            message={search
              ? 'Try a different search term.'
              : 'The catalogue is empty. Add rows to the source dataset to get started.'}
            actionLabel={search ? 'Reset search' : undefined}
            onAction={() => setSearchInput('')}
          />
        )}

        {!loading && !error && grouped.map((g) => (
          <PlatformSection
            key={g.platform.name}
            platform={g.platform}
            dashboards={g.dashboards}
            isPinned={isPinned}
            onOpen={onOpenDashboard}
            onTogglePin={(d) => toggle(d.dashboard_id)}
            accessUrlByDashboard={accessUrlByDashboard}
          />
        ))}
      </main>

      <AccessRequestModal
        open={openAccess}
        onClose={() => setOpenAccess(false)}
        items={accessCatalog?.items ?? []}
        allowedHosts={ALLOWED_ACCESS_REQUEST_HOSTS}
        onError={(m) => show(m, 'error')}
      />

      <ToastView toast={toast} />
    </ErrorBoundary>
  );
}
