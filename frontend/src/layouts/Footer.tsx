import type { MetadataResponse } from '../types/api';

interface Props { metadata: MetadataResponse | null }

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export function Footer({ metadata }: Props) {
  return (
    <footer role="contentinfo">
      <div className="foot__meta">
        {metadata ? (
          <>
            {metadata.active_dashboard_count} active dashboards ·{' '}
            {metadata.platform_count} platforms ·{' '}
            {metadata.market_count} markets ·{' '}
            source refreshed {fmtDate(metadata.source_refreshed_at)} ·{' '}
            v{metadata.app_version}
          </>
        ) : (
          'Loading portal metadata…'
        )}
      </div>
    </footer>
  );
}
