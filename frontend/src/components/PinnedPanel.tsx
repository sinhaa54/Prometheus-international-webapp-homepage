import type { Dashboard } from '../types/api';

interface Props {
  pinned: Dashboard[];
  onOpen: (d: Dashboard) => void;
  onUnpin: (d: Dashboard) => void;
}

export function PinnedPanel({ pinned, onOpen, onUnpin }: Props) {
  return (
    <aside className="favs" aria-label="Pinned dashboards">
      <div className="favs__head">
        <div className="favs__label">
          <span aria-hidden>★</span>
          Pinned dashboards
        </div>
      </div>
      {pinned.length === 0 ? (
        <p className="favs__empty"><b>Pin a dashboard</b>&nbsp;— use the star on any card to keep your favourites in reach.</p>
      ) : (
        <div className="favs__list">
          {pinned.map((d) => (
            <button key={d.dashboard_id} type="button" className="fav-chip" onClick={() => onOpen(d)}>
              <span className="fav-chip__name">{d.dashboard_name}</span>
              <span
                className="fav-chip__star"
                aria-label="Unpin"
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onUnpin(d); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onUnpin(d); } }}
              >★</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
