'use client';

import dynamic from 'next/dynamic';

// Dynamically import PDFEditor with no SSR to avoid server-side DOM issues
const PDFEditor = dynamic(() => import('@/components/pdf-editor/PDFEditor').then(mod => ({ default: mod.PDFEditor })), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading PDF Editor...</p>
      </div>
    </div>
  )
});

export default function LeaseSigning() {
  return <PDFEditor />;
}