"use client";

import { Component, ReactNode } from "react";

// Error boundaries have to be class components - React has no hook
// equivalent for catching a render error in a subtree. If any single
// tab's content throws while rendering (bad data, a bug, anything),
// this stops it from taking the whole app down: the rest of the UI -
// the header, the nav, every other tab - stays fully interactive.
export default class TabErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[TabErrorBoundary] caught a render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-serif text-lg text-backdrop-ink">This section hit an error</p>
          <p className="max-w-xs text-sm leading-relaxed text-paper-muted">
            Nothing else on your dashboard was affected, and nothing was lost. Tap below to try
            this section again, or switch to a different tab.
          </p>
          <p className="max-w-xs rounded-lg border border-paper-border bg-paper-surface2 p-2.5 text-[11px] leading-snug text-paper-ink">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset?.();
            }}
            className="mt-1 rounded-xl2 bg-work px-5 py-2.5 text-sm font-medium text-paper-surface"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
