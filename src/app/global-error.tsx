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

  // --- Simplified Render Logic ---
  // Removed useEffect, logging, auto-reload, and conditional messages

  const title = "Something Went Wrong";
  const description = "An unexpected error occurred. Please try refreshing the page or signing in again.";
  // Always show both buttons for simplicity
  const actions = (
    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
      <Button onClick={() => window.location.reload()}>
        Refresh Page
      </Button>
      <Button variant="outline" onClick={() => router.push('/sign-in')}>
        Go to Sign In
      </Button>
    </div>
  );

  // The component should return the content directly, without <html> or <body> tags.
  // Next.js wraps this component in the necessary document structure.
  return (
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
  )
}
