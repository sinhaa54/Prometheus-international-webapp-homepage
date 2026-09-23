import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModalA11y } from '../hooks/useModalA11y';
export function Modal({ open, onClose, title, eyebrow, description, children, labelledById }) {
    const ref = useModalA11y(open, onClose);
    if (!open)
        return null;
    const titleId = labelledById ?? 'modal-title';
    return (_jsx("div", { className: "backdrop", onMouseDown: (e) => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, ref: ref, children: [_jsxs("div", { className: "modal__head", children: [eyebrow && _jsx("div", { className: "modal__eyebrow", children: eyebrow }), _jsx("h2", { className: "modal__title", id: titleId, children: title }), description && _jsx("p", { className: "modal__desc", children: description }), _jsx("button", { className: "modal__close", "data-close": true, "aria-label": "Close", onClick: onClose, children: "\u00D7" })] }), children] }) }));
}
