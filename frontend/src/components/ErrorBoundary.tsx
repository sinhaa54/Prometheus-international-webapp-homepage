import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; message?: string }

/** Catches render/runtime errors in children and shows a graceful fallback. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error): void {
    // Log but do not expose stack traces to the user.
    console.error('UI error:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="error-banner" role="alert">
            Something went wrong loading this section. Please refresh the page.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
