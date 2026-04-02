import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center px-6 gap-4">
          <span className="text-5xl">𝄞</span>
          <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
          <p className="text-sm text-zinc-500">An unexpected error occurred. Please reload the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2 bg-purple-500 hover:bg-purple-400 text-white text-sm rounded-lg transition-colors cursor-pointer"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
