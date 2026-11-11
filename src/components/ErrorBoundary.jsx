import { Component } from 'react'

import { ErrorState } from '@/components/states'

// ErrorBoundary catches an error thrown while a page renders, including a
// page chunk that fails to download, and shows a way out instead of a blank
// screen. It's a class because React has no hook for catching render errors.
//
// "Try again" reloads the page: a chunk that failed to download won't arrive
// by rendering again. Changing `resetKey` (the current path) clears the error,
// so navigating elsewhere works too.
export class ErrorBoundary extends Component {
  state = { failed: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="grid min-h-screen place-items-center bg-background p-4 surface-glow">
        <div className="w-full max-w-md surface-raised">
          <ErrorState
            title="Something went wrong on this page"
            onRetry={() => window.location.reload()}
          >
            Reloading the page usually sorts it out.
          </ErrorState>
        </div>
      </main>
    )
  }
}
