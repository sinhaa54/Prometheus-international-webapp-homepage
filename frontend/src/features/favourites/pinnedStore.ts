/**
 * Interface for the pinned-dashboards store. The initial implementation
 * uses localStorage; a future backend-backed implementation can drop in
 * behind the same interface without changing UI code.
 */
export interface PinnedStore {
  read(): string[];
  write(ids: string[]): void;
  toggle(id: string): string[];
  isAvailable(): boolean;
}

const KEY = 'prometheus.pinnedDashboardIds';

function safeStorage(): Storage | null {
  try {
    const s = window.localStorage;
    const probe = '__ping__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/** localStorage-backed store. Falls back to in-memory when unavailable. */
export function createLocalPinnedStore(): PinnedStore {
  const storage = safeStorage();
  let memory: string[] = [];

  const read = (): string[] => {
    if (!storage) return [...memory];
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  };

  const write = (ids: string[]): void => {
    memory = [...ids];
    if (!storage) return;
    try {
      storage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* quota / privacy mode - silently fall back to memory */
    }
  };

  const toggle = (id: string): string[] => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    write(next);
    return next;
  };

  return { read, write, toggle, isAvailable: () => storage !== null };
}
