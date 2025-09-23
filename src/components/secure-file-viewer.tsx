'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, FileWarning } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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

  if (signedUrl && actualFileType === 'document') {
    return (
      <div className={cn('flex flex-col', className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{fileName}</span>
        </div>
        <iframe
          src={signedUrl}
          className="w-full h-96 border rounded-lg"
          title={fileName}
        />
      </div>
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
