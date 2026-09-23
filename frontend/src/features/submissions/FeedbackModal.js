import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { submitFeedback } from '../../api/endpoints';
import { Modal } from '../../components/Modal';
export function FeedbackModal({ open, onClose, dashboards, onSuccess, onError }) {
    const [dashboardId, setDashboardId] = useState('');
    const [rating, setRating] = useState(0);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    async function onSubmit(e) {
        e.preventDefault();
        if (submitting)
            return;
        setSubmitting(true);
        try {
            const res = await submitFeedback({
                dashboard_id: dashboardId || undefined,
                rating: rating || 0,
                email: email || undefined,
                message,
            });
            onSuccess(`Thanks for the feedback · ${res.request_id}`);
            setDashboardId('');
            setRating(0);
            setEmail('');
            setMessage('');
            onClose();
        }
        catch (err) {
            onError(err instanceof Error ? err.message : 'Could not submit feedback.');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Help us improve", eyebrow: "Feedback", description: "Rate a dashboard and tell us what's working \u2014 or what isn't.", children: _jsxs("form", { className: "modal__body", onSubmit: onSubmit, noValidate: true, children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "fb-dashboard", children: "Which dashboard?" }), _jsxs("select", { id: "fb-dashboard", value: dashboardId, onChange: (e) => setDashboardId(e.target.value), children: [_jsx("option", { value: "", children: "\u2014 Overall portal \u2014" }), dashboards.map((d) => _jsx("option", { value: d.dashboard_id, children: d.dashboard_name }, d.dashboard_id))] })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "How's it working for you?" }), _jsx("div", { className: "stars", role: "radiogroup", "aria-label": "Rating", children: [1, 2, 3, 4, 5].map((n) => (_jsx("button", { type: "button", className: n <= rating ? 'on' : '', "aria-checked": n === rating, role: "radio", "aria-label": `${n} star${n === 1 ? '' : 's'}`, onClick: () => setRating(n === rating ? 0 : n), children: "\u2605" }, n))) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "fb-email", children: "Your email (optional)" }), _jsx("input", { id: "fb-email", type: "email", maxLength: 128, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "alex@pfizer.com" })] }), _jsxs("div", { className: "field", children: [_jsxs("label", { htmlFor: "fb-message", children: ["Your thoughts ", _jsx("span", { className: "req", children: "*" })] }), _jsx("textarea", { id: "fb-message", required: true, maxLength: 4000, value: message, onChange: (e) => setMessage(e.target.value), placeholder: "What would make this dashboard more useful?" })] }), _jsxs("div", { className: "modal__foot", children: [_jsx("span", { className: "contact-line", children: "Optional: leave your email if you'd like a reply." }), _jsx("button", { type: "submit", className: "btn-primary", disabled: submitting, children: submitting ? 'Sending…' : 'Send feedback' })] })] }) }));
}
