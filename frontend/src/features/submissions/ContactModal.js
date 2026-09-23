import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { submitContact } from '../../api/endpoints';
import { Modal } from '../../components/Modal';
export function ContactModal({ open, onClose, onSuccess, onError }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    async function onSubmit(e) {
        e.preventDefault();
        if (submitting)
            return;
        setSubmitting(true);
        try {
            const res = await submitContact({ name, email, subject: subject || undefined, message });
            onSuccess(`Message sent · ${res.request_id}`);
            setName('');
            setEmail('');
            setSubject('');
            setMessage('');
            onClose();
        }
        catch (err) {
            onError(err instanceof Error ? err.message : 'Could not send message.');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Talk to the analytics team", eyebrow: "Contact", description: "Questions about data, refresh timing, or a new build? Send us a note.", children: _jsxs("form", { className: "modal__body", onSubmit: onSubmit, noValidate: true, children: [_jsxs("div", { className: "field--row", children: [_jsxs("div", { className: "field", children: [_jsxs("label", { htmlFor: "ct-name", children: ["Name ", _jsx("span", { className: "req", children: "*" })] }), _jsx("input", { id: "ct-name", required: true, maxLength: 128, value: name, onChange: (e) => setName(e.target.value), placeholder: "Alex Morgan" })] }), _jsxs("div", { className: "field", children: [_jsxs("label", { htmlFor: "ct-email", children: ["Email ", _jsx("span", { className: "req", children: "*" })] }), _jsx("input", { id: "ct-email", required: true, type: "email", maxLength: 128, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "alex@pfizer.com" })] })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "ct-subject", children: "Subject" }), _jsx("input", { id: "ct-subject", maxLength: 256, value: subject, onChange: (e) => setSubject(e.target.value), placeholder: "e.g. Data refresh question" })] }), _jsxs("div", { className: "field", children: [_jsxs("label", { htmlFor: "ct-message", children: ["Message ", _jsx("span", { className: "req", children: "*" })] }), _jsx("textarea", { id: "ct-message", required: true, maxLength: 4000, value: message, onChange: (e) => setMessage(e.target.value), placeholder: "How can we help?" })] }), _jsxs("div", { className: "modal__foot", children: [_jsxs("span", { className: "contact-line", children: ["Or email ", _jsx("a", { href: "mailto:analytics@pfizer.com", children: "analytics@pfizer.com" })] }), _jsx("button", { type: "submit", className: "btn-primary", disabled: submitting, children: submitting ? 'Sending…' : 'Send message' })] })] }) }));
}
