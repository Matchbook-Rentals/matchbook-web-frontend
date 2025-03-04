"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import { FileList, FileObject } from './file-preview';
import { UploadButton, UploadDropzone } from '@/app/utils/uploadthing';
import { formatFileSize } from '@/lib/utils';
import { Button } from './button';

interface FileUploadProps {
  onFilesUploaded?: (files: FileObject[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[]; // e.g. ['image/*', 'application/pdf']
  uploadType?: 'imageUploader' | 'documentUploader' | 'messageUploader';
  className?: string;
  uploadText?: string;
  showPreview?: boolean;
}

export function FileUpload({
  onFilesUploaded,
  onUploadError,
  maxFiles = 10,
  maxSize = 16 * 1024 * 1024, // 16MB
  acceptedFileTypes = ['*'],
  uploadType = 'documentUploader',
  className = '',
  uploadText = 'Upload files or drag and drop',
  showPreview = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    // Notify parent component
    if (onFilesUploaded) {
      onFilesUploaded(newFiles);
    }
  };

  // Handle successful upload
  const handleUploadComplete = (response: { fileUrl: string; fileKey: string; fileName: string; fileSize?: number; fileType?: string }[]) => {
    const uploadedFiles = response.map((file) => ({
      fileUrl: file.fileUrl,
      fileKey: file.fileKey,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
    }));

    const newFiles = [...files, ...uploadedFiles];
    setFiles(newFiles);
    setIsUploading(false);
    setUploadProgress(100);
    setUploadError(null);

    // Notify parent component
    if (onFilesUploaded) {
      onFilesUploaded(newFiles);
    }
  };

  // Handle upload error
  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(error.message || 'Upload failed');

    // Notify parent component
    if (onUploadError) {
      onUploadError(error);
    }
  };

  // Handle upload progress
  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* UploadThing dropzone */}
      <UploadDropzone
        endpoint={uploadType}
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onUploadProgress={handleUploadProgress}
        config={{
          mode: 'auto',
          appendOnPaste: true,
        }}
        content={{
          label: uploadText,
          allowedContent: maxFiles === 1
            ? `Max file size: ${formatFileSize(maxSize)}`
            : `Up to ${maxFiles} files, max ${formatFileSize(maxSize)} each`,
        }}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-gray-400 ut-label:text-lg ut-allowed-content:text-gray-500"
      />

      {/* Error message */}
      {uploadError && (
        <div className="p-2 text-sm text-red-500 bg-red-50 rounded">
          {uploadError}
        </div>
      )}

      {/* Preview of uploaded files */}
      {showPreview && files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Uploaded Files</h3>
          <FileList
            files={files}
            onRemove={handleRemoveFile}
            showRemove={true}
            previewSize="medium"
          />
        </div>
      )}
    </div>
  );
}

interface FileUploadButtonProps {
  onFilesUploaded?: (files: FileObject[]) => void;
  onUploadError?: (error: Error) => void;
  uploadType?: 'imageUploader' | 'documentUploader' | 'messageUploader';
  className?: string;
  buttonText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function FileUploadButton({
  onFilesUploaded,
  onUploadError,
  uploadType = 'documentUploader',
  className = '',
  buttonText = 'Upload Files',
  variant = 'default',
}: FileUploadButtonProps) {
  // Handle successful upload
  const handleUploadComplete = (response: { fileUrl: string; fileKey: string; fileName: string; fileSize?: number; fileType?: string }[]) => {
    const uploadedFiles = response.map((file) => ({
      fileUrl: file.fileUrl,
      fileKey: file.fileKey,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
    }));

    // Notify parent component
    if (onFilesUploaded) {
      onFilesUploaded(uploadedFiles);
    }
  };

  // Handle upload error
  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);

    // Notify parent component
    if (onUploadError) {
      onUploadError(error);
    }
  };

  return (
    <UploadButton
      endpoint={uploadType}
      onClientUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      className={className}
      appearance={{
        button: `ut-button:bg-primary ut-button:hover:bg-primary/90 ut-button:transition-colors ut-button:${variant}`,
        container: "ut-container:flex ut-container:items-center",
        allowedContent: "ut-allowed-content:hidden",
      }}
      content={{
        button: buttonText,
      }}
    />
  );
}