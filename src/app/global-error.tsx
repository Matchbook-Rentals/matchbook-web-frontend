'use client';

import { useState, useEffect } from 'react';
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
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      window.location.reload();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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
              Auto-refreshing in <span className="font-medium text-foreground">{countdown}</span> seconds
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
