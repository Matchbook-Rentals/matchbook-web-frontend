'use client';

import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { BrandButton } from '@/components/ui/brandButton';
import { RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Detect if this is a Clerk authentication error
  // Part of idle tab session recovery fix - see docs/auth/clerk-stale-session-fix.md
  const isClerkAuthError = () => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorStack = error?.stack?.toLowerCase() || '';

    return (
      errorMessage.includes('clerkjs') ||
      errorMessage.includes('token refresh failed') ||
      errorMessage.includes('failed to fetch') && errorStack.includes('clerk') ||
      errorMessage.includes('session_token_invalid') ||
      errorMessage.includes('unauthorized') && errorStack.includes('clerk') ||
      errorMessage.includes('unauthenticated') && errorStack.includes('clerk')
    );
  };

  // Log error via API route (not server action — server actions are unreliable here
  // because global-error replaces the entire app tree)
  useEffect(() => {
    const logError = async () => {
      try {
        await fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errorMessage: error.message || 'Unknown error',
            errorStack: error.stack,
            errorDigest: error.digest,
            pathname: window.location.pathname,
            userAgent: navigator.userAgent,
            isAuthError: isClerkAuthError(),
          }),
        });
      } catch {
        console.error('Failed to log global error');
      }
    };

    logError();

    // If this is a Clerk auth error, redirect to sign-in instead of showing error UI
    // This prevents infinite reload loops and provides better UX
    if (isClerkAuthError()) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/sign-in') && !currentPath.startsWith('/sign-up') && !currentPath.startsWith('/auth')) {
        window.location.href = '/sign-in';
      }
    }
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Something went wrong!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              An unexpected error has occurred. We apologize for the inconvenience.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <div className="text-sm text-muted-foreground">
              Please use the buttons below to retry or return to the homepage.
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-4">
            <BrandButton
              onClick={() => window.location.reload()}
              className="w-full"
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Try Again
            </BrandButton>
            
            <BrandButton
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to Homepage
            </BrandButton>
          </CardFooter>
        </Card>
      </body>
    </html>
  );
}
