/**
 * "Get access to a dashboard" modal.
 *
 * v2_new redesign: instead of a submission form, this shows a curated list
 * of dashboards for which self-service access is available. Each row links
 * out to an external Office Forms URL that has been server-side allowlisted
 * (see backend `ALLOWED_ACCESS_REQUEST_HOSTS`).
 *
 * The frontend performs a defensive second check via `isAccessUrlSafe` so a
 * bad row can never surface an unapproved redirect.
 *
 * Latest revision: added the "Other Dashboards" grouping (icon_key="grid")
 * with a custom `meta` line, and removed the bottom info-note (the grouping
 * replaces it).
 */
import { Modal } from '../../components/Modal';
import type { AccessCatalogItem } from '../../types/api';

interface Props {
  open: boolean;
  onClose: () => void;
  items: AccessCatalogItem[];
  allowedHosts: string[];
  onError: (message: string) => void;
}

export function AccessRequestModal({ open, onClose, items, allowedHosts, onError }: Props) {
  const safeItems = items.filter((it) => isAccessUrlSafe(it.request_url, allowedHosts));

  const onClick = (item: AccessCatalogItem) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAccessUrlSafe(item.request_url, allowedHosts)) {
      e.preventDefault();
      onError('This access-request URL is not on the approved host allowlist.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Get access to a dashboard"
      eyebrow="Request access"
      description="Self-service access is available for the dashboards below. Select one to open its request form."
    >
      <div className="modal__body">
        {safeItems.length === 0 ? (
          <p className="access-note" role="status">
            <InfoIcon />
            <span>No self-service access dashboards are available right now.</span>
          </p>
        ) : (
          <ul className="access-list" aria-label="Self-service access dashboards">
            {safeItems.map((item) => (
              <li key={item.name}>
                <a
                  className="access-item"
                  href={item.request_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClick(item)}
                >
                  <span className="access-item__ic" aria-hidden="true">
                    <ItemIcon iconKey={item.icon_key} />
                  </span>
                  <span className="access-item__txt">
                    <span className="access-item__name">{item.name}</span>
                    <span className="access-item__meta">{subline(item)}</span>
                  </span>
                  <span className="access-item__arrow" aria-hidden="true">
                    <ArrowUpRightIcon />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/** Only HTTPS URLs whose exact hostname is in `allowedHosts`. */
export function isAccessUrlSafe(url: string, allowedHosts: string[]): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  return allowedHosts.map((h) => h.toLowerCase()).includes(host);
}

/** Prefer server-provided `meta`; fall back to "platform · category". */
function subline(item: AccessCatalogItem): string {
  if (item.meta) return item.meta;
  return item.category ? `${item.platform} \u00B7 ${item.category}` : item.platform;
}

// ---------- inline SVGs (mirrors the mockup) ----------

function ItemIcon({ iconKey }: { iconKey: string }) {
  if (iconKey === 'pyramid') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.3 9 5.2v9.5l-9-5.2z" />
        <path d="m16.5 9.5-9-5.2M3 7.5l4.5 2.6M3 7.5v9l4.5 2.6V9.9M3 7.5 12 2.3l4.5 2.6" />
      </svg>
    );
  }
  if (iconKey === 'grid') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }
  // default: bar chart
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" />
      <rect x="12" y="8" width="3" height="10" />
      <rect x="17" y="5" width="3" height="13" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5h.01" />
    </svg>
  );
}
