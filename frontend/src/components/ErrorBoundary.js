import { jsx as _jsx } from "react/jsx-runtime";
import { Component } from 'react';
/** Catches render/runtime errors in children and shows a graceful fallback. */
export class ErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError(err) {
        return { hasError: true, message: err.message };
    }
    componentDidCatch(err) {
        // Log but do not expose stack traces to the user.
        console.error('UI error:', err);
    }
    render() {
        if (this.state.hasError) {
            return (this.props.fallback ?? (_jsx("div", { className: "error-banner", role: "alert", children: "Something went wrong loading this section. Please refresh the page." })));
        }
        return this.props.children;
    }
}
