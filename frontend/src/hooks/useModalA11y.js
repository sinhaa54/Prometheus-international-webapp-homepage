import { useEffect, useRef } from 'react';
/** Restores focus and traps focus while open. Escape closes. */
export function useModalA11y(open, onClose) {
    const containerRef = useRef(null);
    const previouslyFocused = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        previouslyFocused.current = document.activeElement;
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
            if (e.key === 'Tab' && containerRef.current) {
                const focusables = containerRef.current.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusables.length === 0)
                    return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        // Initial focus
        setTimeout(() => {
            const first = containerRef.current?.querySelector('input, textarea, select, button:not([data-close])');
            first?.focus();
        }, 20);
        return () => {
            document.removeEventListener('keydown', onKey);
            previouslyFocused.current?.focus?.();
        };
    }, [open, onClose]);
    return containerRef;
}
