'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{error.message || "An unexpected error occurred."}</p>
          <div className="flex gap-4">
            <Button onClick={() => reset()} variant="outline">
              Try again
            </Button>
            <Button onClick={() => window.location.href = '/platform/trips'} variant="outline">
              Return to Trips
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}