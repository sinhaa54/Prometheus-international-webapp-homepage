import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetadata, listDashboards } from '../../api/endpoints';
import { ApiError } from '../../api/client';
/** Fetch dashboards with cancellation on rapid param changes. */
export function useDashboards(params) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const inflight = useRef(null);
    useEffect(() => {
        inflight.current?.abort();
        const ctrl = new AbortController();
        inflight.current = ctrl;
        setLoading(true);
        setError(null);
        listDashboards({ ...params, signal: ctrl.signal })
            .then((res) => {
            setData(res);
        })
            .catch((err) => {
            if (err instanceof ApiError && err.code === 'aborted')
                return;
            setError(err instanceof Error ? err.message : 'Failed to load dashboards.');
        })
            .finally(() => {
            if (!ctrl.signal.aborted)
                setLoading(false);
        });
        return () => ctrl.abort();
        // Serialise params for a stable dependency identity.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(params)]);
    return { data, loading, error };
}
export function useMetadata() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(() => {
        const ctrl = new AbortController();
        setLoading(true);
        getMetadata(ctrl.signal)
            .then(setData)
            .catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load metadata.');
        })
            .finally(() => setLoading(false));
        return () => ctrl.abort();
    }, []);
    useEffect(() => refresh(), [refresh]);
    return { data, loading, error, refresh };
}
