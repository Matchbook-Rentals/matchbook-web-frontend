'use client';

import { useEffect } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Error patterns that indicate stale session/chunks that can be fixed with refresh
// These are specific to production deployment issues, not development hot reload
const RECOVERABLE_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Loading CSS chunk.*failed/i,
  /NetworkError.*chunk/i,
  /fetch.*_next\/static.*failed/i,
  /Failed to import.*_next\/static/i,
  /Cannot resolve module.*_next/i,
  // Removed overly broad patterns that catch dev hot reload:
  // - /hydration/i (too broad, catches dev hydration issues)
  // - /Module not found/i (too broad, catches dev issues)
  // - /fetch.*failed/i (too broad)
  // - /Text content does not match/i (hydration error, should only happen in prod)
];

// Check if error is recoverable with a page refresh
const isRecoverableError = (error: Error): boolean => {
  const errorMessage = error.message || error.toString();
  return RECOVERABLE_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage));
};

export default function Error({ error, reset }: ErrorPageProps) {
  const isRecoverable = isRecoverableError(error);
  const { attemptAutoRefresh } = useAutoRefresh();
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Skip auto-refresh logic in development mode
    if (isDevelopment) {
      console.error('[Error Boundary - Development]', error);
      return;
    }

    // Auto-refresh for recoverable errors using centralized logic (production only)
    if (isRecoverable) {
      const timer = setTimeout(async () => {
        await attemptAutoRefresh({
          reason: 'React error boundary triggered',
          source: 'error-boundary',
          errorDetails: {
            message: error.message,
            stack: error.stack,
            digest: error.digest,
          }
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, isRecoverable, attemptAutoRefresh, isDevelopment]);

  // Development mode: Show full error details without auto-refresh
  if (isDevelopment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-4xl">
          <h1 className="text-2xl font-semibold text-red-600">Development Error</h1>
          <p className="text-gray-600">
            This error occurred in development mode. Auto-refresh is disabled.
          </p>
          <div className="flex space-x-4 justify-center">
            <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
          <details className="mt-8 text-left bg-gray-100 p-4 rounded">
            <summary className="cursor-pointer text-sm font-medium mb-2">
              Error Details
            </summary>
            <div className="space-y-2">
              <div>
                <strong>Message:</strong>
                <pre className="text-xs text-red-600 whitespace-pre-wrap mt-1">
                  {error.message}
                </pre>
              </div>
              {error.digest && (
                <div>
                  <strong>Digest:</strong>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-1">
                    {error.digest}
                  </pre>
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-1 max-h-96 overflow-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    );
  }

  // Production mode: Auto-refresh for recoverable errors
  if (isRecoverable) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Updating to latest version...</h1>
          <p className="text-gray-600">
            The page will refresh automatically in a few seconds.
          </p>
          <div className="flex space-x-4">
            <Button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700"
            >
              Refresh Now
            </Button>
            <Button
              variant="outline"
              onClick={reset}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Non-recoverable error - show standard error page
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">Something went wrong!</h1>
        <p className="text-gray-600">
          We&apos;ve encountered an unexpected error. Please try again.
        </p>
        <div className="flex space-x-4">
          <Button
            onClick={reset}
            className="bg-green-600 hover:bg-green-700"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            Go Home
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}