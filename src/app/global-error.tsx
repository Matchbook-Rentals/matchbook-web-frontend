'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {

  return (
    <html>
      <body>
        <main style={{ textAlign: 'center', padding: '50px' }}>
          <h1>Something went wrong!</h1>
          <p>An unexpected error has occurred. (3)</p>
          {error.digest && (
            <p>
              Error ID: <code>{error.digest}</code>
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className='border border-black'
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>

          <p> {error.digest} </p>
        </main>
      </body>
    </html>
  );
}
