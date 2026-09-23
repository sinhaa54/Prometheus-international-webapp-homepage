import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({ title, message, actionLabel, onAction }) {
    return (_jsxs("div", { className: "empty", role: "status", children: [_jsx("h3", { children: title }), _jsx("p", { children: message }), actionLabel && onAction && (_jsx("button", { type: "button", className: "btn-primary", onClick: onAction, children: actionLabel }))] }));
}
