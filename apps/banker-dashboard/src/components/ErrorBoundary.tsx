import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Banker Dashboard:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-card p-8 border-t-4 border-t-rose-500 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Application Exception Caught</h2>
              <p className="text-xs text-slate-400 mt-2">
                The UI encountered an unexpected state while processing MSME alternate data structures.
              </p>
              {this.state.error && (
                <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 text-left overflow-auto max-h-32">
                  <code className="text-[11px] font-mono text-rose-300">
                    {this.state.error.toString()}
                  </code>
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              <RotateCcw className="w-4 h-4" /> Reload Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
