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
  const cardSizeClasses = {
    small: 'w-36 h-36',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  };
  const imageSizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-44 h-44',
    large: 'w-60 h-60',
  };
  const nonImageContainerPadding = 'p-3'; // Consistent padding for non-images
  const nonImageIconSize = 'w-8 h-8'; // Fixed small icon size for non-images

  // Get file URL
  const fileUrl = file.fileUrl || getFileUrl(file.fileKey);
  const isImage = isImageFile(file.fileName);
  const extension = getFileExtension(file.fileName).toLowerCase();

  // Function to get the appropriate icon component based on file type
  const FileIconComponent = ({ size }: { size?: string }) => {
    const iconType = getFileIcon(file.fileName);
    const iconSizeClass = size || nonImageIconSize; // Default to small fixed size

    const iconProps = {
      className: `text-gray-400 ${iconSizeClass}`,
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


  if (isImage) {
    // Render Card-based layout for Image Files
    return (
      <Card
        className={`relative overflow-hidden ${cardSizeClasses[previewSize]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        {/* X icon for images */}
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
        {/* Image Content */}
        <div className="flex flex-row-reverse items-center justify-between h-full p-2">
          <div className="relative w-2/3 h-full flex items-center justify-center">
            <Image
              src={fileUrl}
              alt={file.fileName}
              width={1000}
              height={1000}
              className={`object-contain ${imageSizeClasses[previewSize]}`}
            />
          </div>
          {/* File Details & Actions (for images) */}
          <div className="flex flex-col w-1/3">
            <div className="px-1">
              <p className="text-xs font-medium truncate max-w-full" title={file.fileName}>
                {file.fileName}
              </p>
              {file.fileSize && (
                <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
              )}
            </div>
            <div className="flex items-center mt-1 space-x-1">
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
              {/* Add Preview button for images if needed */}
            </div>
            {error && (
              <p className="text-xs text-red-500 mt-1 px-1">{error}</p>
            )}
          </div>
        </div>
      </Card>
    );
  } else {
    // Render Div-based layout for Non-Image Files
    return (
      <div
        className={`relative flex flex-col w-fit ${className} ${onClick ? '' : ''}`} // Use w-fit, remove bg/border/shadow from Card
        onClick={onClick}
      >
        {/* X icon for non-images */}
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            // Adjust positioning if needed for non-card layout
            className="absolute top-0 right-0 z-10 w-5 h-5 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation(); // Prevent div click when removing
              onRemove();
            }}
          >
            <X size={14} />
          </Button>
        )}

        {/* File Info (Icon, Name, Size) - Vertical Stack */}
        <div className="flex items-center  space-x-2 mb-1"> {/* Added mb-1 */}
          <div className="flex-shrink-0"> {/* Removed pt-1 */}
            <FileIconComponent />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-sm font-medium truncate max-w-[300px]" title={file.fileName}>
              {file.fileName}
            </p>
            {file.fileSize && (
              <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
            )}
          </div>
        </div>

        {/* Actions & Error */}
        <div className="flex flex-col items-center"> {/* Stack actions vertically */}
          <div className="flex justify-center items-center ">
            {allowDownload && (
              <Button
                variant="outline" // Use link variant for less visual weight
                size="sm"
                className="  text-xs bg-transparent border-gray-500 hover:bg-transparent hover:text-inherit border  hover:underline" // Minimal styling
                onClick={handleDownload}
                disabled={isLoading}
              >
                <Download size={12} className="mr-1" /> Download
              </Button>
            )}
            {/* Add Preview button if needed, styled similarly */}
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
      </div>
    );
  }
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
