import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Mail, Bug } from 'lucide-react';
import { log } from '@/lib/logger';
import { handleError } from '@/lib/error-handler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context
    const handled = handleError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    log.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      errorBoundary: true,
    });

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (Sentry, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: true,
          errorId: this.state.errorId,
        },
      });
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset error boundary when resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = prevProps.resetKeys?.some(
        (key, index) => key !== this.props.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
    log.info('Error boundary reset');
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!error) return;

    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Create mailto link with error details
    const subject = encodeURIComponent(`CityScope Error Report - ${errorId}`);
    const body = encodeURIComponent(JSON.stringify(errorReport, null, 2));
    window.location.href = `mailto:support@cityscope.app?subject=${subject}&body=${body}`;
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = import.meta.env.DEV;
      const { error, errorInfo, errorId } = this.state;

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-red-600">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                We encountered an unexpected error. Please try refreshing the page.
                {errorId && (
                  <span className="block mt-2 text-xs text-gray-500">
                    Error ID: {errorId}
                  </span>
                )}
              </p>
              
              {isDevelopment && error && (
                <details className="bg-gray-100 p-3 rounded-lg text-sm">
                  <summary className="font-semibold cursor-pointer mb-2">Error Details</summary>
                  <div className="space-y-2 mt-2">
                    <div>
                      <strong>Message:</strong>
                      <pre className="text-gray-700 font-mono text-xs mt-1 overflow-auto">
                        {error.message}
                      </pre>
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="text-gray-700 font-mono text-xs mt-1 overflow-auto max-h-40">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="text-gray-700 font-mono text-xs mt-1 overflow-auto max-h-40">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button onClick={this.handleReload} className="flex-1" aria-label="Reload page">
                    <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                    Reload
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="flex-1" aria-label="Go to home page">
                    <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                    Home
                  </Button>
                </div>
                <Button 
                  onClick={this.handleReportError} 
                  variant="outline" 
                  className="w-full"
                  aria-label="Report error via email"
                >
                  <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                  Report Error
                </Button>
                {isDevelopment && (
                  <Button 
                    onClick={this.resetErrorBoundary} 
                    variant="ghost" 
                    size="sm"
                    className="w-full"
                    aria-label="Try to recover from error"
                  >
                    <Bug className="w-4 h-4 mr-2" aria-hidden="true" />
                    Try to Recover
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}