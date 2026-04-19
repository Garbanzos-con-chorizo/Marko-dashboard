import React from 'react';

/**
 * ErrorBoundary
 * Catches render-phase errors in its subtree and prevents the entire
 * React tree from unmounting (which previously required a full page reload).
 *
 * Provides a "Try again" button that resets the boundary so the user can
 * continue without a hard reload. Also logs the error + component stack
 * to the console for debugging.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
    this.handleReset = this.handleReset.bind(this);
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught render error:', error, info);
    this.setState({ info });
  }

  componentDidUpdate(prevProps) {
    // Reset the boundary automatically when the route key changes
    // so navigating to a different tab clears a prior error.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null, info: null });
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null, info: null });
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      const { error, info } = this.state;
      return (
        <div className="p-6 max-w-3xl mx-auto">
          <div className="p-5 rounded-md bg-statusBad/10 border border-statusBad/30 text-statusBad">
            <div className="font-bold text-sm mb-2">Something went wrong rendering this view.</div>
            <div className="text-xs font-mono opacity-80 break-words">
              {error?.message || String(error)}
            </div>
            {info?.componentStack && (
              <details className="mt-3 text-[11px] font-mono opacity-60 whitespace-pre-wrap">
                <summary className="cursor-pointer">Stack trace</summary>
                {info.componentStack}
              </details>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={this.handleReset}
                className="px-3 py-1.5 text-xs font-mono rounded bg-statusBad/20 hover:bg-statusBad/30 border border-statusBad/40"
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className="px-3 py-1.5 text-xs font-mono rounded bg-transparent hover:bg-statusBad/10 border border-statusBad/40"
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
