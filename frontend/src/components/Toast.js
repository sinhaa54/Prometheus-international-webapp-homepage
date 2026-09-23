import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
/** Very small toast system that keeps only the latest message. */
export function useToast() {
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (!toast)
            return;
        const t = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(t);
    }, [toast]);
    const show = useCallback((message, kind = 'info') => {
        setToast({ message, kind, id: Date.now() });
    }, []);
    return { toast, show };
}
export function ToastView({ toast }) {
    return (_jsx("div", { className: `toast ${toast ? 'show' : ''} ${toast?.kind === 'error' ? 'toast--error' : ''}`, role: "status", "aria-live": "polite", children: _jsx("span", { children: toast?.message ?? '' }) }));
}
