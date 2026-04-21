import { Component, ErrorInfo, ReactNode } from "react";
import { ServiceInterruption } from "./ServiceInterruption";

interface Props {
  /** Children that might throw. */
  children: ReactNode;
  /** Optional custom fallback renderer. */
  fallback?: (err: Error, retry: () => void) => ReactNode;
}

interface State {
  err: Error | null;
}

/**
 * Classic React error boundary — keeps a runtime exception from crashing
 * the whole dashboard. Pairs with `ServiceInterruption` so the user sees
 * a graceful, on-brand failure state instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    // Log so the stack is available in dev tools — uncaught renders are rare
    // and always worth a look.
    console.error("[ErrorBoundary]", err, info);
  }

  retry = () => {
    this.setState({ err: null });
  };

  render() {
    if (this.state.err) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.err, this.retry);
      }
      return (
        <div className="px-4 py-16">
          <ServiceInterruption
            title="Something unexpected happened"
            message={
              this.state.err.message ||
              "The dashboard hit an unexpected error. Reloading usually fixes it."
            }
            onRetry={this.retry}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
