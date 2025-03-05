"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  downloadFile,
  formatFileSize,
  getFileExtension,
  getFileIcon,
  getFileUrl,
  isImageFile
} from '@/lib/utils';

// Import your preferred icon library components
import {
  Download,
  Eye,
  File,
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  FileSpreadsheet,
  X
} from 'lucide-react';

// Define types for file object
export interface FileObject {
  fileUrl?: string;
  fileKey: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  customId?: string;
  isPrivate?: boolean;
}

interface FilePreviewProps {
  file: FileObject;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
  previewSize?: 'small' | 'medium' | 'large';
  allowDownload?: boolean;
  allowPreview?: boolean;
  onClick?: () => void;
}

export function FilePreview({
  file,
  onRemove,
  showRemove = false,
  className = '',
  previewSize = 'medium',
  allowDownload = true,
  allowPreview = true,
  onClick,
}: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define sizes based on previewSize
  const sizes = {
    small: {
      card: 'w-36 h-36',
      image: 'w-32 h-32',
      icon: 'w-12 h-12',
    },
    medium: {
      card: 'w-48 h-48',
      image: 'w-44 h-44',
      icon: 'w-16 h-16',
    },
    large: {
      card: 'w-64 h-64',
      image: 'w-60 h-60',
      icon: 'w-24 h-24',
    },
  };

  // Get file URL
  const fileUrl = file.fileUrl || getFileUrl(file.fileKey);
  const isImage = isImageFile(file.fileName);
  const extension = getFileExtension(file.fileName).toLowerCase();

  // Function to get the appropriate icon component based on file type
  const FileIconComponent = () => {
    const iconType = getFileIcon(file.fileName);

    const iconProps = {
      className: `text-gray-400 ${sizes[previewSize].icon}`,
    };

    switch (iconType) {
      case 'FileText':
        return <FileText {...iconProps} />;
      case 'FileImage':
        return <FileImage {...iconProps} />;
      case 'FileAudio':
        return <FileAudio {...iconProps} />;
      case 'FileVideo':
        return <FileVideo {...iconProps} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  };

  // Handle file download
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let downloadUrl = fileUrl;

      // If the file is private, we need to get a signed URL
      if (file.isPrivate) {
        const response = await fetch('/api/get-signed-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileKey: file.fileKey,
            customId: file.customId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get download URL');
        }

        const data = await response.json();
        downloadUrl = data.signedUrl;
      }

      // Download the file
      downloadFile(downloadUrl, file.fileName);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file preview
  const handlePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let previewUrl = fileUrl;

      // If the file is private, we need to get a signed URL
      if (file.isPrivate) {
        const response = await fetch('/api/get-signed-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileKey: file.fileKey,
            customId: file.customId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get preview URL');
        }

        const data = await response.json();
        previewUrl = data.signedUrl;
      }

      // Open the file in a new tab for preview
      window.open(previewUrl, '_blank');
    } catch (err) {
      console.error('Error previewing file:', err);
      setError('Failed to preview file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`relative overflow-hidden ${sizes[previewSize].card} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Remove button if showRemove is true */}
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 z-10 w-6 h-6 bg-white/80 hover:bg-white/90 rounded-full"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when removing
            onRemove();
          }}
        >
          <X size={14} />
        </Button>
      )}

      {/* File preview/icon */}
      <div className="flex flex-col items-center justify-center h-full p-2">
        {isImage ? (
          <div className="relative w-full h-3/4 flex items-center justify-center">
            <Image
              src={fileUrl}
              alt={file.fileName}
              width={500}
              height={500}
              className={`object-contain ${sizes[previewSize].image}`}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-3/4">
            <FileIconComponent />
          </div>
        )}

        {/* File name */}
        <div className="text-center mt-1 px-1">
          <p className="text-xs font-medium truncate max-w-full" title={file.fileName}>
            {file.fileName}
          </p>
          {file.fileSize && (
            <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center mt-1 space-x-1">
          {allowDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDownload}
              disabled={isLoading}
            >
              <Download size={14} />
            </Button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500 text-center mt-1">{error}</p>
        )}
      </div>
    </Card>
  );
}

interface FileListProps {
  files: FileObject[];
  onRemove?: (index: number) => void;
  showRemove?: boolean;
  previewSize?: 'small' | 'medium' | 'large';
  className?: string;
}

export function FileList({
  files,
  onRemove,
  showRemove = false,
  previewSize = 'medium',
  className = '',
}: FileListProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
      {files.map((file, index) => (
        <FilePreview
          key={file.fileKey || index}
          file={file}
          showRemove={showRemove}
          previewSize={previewSize}
          onRemove={onRemove ? () => onRemove(index) : undefined}
        />
      ))}
    </div>
  );
}