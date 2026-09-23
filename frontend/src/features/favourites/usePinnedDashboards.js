import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLocalPinnedStore } from './pinnedStore';
/** Hook for managing pinned dashboard IDs, filtered to those that still exist. */
export function usePinnedDashboards(validIds, store) {
    const impl = useMemo(() => store ?? createLocalPinnedStore(), [store]);
    const [ids, setIds] = useState(() => impl.read().filter((id) => validIds.has(id)));
    // Prune stale IDs whenever the set of valid dashboard IDs changes.
    useEffect(() => {
        const pruned = impl.read().filter((id) => validIds.has(id));
        impl.write(pruned);
        setIds(pruned);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Array.from(validIds).sort().join('|')]);
    const toggle = useCallback((id) => {
        const next = impl.toggle(id);
        setIds(next.filter((x) => validIds.has(x)));
    }, [impl, validIds]);
    const isPinned = useCallback((id) => ids.includes(id), [ids]);
    return { pinnedIds: ids, isPinned, toggle, isStorageAvailable: impl.isAvailable() };
}
