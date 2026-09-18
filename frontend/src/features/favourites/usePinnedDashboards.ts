import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLocalPinnedStore, type PinnedStore } from './pinnedStore';

/** Hook for managing pinned dashboard IDs, filtered to those that still exist. */
export function usePinnedDashboards(validIds: Set<string>, store?: PinnedStore) {
  const impl = useMemo(() => store ?? createLocalPinnedStore(), [store]);
  const [ids, setIds] = useState<string[]>(() => impl.read().filter((id) => validIds.has(id)));

  // Prune stale IDs whenever the set of valid dashboard IDs changes.
  useEffect(() => {
    const pruned = impl.read().filter((id) => validIds.has(id));
    impl.write(pruned);
    setIds(pruned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.from(validIds).sort().join('|')]);

  const toggle = useCallback((id: string) => {
    const next = impl.toggle(id);
    setIds(next.filter((x) => validIds.has(x)));
  }, [impl, validIds]);

  const isPinned = useCallback((id: string) => ids.includes(id), [ids]);

  return { pinnedIds: ids, isPinned, toggle, isStorageAvailable: impl.isAvailable() };
}
