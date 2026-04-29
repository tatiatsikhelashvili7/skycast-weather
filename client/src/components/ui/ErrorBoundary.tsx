import { Component, ErrorInfo, ReactNode } from "react";
import { ServiceInterruption } from "./ServiceInterruption";
interface Props {
    children: ReactNode;
    fallback?: (err: Error, retry: () => void) => ReactNode;
}
interface State {
    err: Error | null;
}
export class ErrorBoundary extends Component<Props, State> {
    state: State = { err: null };
    static getDerivedStateFromError(err: Error): State {
        return { err };
    }
    componentDidCatch(err: Error, info: ErrorInfo) { }
    retry = () => {
        this.setState({ err: null });
    };
    render() {
        if (this.state.err) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.err, this.retry);
            }
            return (<div className="px-4 py-16">
          <ServiceInterruption title="Something unexpected happened" message={this.state.err.message ||
                    "The dashboard hit an unexpected error. Reloading usually fixes it."} onRetry={this.retry}/>
        </div>);
        }
        return this.props.children;
    }
}
