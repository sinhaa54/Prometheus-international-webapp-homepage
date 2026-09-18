import { useCallback, useEffect, useState } from 'react';

export interface ToastState {
  message: string;
  kind?: 'info' | 'error';
  id: number;
}

/** Very small toast system that keeps only the latest message. */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const show = useCallback((message: string, kind: 'info' | 'error' = 'info') => {
    setToast({ message, kind, id: Date.now() });
  }, []);

  return { toast, show };
}

export function ToastView({ toast }: { toast: ToastState | null }) {
  return (
    <div
      className={`toast ${toast ? 'show' : ''} ${toast?.kind === 'error' ? 'toast--error' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span>{toast?.message ?? ''}</span>
    </div>
  );
}
