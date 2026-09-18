import { useState } from 'react';
import type { Dashboard, PlatformInfo } from '../types/api';
import { DashboardCard } from './DashboardCard';

interface Props {
  platform: PlatformInfo;
  dashboards: Dashboard[];
  isPinned: (id: string) => boolean;
  onOpen: (d: Dashboard) => void;
  onTogglePin: (d: Dashboard) => void;
}

export function PlatformSection({ platform, dashboards, isPinned, onOpen, onTogglePin }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const style = platform.accent ? ({ '--accent': platform.accent } as React.CSSProperties) : undefined;
  return (
    <section className={`section ${collapsed ? 'collapsed' : ''}`} style={style} aria-label={platform.label}>
      <div
        className="section__head"
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed((c) => !c); } }}
      >
        <div className="section__icon" aria-hidden>{platform.label.charAt(0)}</div>
        <div className="section__txt">
          <h2 className="section__title">{platform.label}</h2>
          {platform.blurb && <span className="section__sub">{platform.blurb}</span>}
        </div>
        <span className="section__count">{dashboards.length} dashboards</span>
        <span className="section__toggle" aria-hidden>{collapsed ? '▸' : '▾'}</span>
      </div>
      {dashboards.length > 0 && (
        <div className="grid" role="list">
          {dashboards.map((d) => (
            <div role="listitem" key={d.dashboard_id}>
              <DashboardCard
                dashboard={d}
                pinned={isPinned(d.dashboard_id)}
                onOpen={onOpen}
                onTogglePin={onTogglePin}
                accentColor={platform.accent ?? undefined}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
