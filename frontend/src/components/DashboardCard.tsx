import type { Dashboard } from '../types/api';

interface Props {
  dashboard: Dashboard;
  pinned: boolean;
  onOpen: (d: Dashboard) => void;
  onTogglePin: (d: Dashboard) => void;
  accentColor?: string;
}

/**
 * A dashboard tile. Hovering (or keyboard-focusing) reveals a tooltip
 * containing the description + dashboard owner, mirroring the v2_new mockup.
 *
 * The tooltip is rendered inline inside the card and revealed via CSS
 * (`.card:hover .tip`, `.card:focus-within .tip`). This keeps a11y correct
 * for keyboard users and avoids the complexity of a portal.
 */
export function DashboardCard({ dashboard, pinned, onOpen, onTogglePin, accentColor }: Props) {
  const style = accentColor ? ({ '--accent': accentColor } as React.CSSProperties) : undefined;
  const hasTooltip = Boolean(dashboard.dashboard_description || dashboard.owner_name);
  return (
    <div
      className="card"
      style={style}
      role="button"
      tabIndex={0}
      aria-label={`Open ${dashboard.dashboard_name} in Tableau`}
      onClick={() => onOpen(dashboard)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(dashboard); }
      }}
    >
      <h3 className="card__name">{dashboard.dashboard_name}</h3>
      <button
        type="button"
        className={`fav ${pinned ? 'on' : ''}`}
        aria-label={pinned ? 'Unpin dashboard' : 'Pin dashboard'}
        aria-pressed={pinned}
        onClick={(e) => { e.stopPropagation(); onTogglePin(dashboard); }}
      >
        {pinned ? '\u2605' : '\u2606'}
      </button>
      <div className="card__row">
        {dashboard.category && <span className="chip">{dashboard.category}</span>}
        {dashboard.market && <span className="card__meta">{dashboard.market}</span>}
      </div>

      {hasTooltip && (
        <div className="tip" role="tooltip">
          {dashboard.dashboard_description && (
            <div className="tip__desc">{dashboard.dashboard_description}</div>
          )}
          {dashboard.owner_name && (
            <div className="tip__owner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
              </svg>
              <span className="tip__owner-label">Owner</span>
              <span className="tip__owner-name">{dashboard.owner_name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
