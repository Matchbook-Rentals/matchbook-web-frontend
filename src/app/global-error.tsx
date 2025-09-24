'use client';

import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { BrandButton } from '@/components/ui/brandButton';
import { RefreshCw } from 'lucide-react';
import { logApplicationErrorWithContext } from '@/app/actions/application-errors';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error to database silently when component mounts
  useEffect(() => {
    const logError = async () => {
      try {
        await logApplicationErrorWithContext(error, {
          pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
          errorBoundary: 'GlobalError',
          timestamp: new Date().toISOString(),
          userActions: typeof window !== 'undefined' && window.sessionStorage
            ? JSON.parse(window.sessionStorage.getItem('recentUserActions') || '[]')
            : undefined,
        });
      } catch (logError) {
        // Silently fail - don't impact user experience
        console.error('Failed to log global error:', logError);
      }
    };

    logError();
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
