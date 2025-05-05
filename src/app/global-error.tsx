'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation' // Import useRouter and usePathname
import { Button } from '@/components/ui/button' // Assuming you have a Button component

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter(); // Initialize router
  const pathname = usePathname(); // Get current path

  useEffect(() => {
    // Log the error to console (optional, good for debugging)
    console.error("Global Error Boundary Caught:", error);

    // --- Log Error to API ---
    const logError = async () => {
      // Note: No try/catch here, let it bubble up to the useEffect's catch
      await fetch('/api/log-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            errorMessage: error?.message,
            errorStack: error?.stack,
            errorDigest: error?.digest,
            pathname: pathname,
            userAgent: navigator.userAgent, // Get browser info
          }),
        });
        // No need to handle success response, just fire and forget
    };

    // --- Corrected Logic Block --- (Removed the incorrect IIFE wrapper)
    let timerId: NodeJS.Timeout | null = null; 

    const runAsyncOperations = async () => {
      try {
        await logError();
        console.log("Error successfully logged to API.");
      } catch (logApiError: any) {
        console.error("Failed to send error log to API:", logApiError);
        window.alert(`Failed to report error to server: ${logApiError?.message || 'Unknown error'}`);
      } finally {
        // Schedule the reload after attempting to log, regardless of success/failure
        timerId = setTimeout(() => {
          console.log("Global Error: Attempting automatic full page reload...");
          window.location.reload();
        }, 3000);
      }
    };

    runAsyncOperations();

    // Cleanup function for useEffect
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
    /* --- End Corrected Logic --- */

  // We only want this effect to run once when the error occurs.
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [error, pathname]); // Add pathname to dependencies

  // --- Error Type Detection ---
  // Moved this calculation outside useEffect so it's available for the API call
  // Check for keywords often associated with auth issues.
  // This is a heuristic and might need adjustment based on actual errors seen.
  const message = error.message.toLowerCase();
  const isLikelyAuthError = // <-- Uncommented
    message.includes('unauthenticated') || 
    message.includes('unauthorized') || 
    message.includes('session') || 
    message.includes('clerk') || // Catch generic Clerk errors
    message.includes('signin') || // Might indicate redirection issues
    message.includes('signup');

  // --- Render Logic ---
  let title = "Something Went Wrong";
  let description = "An unexpected error occurred. We've logged the issue. Please try refreshing the page.";
  let actions = (
    <Button onClick={() => window.location.reload()} style={{ marginTop: '20px' }}>
      Refresh Page
    </Button>
  );

  // Conditionally override title/description/actions for auth errors
  if (isLikelyAuthError) { // <-- Added if condition
    title = "Session Issue";
    description = "Your session may have expired or become invalid. Please try refreshing, or log in again if the problem persists.";
    actions = (
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
        <Button variant="outline" onClick={() => router.push('/sign-in')}>
          Go to Sign In
        </Button>
      </div>
    );
  } // <-- Added closing brace for if condition

  // Add more 'else if' blocks here to detect other specific error types (e.g., network errors)
  // else if (isNetworkError) { ... }

  return (
    <html>
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh', // Use minHeight instead of height for flexibility
          textAlign: 'center', 
          padding: '20px',
          fontFamily: 'sans-serif' // Basic styling
        }}>
          <h2 style={{ marginBottom: '15px', fontSize: '1.5rem' }}>{title}</h2>
          <p style={{ marginBottom: '20px', maxWidth: '400px', color: '#555' }}>{description}</p>
          {actions}

          {/* --- Display Error Details --- */}
          {/* Removed NODE_ENV check to always display */}
          <div style={{ 
              marginTop: '30px', 
              padding: '15px', 
              border: '1px solid #ccc', 
              background: '#f9f9f9', 
              maxWidth: '80%', 
              width: 'fit-content', // Adjust width
              textAlign: 'left',
              overflowX: 'auto' // Handle long lines
            }}>
              <h4 style={{ marginBottom: '10px', color: 'red' }}>Development Error Details:</h4>
              <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Message:</p>
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginBottom: '10px' }}>
                {error?.message}
              </pre>
              <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Stack Trace:</p>
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.8rem' }}>
                {error?.stack}
              </pre>
              {error?.digest && (
                <>
                  <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Digest:</p>
                  <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.8rem' }}>
                    {error.digest}
                  </pre>
                </>
              )}
            </div>
          {/* --------------------------------------------- */}

          {/* Optionally include a link to support */}
          {/* <p style={{ marginTop: '30px', fontSize: '0.9rem' }}>
            If the problem continues, please <a href="/support" style={{ color: 'blue' }}>contact support</a>.
          </p> */}
        </div>
      </body>
    </html>
  )
}
