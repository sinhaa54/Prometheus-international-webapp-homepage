const KEY = 'prometheus.pinnedDashboardIds';
function safeStorage() {
    try {
        const s = window.localStorage;
        const probe = '__ping__';
        s.setItem(probe, '1');
        s.removeItem(probe);
        return s;
    }
    catch {
        return null;
    }
}
/** localStorage-backed store. Falls back to in-memory when unavailable. */
export function createLocalPinnedStore() {
    const storage = safeStorage();
    let memory = [];
    const read = () => {
        if (!storage)
            return [...memory];
        try {
            const raw = storage.getItem(KEY);
            if (!raw)
                return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
        }
        catch {
            return [];
        }
    };
    const write = (ids) => {
        memory = [...ids];
        if (!storage)
            return;
        try {
            storage.setItem(KEY, JSON.stringify(ids));
        }
        catch {
            /* quota / privacy mode - silently fall back to memory */
        }
    };
    const toggle = (id) => {
        const cur = read();
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        write(next);
        return next;
    };
    return { read, write, toggle, isAvailable: () => storage !== null };
}
