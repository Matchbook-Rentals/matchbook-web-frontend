'use client' // Error components must be Client Components


export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {


  // The component should return the content directly, without <html> or <body> tags.
  // Next.js wraps this component in the necessary document structure.
  return (
  <div>
      YOU BROKE IT (This is a drastic interim step at fixing an issue please ignore and refresh)
  </div>
  )
}
