import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import pfizerLogo from '../assets/pfizer-logo.png';
/**
 * Dark navy masthead: brand, nav actions, search, greeting, and pinned panel.
 *
 * "Contact us" is a plain mailto link and "Feedback" is a direct external
 * Office Forms link (both configured via backend metadata). Only the
 * "Get access" action opens an in-app modal.
 */
export function Header({ onOpenAccess, contactMailto, feedbackUrl, searchSlot, greeting, pinnedSlot, }) {
    return (_jsx("header", { className: "masthead", role: "banner", children: _jsxs("div", { className: "wrap", children: [_jsxs("nav", { className: "nav", "aria-label": "Primary", children: [_jsxs("div", { className: "brand", children: [_jsx("div", { className: "brand__plate", "aria-label": "Pfizer", children: _jsx("img", { src: pfizerLogo, alt: "Pfizer", className: "brand__plate-img" }) }), _jsx("div", { className: "brand__div", "aria-hidden": true }), _jsx("div", { className: "brand__lockup", children: _jsx("div", { className: "brand__name", children: "Tender & Contract Analytics" }) })] }), searchSlot, _jsxs("div", { className: "nav__actions", children: [_jsx("a", { className: "navlink", href: contactMailto || 'mailto:analytics@pfizer.com', target: "_blank", rel: "noopener noreferrer", children: "Contact us" }), feedbackUrl ? (_jsx("a", { className: "navlink", href: feedbackUrl, target: "_blank", rel: "noopener noreferrer", children: "Feedback" })) : null, _jsx("button", { className: "btn-cta", type: "button", onClick: onOpenAccess, children: "Get access" })] })] }), _jsxs("div", { className: "hero", children: [_jsxs("div", { children: [_jsx("div", { className: "eyebrow", children: "Analytics portal" }), _jsx("h1", { className: "hero__title", children: greeting }), _jsxs("p", { className: "hero__lede", children: ["Explore ", _jsx("span", { className: "lede-accent", children: "Global Tenders & Contracts analytics" }), " across platforms and markets."] })] }), pinnedSlot] })] }) }));
}
