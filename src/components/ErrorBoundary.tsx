import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 font-sans selection:bg-indigo-500/30">
          <div className="max-w-md w-full bg-white/5 border border-red-500/30 rounded-3xl p-8 backdrop-blur-md text-center shadow-2xl shadow-red-500/10">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-4 tracking-tight">Something went wrong</h1>
            <p className="text-slate-400 mb-6 text-sm">
              We encountered an unexpected error. Please try again or return home.
            </p>
            {this.state.error && (
              <div className="bg-black/50 rounded-xl p-4 mb-8 text-left overflow-auto max-h-32 text-red-300 text-xs font-mono border border-red-500/20">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/10"
              >
                <Home className="w-4 h-4" /> Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
