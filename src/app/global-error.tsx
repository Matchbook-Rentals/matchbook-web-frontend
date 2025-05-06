'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
    setTimeout(reset, 3000);
  }, [error]);

  return (
    <html>
      <body>
        <main style={{ textAlign: 'center', padding: '50px' }}>
          <h1>Something went wrong!</h1>
          <p>An unexpected error has occurred. (2)</p>
          {error.digest && (
            <p>
              Error ID: <code>{error.digest}</code>
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className='border-1'
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
