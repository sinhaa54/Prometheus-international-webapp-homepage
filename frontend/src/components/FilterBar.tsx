import type { AvailableFilters } from '../types/api';

export interface FilterState {
  platform: string | null;
  category: string | null;
  market: string | null;
  pinnedOnly: boolean;
}

interface Props {
  available: AvailableFilters | undefined;
  value: FilterState;
  onChange: (next: FilterState) => void;
  pinnedCount: number;
  /** Uniform accent (mockup v2_new: #3B9EDE) applied to every category chip swatch. */
  categoryAccent?: string;
  /** Preferred display order for category chips. Categories not in this list
   *  are appended alphabetically. */
  categoryOrder?: string[];
}

function orderCategories<T extends { value: string }>(
  categories: T[] | undefined,
  order: string[] | undefined,
): T[] {
  if (!categories) return [];
  if (!order || order.length === 0) return categories;
  const byValue = new Map(categories.map((c) => [c.value, c]));
  const seen = new Set<string>();
  const out: T[] = [];
  for (const name of order) {
    const hit = byValue.get(name);
    if (hit) { out.push(hit); seen.add(name); }
  }
  for (const c of categories) {
    if (!seen.has(c.value)) out.push(c);
  }
  return out;
}

export function FilterBar({ available, value, onChange, pinnedCount, categoryAccent, categoryOrder }: Props) {
  const orderedCategories = orderCategories(available?.categories, categoryOrder);
  return (
    <div className="filterbar" aria-label="Dashboard filters">
      <div className="fgroup">
        <span className="frow__label">Platform</span>
        <button
          type="button"
          className={`fchip ${value.platform === null && !value.pinnedOnly ? 'on' : ''}`}
          onClick={() => onChange({ ...value, platform: null, pinnedOnly: false })}
        >
          All
        </button>
        {available?.platforms.map((p) => (
          <button
            type="button"
            key={p.name}
            className={`fchip ${value.platform === p.name ? 'on' : ''}`}
            onClick={() => onChange({ ...value, platform: p.name, pinnedOnly: false })}
            title={p.blurb ?? undefined}
          >
            {p.accent && <span className="fchip__sw" style={{ background: p.accent }} aria-hidden />}
            {p.label}
            <span className="fchip__c">{p.dashboard_count}</span>
          </button>
        ))}
        <button
          type="button"
          className={`fchip ${value.pinnedOnly ? 'on' : ''}`}
          onClick={() => onChange({ ...value, pinnedOnly: !value.pinnedOnly })}
          aria-pressed={value.pinnedOnly}
        >
          ★ Pinned<span className="fchip__c">{pinnedCount}</span>
        </button>
      </div>

      <div className="fgroup">
        <span className="frow__label">Category</span>
        <button
          type="button"
          className={`fchip ${value.category === null ? 'on' : ''}`}
          onClick={() => onChange({ ...value, category: null })}
        >
          All
        </button>
        {orderedCategories.map((c) => (
          <button
            type="button"
            key={c.value}
            className={`fchip ${value.category === c.value ? 'on' : ''}`}
            onClick={() => onChange({ ...value, category: c.value })}
          >
            {categoryAccent && (
              <span className="fchip__sw" style={{ background: categoryAccent }} aria-hidden />
            )}
            {c.label}<span className="fchip__c">{c.count}</span>
          </button>
        ))}
      </div>

      <div className="fgroup">
        <span className="frow__label">Market</span>
        <button
          type="button"
          className={`fchip ${value.market === null ? 'on' : ''}`}
          onClick={() => onChange({ ...value, market: null })}
        >
          All
        </button>
        {available?.markets.map((m) => (
          <button
            type="button"
            key={m.value}
            className={`fchip ${value.market === m.value ? 'on' : ''}`}
            onClick={() => onChange({ ...value, market: m.value })}
          >
            {m.label}<span className="fchip__c">{m.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
