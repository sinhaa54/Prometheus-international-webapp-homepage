import { useEffect, useState } from 'react';
/**
 * Debounce a fast-changing value (e.g. search text).
 * The returned value only updates after `delayMs` of quiet time.
 */
export function useDebouncedValue(value, delayMs = 200) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return debounced;
}
