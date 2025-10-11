'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, FileWarning, Download, Eye } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BrandButton } from '@/components/ui/brandButton';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '@/lib/pdfWorker';

interface SecureFileViewerProps {
  fileKey?: string;
  customId?: string;
  fileName?: string;
  fileType?: 'image' | 'document' | 'auto';
  className?: string;
  alt?: string;
  onError?: (error: Error) => void;
  showPreview?: boolean;
  width?: number;
  height?: number;
  fallbackUrl?: string;
}

export function SecureFileViewer({
  fileKey,
  customId,
  fileName = 'Secure Document',
  fileType = 'image',
  className,
  alt,
  onError,
  showPreview = true,
  width = 200,
  height = 200,
  fallbackUrl,
}: SecureFileViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (fileKey || customId) {
      fetchSignedUrl();
    } else if (fallbackUrl) {
      // Use fallback URL directly for backward compatibility
      setSignedUrl(fallbackUrl);
      setLoading(false);
    }
  }, [fileKey, customId, fallbackUrl]);

  const fetchSignedUrl = async () => {
    if (!fileKey && !customId) {
      setError('No file identifier provided');
      return;
    }

    console.log('Fetching signed URL for:', { fileKey, customId, fileName });
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/get-private-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          customId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch secure URL');
      }

      const data = await response.json();
      console.log('Received signed URL response:', data);
      
      // Handle both string and object responses
      const url = typeof data.signedUrl === 'string' 
        ? data.signedUrl 
        : data.signedUrl?.url;
        
      if (!url) {
        throw new Error('No URL in response');
      }
      
      setSignedUrl(url);

      // Set a timer to refresh the URL before it expires
      const expiresIn = (data.expiresIn || 3600) * 1000; // Convert to milliseconds
      const refreshTime = expiresIn * 0.9; // Refresh at 90% of expiration time

      setTimeout(() => {
        fetchSignedUrl(); // Refresh the signed URL
      }, refreshTime);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load secure file';
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!fileKey && !customId && !fallbackUrl) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gray-100 rounded-lg p-4',
        className
      )}>
        <FileWarning className="h-8 w-8 text-gray-400 mr-2" />
        <span className="text-gray-500">No file available</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gray-100 rounded-lg p-4',
        className
      )}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center bg-red-50 rounded-lg p-4',
        className
      )}>
        <FileWarning className="h-8 w-8 text-red-500 mb-2" />
        <span className="text-red-600 text-sm text-center">{error}</span>
        <button
          onClick={fetchSignedUrl}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // Determine actual file type if auto
  const actualFileType = fileType === 'auto'
    ? (signedUrl && typeof signedUrl === 'string' && (signedUrl.includes('.pdf') || fileName?.toLowerCase().includes('.pdf')) ? 'document' : 'image')
    : fileType;

  const isPdf = signedUrl && typeof signedUrl === 'string' &&
    (signedUrl.includes('.pdf') || fileName?.toLowerCase().includes('.pdf'));

  if (signedUrl && actualFileType === 'image') {
    return (
      <div className={cn('relative group bg-gray-100 rounded-lg max-h-[300px] flex items-center justify-center', className)}>
        <img
          src={signedUrl}
          alt={alt || fileName}
          className="w-full h-full  object-contain rounded-lg max-h-[280px] aspect-square"
          onError={() => {
            setError('Failed to load image');
            setSignedUrl(null);
          }}
        />
      </div>
    );
  }

  if (signedUrl && actualFileType === 'document' && isPdf) {
    // Render PDF as square thumbnail with filename and buttons
    return (
      <>
        <div className={cn('relative group bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4 aspect-square overflow-hidden', className)}>
          {/* File name */}
          <div className="flex-1 flex items-center justify-center px-2 w-full">
            <span className="text-sm font-medium text-gray-700 text-center line-clamp-4 break-words max-w-full overflow-hidden">
              {fileName}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 mb-2 flex items-center gap-2">
            {/* View Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              className="w-8 h-8 rounded-md bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
              title="View PDF"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(signedUrl, '_blank');
              }}
              className="w-8 h-8 rounded-md bg-secondaryBrand hover:bg-primaryBrand text-white flex items-center justify-center transition-colors"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-[95vw] w-auto max-h-[90vh]">
            <div className="max-h-[80vh] overflow-y-auto overflow-x-auto pt-12 px-6 pb-6">
              <Document
                file={signedUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center p-8">
                    <FileWarning className="h-8 w-8 text-red-500 mb-2" />
                    <span className="text-red-600 text-sm text-center">Failed to load PDF</span>
                  </div>
                }
                className="mx-auto"
              >
                {Array.from({ length: numPages }, (_, index) => (
                  <div key={index} className="mb-4 flex justify-center">
                    <Page
                      pageNumber={index + 1}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      width={Math.min(700, window.innerWidth * 0.85)}
                      loading={
                        <div className="flex items-center justify-center p-4 bg-gray-100">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        </div>
                      }
                    />
                  </div>
                ))}
              </Document>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (signedUrl && actualFileType === 'document') {
    // Non-PDF document - show icon
    return (
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'relative group bg-gray-100 rounded-lg max-h-[300px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors p-4',
          className
        )}
      >
        {/* PDF Icon */}
        <svg
          className="w-16 h-16 text-red-500 mb-2"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <path d="M14 2v6h6" fill="white" />
          <path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v1.5" stroke="white" strokeWidth="1" fill="none" />
          <path d="M13 13h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5H13v-4.5z" stroke="white" strokeWidth="1" fill="none" />
          <path d="M17 13h2v1.5h-2v1.5h2" stroke="white" strokeWidth="1" fill="none" />
        </svg>

        {/* File name */}
        <span className="text-sm font-medium text-gray-700 text-center px-2 line-clamp-2">
          {fileName}
        </span>

        {/* Hover overlay with "Click to view" hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-all flex items-end justify-center pb-2">
          <span className="opacity-0 group-hover:opacity-100 text-xs text-gray-600 font-medium transition-opacity">
            Click to view
          </span>
        </div>
      </a>
    );
  }

  return null;
}

// Batch viewer for multiple secure files
interface SecureFileListProps {
  files: Array<{
    fileKey?: string;
    customId?: string;
    fileName?: string;
    isPrimary?: boolean;
  }>;
  fileType?: 'image' | 'document';
  className?: string;
  onRemove?: (index: number) => void;
}

export function SecureFileList({
  files,
  fileType = 'image',
  className,
  onRemove,
}: SecureFileListProps) {
  return (
    <div className={cn(' flex flex-wrap justify-center gap-3', className)}>
      {files.map((file, index) => (
        <div key={index} className="relative w-[280px] h-[280px]">
          <SecureFileViewer
            fileKey={file.fileKey}
            customId={file.customId}
            fileName={file.fileName}
            fileType={fileType}
            className="w-full h-full"
          />
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="absolute -top-1 -right-1 w-8 h-8 bg-black/30 hover:bg-black/80 text-white hover:text-red-500 rounded-full flex items-center justify-center z-10 shadow-md transition-colors duration-200 transform translate-y-5"
              aria-label="Delete file"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
